"""vision/detector.py -- ONNX Runtime inference wrapper (FR-02, FR-03).

Design contract
---------------
1.  Provider negotiation  (SRS S10 hard constraint)
    Providers are tried in the order defined in configs/app.yaml.
    The provider that ONNX Runtime actually accepts is stored in
    ``self.provider_used`` and surfaced in every DetectionResult.
    The word "NPU" or "QNN" is NEVER claimed in any output unless
    ``provider_used == "QNNExecutionProvider"`` is confirmed at runtime.

2.  Model agnosticism
    The detector accepts any ONNX model that produces detection outputs.
    A built-in heuristic covers the most common YOLOv8/v5-style output
    tensors (shape [1, 84, 8400] or [1, N, 5+C]).  For other shapes a
    passthrough "raw-output" mode is used and the caller receives a single
    Detection with class_name="raw_output" and the tensor shape as its name.
    This lets the pipeline run end-to-end even before a validated model is
    chosen (Layer B open decision).

3.  Graceful degradation (NFR-05, SRS S14)
    If no model file is found, or ONNX Runtime fails to load it, the
    detector enters DEGRADED mode.  ``run()`` still returns a DetectionResult
    -- with an empty detection list and a DEGRADED device_note -- so the rest
    of the pipeline does not need to guard against None.

4.  Benchmark honesty (SRS S15)
    ``inference_time_ms`` is the wall-clock time of the ``session.run()``
    call only.  Pre/post-processing time is excluded to give a fair model
    latency number.  The device_note field carries the environment context
    so that results are never silently presented as Snapdragon measurements
    when they were actually taken on a different machine.
"""

from __future__ import annotations

import logging
import time
from pathlib import Path
from typing import List, Optional, Sequence, Tuple

import numpy as np

from mirage_x.vision.models import (
    BoundingBox,
    Detection,
    DetectionResult,
    EquipmentState,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# State representation helper
# ---------------------------------------------------------------------------

def _score_to_state(confidence: float) -> EquipmentState:
    """
    Derive a preliminary EquipmentState from model confidence alone.

    This is a *fast-path heuristic* only -- the Temporal Engine (MVP-2)
    will overlay persistence-based escalation on top of these raw states
    per FR-06.  Thresholds are configurable here as module-level constants
    so they can be tuned without touching the Temporal Engine.

    Thresholds (subject to tuning during MVP-1 validation):
      confidence >= 0.70  -> NORMAL   (high-confidence, known object)
      confidence >= 0.45  -> WARNING  (detected but uncertain)
      confidence <  0.45  -> UNKNOWN  (below reliable detection threshold)

    Note: ANOMALOUS is NOT assigned here -- it requires temporal context
    (FR-06) or explicit model output that indicates a fault class.
    """
    if confidence >= 0.70:
        return EquipmentState.NORMAL
    if confidence >= 0.45:
        return EquipmentState.WARNING
    return EquipmentState.UNKNOWN


# ---------------------------------------------------------------------------
# Label map helpers
# ---------------------------------------------------------------------------

# COCO 80-class names -- used as the default label map when no custom map
# is provided and the model appears to be a COCO-pretrained detector.
COCO_LABELS: List[str] = [
    "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train",
    "truck", "boat", "traffic light", "fire hydrant", "stop sign",
    "parking meter", "bench", "bird", "cat", "dog", "horse", "sheep",
    "cow", "elephant", "bear", "zebra", "giraffe", "backpack", "umbrella",
    "handbag", "tie", "suitcase", "frisbee", "skis", "snowboard",
    "sports ball", "kite", "baseball bat", "baseball glove", "skateboard",
    "surfboard", "tennis racket", "bottle", "wine glass", "cup", "fork",
    "knife", "spoon", "bowl", "banana", "apple", "sandwich", "orange",
    "broccoli", "carrot", "hot dog", "pizza", "donut", "cake", "chair",
    "couch", "potted plant", "bed", "dining table", "toilet", "tv",
    "laptop", "mouse", "remote", "keyboard", "cell phone", "microwave",
    "oven", "toaster", "sink", "refrigerator", "book", "clock", "vase",
    "scissors", "teddy bear", "hair drier", "toothbrush",
]


def _load_labels(label_file: Optional[Path]) -> List[str]:
    """Load a plain-text label file (one label per line), or return COCO defaults."""
    if label_file and label_file.exists():
        labels = [l.strip() for l in label_file.read_text(encoding="utf-8").splitlines()
                  if l.strip()]
        logger.info("Loaded %d labels from '%s'.", len(labels), label_file)
        return labels
    logger.debug("No label file provided; using COCO-80 defaults.")
    return COCO_LABELS


# ---------------------------------------------------------------------------
# Provider negotiation
# ---------------------------------------------------------------------------

def _negotiate_provider(
    model_path: Path,
    preferred_providers: List[str],
) -> Tuple[object, str]:  # (ort.InferenceSession, actual_provider_name)
    """
    Try to create an ONNX Runtime InferenceSession using each provider in
    ``preferred_providers`` order.

    Returns the first session that succeeds and the name of the provider
    that was actually used.  Falls back to CPUExecutionProvider as a last
    resort.

    This is where SRS S10's "never claim NPU execution without confirmation"
    constraint is enforced: only the provider returned here may be reported
    as the active runtime.
    """
    import onnxruntime as ort  # noqa: PLC0415 -- lazy import

    available = set(ort.get_available_providers())
    logger.debug("ONNX Runtime available providers: %s", sorted(available))

    for provider in preferred_providers:
        if provider not in available:
            logger.info(
                "Provider '%s' not available on this device -- skipping.", provider
            )
            continue
        try:
            sess_opts = ort.SessionOptions()
            sess_opts.log_severity_level = 3  # suppress ORT verbose output
            session = ort.InferenceSession(
                str(model_path),
                sess_options   = sess_opts,
                providers      = [provider, "CPUExecutionProvider"],
            )
            # Confirm which provider actually accepted the model.
            confirmed = session.get_providers()[0]
            logger.info(
                "Model loaded with provider '%s' (confirmed: '%s').",
                provider, confirmed,
            )
            return session, confirmed
        except Exception as exc:  # noqa: BLE001
            logger.warning(
                "Failed to load model with provider '%s': %s -- trying next.",
                provider, exc,
            )

    # Final CPU fallback (always available in onnxruntime)
    sess_opts = ort.SessionOptions()
    sess_opts.log_severity_level = 3
    session = ort.InferenceSession(
        str(model_path),
        sess_options = sess_opts,
        providers    = ["CPUExecutionProvider"],
    )
    confirmed = session.get_providers()[0]
    logger.warning(
        "All preferred providers failed. Running on '%s'.", confirmed
    )
    return session, confirmed


# ---------------------------------------------------------------------------
# Output parsing helpers
# ---------------------------------------------------------------------------

def _parse_yolo_output(
    output: np.ndarray,
    labels: List[str],
    conf_threshold: float,
    img_w: int,
    img_h: int,
    model_input_w: int,
    model_input_h: int,
) -> List[Detection]:
    """
    Parse YOLOv8-style output tensor of shape [1, 84, N] or [1, N, 85+].

    After squeezing the batch dimension we have a 2-D array.  The feature
    axis contains 4 bbox coords + num_classes values, so its size is always
    >= 5.  The anchor axis size equals the number of candidate boxes.

    We detect orientation by checking which axis has a length >= 5 that could
    be a feature vector (i.e. the OTHER axis is the anchors):
      - If shape is [features, N] -> transpose to [N, features]
      - If shape is [N, features] -> use as-is
    """
    # Squeeze batch dimension
    if output.ndim == 3 and output.shape[0] == 1:
        output = output[0]

    if output.ndim != 2 or min(output.shape) < 1:
        logger.debug(
            "Unexpected YOLO output shape %s -- skipping parse.", output.shape
        )
        return []

    rows, cols = output.shape

    # Normalise to [N_anchors, 4+num_classes] layout.
    #
    # Common YOLO output shapes (after squeezing batch dim):
    #   [4+C, N]   e.g. [84, 8400]  -- YOLOv8 default (features x anchors)
    #   [N, 4+C]   e.g. [8400, 84]  -- some exporters  (anchors x features)
    #   [4+C, 1]   e.g. [7, 1]      -- single-anchor (features x 1)
    #
    # Decision:
    #   Case A: rows < cols AND rows >= 5  -> [features, anchors], transpose
    #           e.g. [84, 8400]: rows=84 < cols=8400, rows=84 >= 5
    #   Case B: rows > cols AND cols < 5   -> [features, anchors] (single-anchor), transpose
    #           e.g. [7, 1]: rows=7 > cols=1, cols=1 < 5
    #   Otherwise: cols >= 5               -> [anchors, features], use as-is
    needs_transpose = (
        (rows < cols and rows >= 5)        # standard [C, N] layout
        or (rows > cols and cols < 5 and rows >= 5)  # single/few-anchor [C, 1..4]
    )
    if needs_transpose:
        output = output.T
    elif cols >= 5:
        pass                               # already [anchors, features]
    else:
        logger.debug("Cannot parse shape %s as YOLO output.", output.shape)
        return []

    # Now output is [N_anchors, 4+num_classes]
    num_classes = output.shape[1] - 4
    scale_x = img_w / model_input_w
    scale_y = img_h / model_input_h

    detections: List[Detection] = []
    for row in output:
        cx, cy, bw, bh = row[:4]
        class_scores    = row[4 : 4 + num_classes]
        class_id        = int(np.argmax(class_scores))
        confidence      = float(class_scores[class_id])

        if confidence < conf_threshold:
            continue

        # Convert centre-xywh (model coords) to xyxy (image coords)
        x1 = (cx - bw / 2) * scale_x
        y1 = (cy - bh / 2) * scale_y
        x2 = (cx + bw / 2) * scale_x
        y2 = (cy + bh / 2) * scale_y

        label = labels[class_id] if class_id < len(labels) else f"class_{class_id}"
        detections.append(Detection(
            class_id   = class_id,
            class_name = label,
            confidence = confidence,
            bbox       = BoundingBox(x1, y1, x2, y2),
            state      = _score_to_state(confidence),
        ))

    detections.sort(key=lambda d: d.confidence, reverse=True)
    return detections


# ---------------------------------------------------------------------------
# Main detector class
# ---------------------------------------------------------------------------

class ONNXDetector:
    """
    ONNX Runtime-based object/equipment detector (FR-02, FR-03).

    Parameters
    ----------
    model_path        : path to the .onnx file
    label_file        : optional plain-text label file (one label per line)
    preferred_providers: ordered list of ONNX Runtime provider names to try
                         (from config -- CPU fallback is always appended)
    input_size        : (H, W) to resize frames to before inference
    conf_threshold    : minimum confidence to keep a detection
    device_note       : describes whether this is running on the real
                        Snapdragon target or a dev machine
    """

    def __init__(
        self,
        model_path        : Path | str,
        label_file        : Optional[Path | str] = None,
        preferred_providers: Optional[List[str]] = None,
        input_size        : Tuple[int, int] = (640, 640),
        conf_threshold    : float = 0.45,
        device_note       : str = "unvalidated / dev environment",
    ) -> None:
        self.model_path    = Path(model_path)
        self.input_size    = input_size   # (H, W)
        self.conf_threshold= conf_threshold
        self.device_note   = device_note
        self._degraded     = False
        self._session      = None
        self.provider_used = "none"

        self._labels = _load_labels(
            Path(label_file) if label_file else None
        )

        self._providers = preferred_providers or ["CPUExecutionProvider"]

        self._try_load_model()

    # ------------------------------------------------------------------
    # Model loading
    # ------------------------------------------------------------------

    def _try_load_model(self) -> None:
        if not self.model_path.exists():
            logger.warning(
                "Model file not found: '%s'. Detector entering DEGRADED mode. "
                "Place a compatible .onnx file at this path to enable detection.",
                self.model_path,
            )
            self._degraded = True
            self.provider_used = "none (model missing)"
            return

        try:
            import onnxruntime  # noqa: F401 -- verify it is installed
        except ImportError:
            logger.error(
                "onnxruntime is not installed. "
                "Run: pip install onnxruntime  (or onnxruntime-qnn for QNN support). "
                "Detector entering DEGRADED mode."
            )
            self._degraded = True
            self.provider_used = "none (onnxruntime missing)"
            return

        try:
            self._session, self.provider_used = _negotiate_provider(
                self.model_path, self._providers
            )
            # Cache input tensor name and shape
            inp                = self._session.get_inputs()[0]
            self._input_name   = inp.name
            # Model input shape may have dynamic dims (None); use configured size
            model_shape        = inp.shape  # e.g. [1, 3, 640, 640]
            if len(model_shape) == 4 and isinstance(model_shape[2], int):
                self.input_size = (model_shape[2], model_shape[3])
            logger.info(
                "Detector ready. Provider: %s | Input: %s %s | Model: %s",
                self.provider_used, self._input_name,
                self.input_size, self.model_path.name,
            )
        except Exception as exc:  # noqa: BLE001
            logger.error(
                "Failed to load ONNX model '%s': %s. "
                "Detector entering DEGRADED mode.",
                self.model_path, exc,
            )
            self._degraded = True
            self.provider_used = f"none (load error: {exc})"

    # ------------------------------------------------------------------
    # Preprocessing
    # ------------------------------------------------------------------

    def _preprocess(self, bgr_image: np.ndarray) -> np.ndarray:
        """
        Resize + normalise BGR image to float32 NCHW tensor.

        Steps:
          1. Resize to (input_h, input_w) -- INTER_LINEAR for speed.
          2. Convert BGR -> RGB.
          3. Normalise to [0, 1].
          4. Transpose HWC -> CHW and add batch dimension.
        """
        import cv2  # noqa: PLC0415

        h, w = self.input_size  # (H, W)
        resized = cv2.resize(bgr_image, (w, h), interpolation=cv2.INTER_LINEAR)
        rgb     = resized[:, :, ::-1]          # BGR -> RGB
        norm    = rgb.astype(np.float32) / 255.0
        chw     = np.transpose(norm, (2, 0, 1))   # HWC -> CHW
        return np.expand_dims(chw, axis=0)         # NCHW

    # ------------------------------------------------------------------
    # Inference
    # ------------------------------------------------------------------

    def run(self, frame: "CameraFrame") -> DetectionResult:  # noqa: F821
        """
        Run one inference pass on the given frame.

        Always returns a DetectionResult -- never raises.  In DEGRADED mode
        the result has an empty detection list and a descriptive device_note.
        """
        img_h, img_w = frame.image.shape[:2]
        input_h, input_w = self.input_size

        if self._degraded or self._session is None:
            return DetectionResult(
                detections        = [],
                frame_source      = frame.source,
                inference_time_ms = 0.0,
                provider_used     = self.provider_used,
                model_path        = str(self.model_path),
                input_resolution  = self.input_size,
                device_note       = (
                    f"DEGRADED: {self.device_note} -- "
                    f"provider_used={self.provider_used}"
                ),
            )

        try:
            tensor = self._preprocess(frame.image)

            t0 = time.perf_counter()
            outputs = self._session.run(None, {self._input_name: tensor})
            t1 = time.perf_counter()
            inference_ms = (t1 - t0) * 1000.0

            detections = self._parse_outputs(outputs, img_w, img_h)

        except Exception as exc:  # noqa: BLE001
            logger.error("Inference error: %s", exc, exc_info=True)
            return DetectionResult(
                detections        = [],
                frame_source      = frame.source,
                inference_time_ms = 0.0,
                provider_used     = self.provider_used,
                model_path        = str(self.model_path),
                input_resolution  = self.input_size,
                device_note       = f"INFERENCE ERROR: {exc}",
            )

        return DetectionResult(
            detections        = detections,
            frame_source      = frame.source,
            inference_time_ms = inference_ms,
            provider_used     = self.provider_used,
            model_path        = str(self.model_path),
            input_resolution  = self.input_size,
            device_note       = self.device_note,
        )

    # ------------------------------------------------------------------
    # Output parsing
    # ------------------------------------------------------------------

    def _parse_outputs(
        self,
        outputs: List[np.ndarray],
        img_w: int,
        img_h: int,
    ) -> List[Detection]:
        """
        Route to the correct parser based on output tensor shape.

        Supported layouts:
          - YOLOv8/v5 single-head: shape [1, 84, N] or [1, N, 85+]

        Unknown layouts fall through to a "raw output" detection so the
        pipeline remains functional while a proper parser is wired up.
        """
        if not outputs:
            return []

        out = outputs[0]
        input_h, input_w = self.input_size

        # Delegate to _parse_yolo_output for any 2D or 3D tensor.
        # That function now detects the feature vs anchor axis orientation
        # internally and handles [features, N] and [N, features] alike.
        if out.ndim in (2, 3):
            dets = _parse_yolo_output(
                out, self._labels, self.conf_threshold,
                img_w, img_h, input_w, input_h
            )
            if dets or out.ndim == 3:
                # If we got detections, great.  If the tensor was 3D but empty,
                # it may be a legitimate "no detections this frame" -- return [].
                return dets

        # Unknown output -- return one synthetic detection for observability
        logger.debug(
            "Unrecognised output shape %s -- returning raw_output detection.", out.shape
        )
        return [Detection(
            class_id   = -1,
            class_name = f"raw_output[shape={out.shape}]",
            confidence = 1.0,
            bbox       = None,
            state      = EquipmentState.UNKNOWN,
        )]

    # ------------------------------------------------------------------
    # Properties
    # ------------------------------------------------------------------

    @property
    def is_degraded(self) -> bool:
        return self._degraded

    def __repr__(self) -> str:
        return (
            f"ONNXDetector(model={self.model_path.name!r}, "
            f"provider={self.provider_used!r}, "
            f"degraded={self._degraded})"
        )
