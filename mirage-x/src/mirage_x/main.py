"""
MIRAGE-X application entry point (none) MVP-1 (NPU Vision Pipeline).

End-to-end loop:
    Camera frame  ->  ONNXDetector  ->  LatencyMeter
    ->  print equipment state + latency + confirmed provider

Design invariants enforced here
--------------------------------
1. Any single modality failure (camera, model) is handled gracefully;
   the loop continues in a clearly-labelled DEGRADED mode (NFR-05, SRS S14).
2. The confirmed execution provider is printed on every iteration (none)
   NPU / QNN execution is NEVER claimed without runtime confirmation (SRS S10).
3. No hard-coded secrets or API keys (SRS S13).
4. Core loop works with no internet connection (NFR-02).
5. Benchmark numbers carry a device_note so they are never silently
   presented as Snapdragon measurements when run on a dev machine (SRS S15).
"""

from __future__ import annotations

import argparse
import logging
import signal
import sys
import time
from pathlib import Path

from mirage_x.benchmarking.metrics import LatencyMeter
from mirage_x.input.camera import CameraCapture, CameraStatus, make_mock_frame
from mirage_x.utils.config import load_config
from mirage_x.utils.logging_setup import setup_logging
from mirage_x.vision.detector import ONNXDetector
from mirage_x.vision.models import EquipmentState

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Repository root (none) used to resolve relative paths
# ---------------------------------------------------------------------------
_REPO_ROOT = Path(__file__).resolve().parents[2]  # src/ -> repo root

# ---------------------------------------------------------------------------
# Graceful shutdown flag
# ---------------------------------------------------------------------------
_SHUTDOWN = False


def _handle_sigint(sig, frame) -> None:  # noqa: ANN001
    global _SHUTDOWN
    _SHUTDOWN = True
    print("\n[MIRAGE-X] Shutdown signal received (none) stopping after current frame.")


# ---------------------------------------------------------------------------
# Argument parser
# ---------------------------------------------------------------------------

def _build_arg_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog        = "mirage-x",
        description = "MIRAGE-X MVP-1 (none) NPU Vision Pipeline",
    )
    p.add_argument(
        "--config", type=Path, default=None,
        help="Path to app.yaml (default: configs/app.yaml in repo root).",
    )
    p.add_argument(
        "--model", type=Path, default=None,
        help=(
            "Path to .onnx model file. "
            "Default: models/vision/model.onnx relative to repo root."
        ),
    )
    p.add_argument(
        "--labels", type=Path, default=None,
        help="Path to label file (one class per line). Default: COCO-80.",
    )
    p.add_argument(
        "--camera", type=int, default=0,
        help="Camera device index (default: 0).",
    )
    p.add_argument(
        "--frames", type=int, default=0,
        help="Number of frames to process then exit (0 = run until Ctrl-C).",
    )
    p.add_argument(
        "--mock-camera", action="store_true",
        help=(
            "Use synthetic frames instead of a real camera. "
            "Useful for model-only benchmarking without a webcam."
        ),
    )
    p.add_argument(
        "--device-note", type=str,
        default="unvalidated / dev environment",
        help=(
            "Free-text note that tags all benchmark records with the "
            "measurement context (e.g. 'HP Snapdragon X Elite, target device'). "
            "NEVER claim NPU execution here unless runtime has confirmed it."
        ),
    )
    p.add_argument(
        "--input-size", type=int, nargs=2, default=None,
        metavar=("H", "W"),
        help="Override model input resolution (H W), e.g. --input-size 640 640.",
    )
    p.add_argument(
        "--conf-threshold", type=float, default=0.45,
        help="Minimum detection confidence to keep (default: 0.45).",
    )
    p.add_argument(
        "--verbose", "-v", action="store_true",
        help="Enable DEBUG-level logging.",
    )
    return p


# ---------------------------------------------------------------------------
# State display helpers
# ---------------------------------------------------------------------------

_STATE_ICONS = {
    EquipmentState.NORMAL:    "[OK]     NORMAL",
    EquipmentState.WARNING:   "[WARN]   WARNING",
    EquipmentState.ANOMALOUS: "[ALERT]  ANOMALOUS",
    EquipmentState.UNKNOWN:   "[?]      UNKNOWN",
}


def _print_frame_result(
    frame_idx    : int,
    result,        # DetectionResult
    meter,         # LatencyMeter
) -> None:
    """Print a one-line summary for each processed frame."""
    state      = result.top_state
    state_str  = _STATE_ICONS.get(state, state.value)
    n_det      = len(result.detections)
    fps        = meter.rolling_fps
    lat_ms     = result.inference_time_ms
    provider   = result.provider_used

    # Build detection label string (top-3 only to keep line short)
    top_dets = result.detections[:3]
    det_strs = [
        f"{d.class_name}({d.confidence:.2f})" for d in top_dets
    ]
    det_summary = ", ".join(det_strs) if det_strs else "(none)"

    print(
        f"[Frame {frame_idx:>5}] "
        f"State: {state_str:<20} | "
        f"Detections: {n_det:>2} [{det_summary}] | "
        f"Latency: {lat_ms:>7.2f} ms | "
        f"FPS: {fps:>6.2f} | "
        f"Provider: {provider}"
    )


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def run_mvp1_pipeline(
    config_path   : Path | None,
    model_path    : Path,
    label_file    : Path | None,
    camera_index  : int,
    max_frames    : int,
    use_mock      : bool,
    device_note   : str,
    input_size    : tuple | None,
    conf_threshold: float,
) -> None:
    """
    Execute the MVP-1 end-to-end vision pipeline.

    This function owns the lifecycle of camera + detector + meter and
    handles all degraded/error states without raising to the caller.
    """
    # ------------------------------------------------------------------
    # Load config
    # ------------------------------------------------------------------
    cfg = load_config(config_path)
    logger.info("Config loaded. offline_first=%s, providers=%s",
                cfg.offline_first, cfg.execution.providers)

    # ------------------------------------------------------------------
    # Build detector
    # ------------------------------------------------------------------
    ort_providers = cfg.execution.ort_providers()
    det_input_size = tuple(input_size) if input_size else (640, 640)

    detector = ONNXDetector(
        model_path         = model_path,
        label_file         = label_file,
        preferred_providers= ort_providers,
        input_size         = det_input_size,
        conf_threshold     = conf_threshold,
        device_note        = device_note,
    )

    if detector.is_degraded:
        print(
            "\n[MIRAGE-X] WARNING: Detector is in DEGRADED mode.\n"
            f"  Model path    : {model_path}\n"
            f"  Provider used : {detector.provider_used}\n"
            "  Detection results will be empty until a valid model is present.\n"
            "  Place a YOLOv8-compatible .onnx file at the model path to enable detection.\n"
        )
    else:
        print(
            f"\n[MIRAGE-X] Detector ready.\n"
            f"  Model         : {model_path.name}\n"
            f"  Provider      : {detector.provider_used}  <- CONFIRMED at runtime\n"
            f"  Input size    : {det_input_size[1]}x{det_input_size[0]}\n"
            f"  Device note   : {device_note}\n"
        )

    # ------------------------------------------------------------------
    # Build camera source
    # ------------------------------------------------------------------
    meter  = LatencyMeter(window_size=30)
    camera = None

    if not use_mock:
        camera = CameraCapture(
            device_index = camera_index,
            width        = cfg.camera.width,
            height       = cfg.camera.height,
        )
        opened = camera.start()
        if not opened:
            print(
                f"[MIRAGE-X] [!]  Camera {camera_index} unavailable (none) "
                "switching to MOCK FRAMES.  (Real camera required for live demo.)"
            )
            use_mock = True

    mode_label = "MOCK FRAMES" if use_mock else f"CAMERA:{camera_index}"
    print(f"[MIRAGE-X] Frame source : {mode_label}")
    print(f"[MIRAGE-X] Max frames   : {'unlimited' if max_frames == 0 else max_frames}")
    print("[MIRAGE-X] Press Ctrl-C to stop.\n")

    # ------------------------------------------------------------------
    # Main loop
    # ------------------------------------------------------------------
    frame_idx = 0
    try:
        while not _SHUTDOWN:
            if max_frames > 0 and frame_idx >= max_frames:
                break

            # Acquire frame
            if use_mock:
                frame = make_mock_frame(
                    width  = cfg.camera.width,
                    height = cfg.camera.height,
                )
            else:
                frame = camera.read_frame()
                if frame is None:
                    # Camera degraded mid-run
                    print(
                        "[MIRAGE-X] Camera read returned None (none) "
                        "switching to MOCK FRAMES for remainder of run."
                    )
                    use_mock = True
                    continue

            # Run detection
            result = detector.run(frame)

            # Record benchmark
            fb = meter.record(result)

            # Display
            _print_frame_result(frame_idx, result, meter)

            frame_idx += 1

            # Throttle mock-frame loop to ~30 fps equivalent
            if use_mock and not detector.is_degraded:
                time.sleep(max(0, 1 / 30 - result.inference_time_ms / 1000))

    except KeyboardInterrupt:
        pass  # handled via SIGINT handler

    # ------------------------------------------------------------------
    # Shutdown & summary
    # ------------------------------------------------------------------
    if camera and camera.status != CameraStatus.STOPPED:
        camera.stop()

    summary = meter.summarise()
    if summary:
        # Fill in model info now that we have it
        summary.model_path       = str(model_path)
        summary.input_resolution = det_input_size
        print(f"\n{summary}")
    else:
        print("\n[MIRAGE-X] No frames were processed (none) no benchmark to report.")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    signal.signal(signal.SIGINT, _handle_sigint)

    args = _build_arg_parser().parse_args()

    setup_logging(
        level    = logging.DEBUG if args.verbose else logging.INFO,
        log_file = _REPO_ROOT / "logs" / "mirage_x.log",
    )

    logger.info("MIRAGE-X MVP-1 starting.")

    # Resolve model path
    model_path: Path = (
        args.model
        if args.model
        else _REPO_ROOT / "models" / "vision" / "model.onnx"
    )

    run_mvp1_pipeline(
        config_path    = args.config,
        model_path     = model_path,
        label_file     = args.labels,
        camera_index   = args.camera,
        max_frames     = args.frames,
        use_mock       = args.mock_camera,
        device_note    = args.device_note,
        input_size     = tuple(args.input_size) if args.input_size else None,
        conf_threshold = args.conf_threshold,
    )

    logger.info("MIRAGE-X MVP-1 finished.")


if __name__ == "__main__":
    main()
