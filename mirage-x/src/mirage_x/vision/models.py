"""vision/models.py — Equipment detection data types (FR-02, FR-03).

This module owns ONLY the data contracts:
  - EquipmentState  (FR-03: NORMAL / WARNING / ANOMALOUS / UNKNOWN)
  - Detection       (one detected object + its state)
  - DetectionResult (the full output of one inference call)

No inference logic lives here.  Keeping types in their own file makes them
importable by temporal, anomaly, reporting, etc. without pulling in any
heavy ONNX Runtime dependency.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import List, Optional, Tuple


class EquipmentState(str, Enum):
    """
    Equipment/observable state per FR-03.

    Values are strings so they serialise naturally to JSON/YAML.
    """
    NORMAL    = "NORMAL"
    WARNING   = "WARNING"
    ANOMALOUS = "ANOMALOUS"
    UNKNOWN   = "UNKNOWN"


@dataclass
class BoundingBox:
    """Axis-aligned bounding box in pixel coordinates."""
    x1: float
    y1: float
    x2: float
    y2: float

    @property
    def width(self)  -> float: return self.x2 - self.x1
    @property
    def height(self) -> float: return self.y2 - self.y1
    @property
    def area(self)   -> float: return self.width * self.height

    def as_xyxy(self) -> Tuple[float, float, float, float]:
        return (self.x1, self.y1, self.x2, self.y2)


@dataclass
class Detection:
    """
    A single detected object from one inference call (FR-02).

    Attributes
    ----------
    class_id    : integer class index from the model's output
    class_name  : human-readable label (from label map or "unknown")
    confidence  : model confidence [0.0, 1.0] — displayed as-is, never
                  presented as a guarantee of correctness (FR-14)
    bbox        : bounding box in the frame, None if model is classification-only
    state       : equipment state derived from this detection (FR-03)
    """
    class_id   : int
    class_name : str
    confidence : float
    bbox       : Optional[BoundingBox] = None
    state      : EquipmentState = EquipmentState.UNKNOWN

    def __post_init__(self) -> None:
        if not (0.0 <= self.confidence <= 1.0):
            raise ValueError(
                f"confidence must be in [0, 1], got {self.confidence!r}"
            )


@dataclass
class DetectionResult:
    """
    Complete output of one inference pass.

    Attributes
    ----------
    detections        : list of Detection objects (may be empty)
    frame_source      : identifier of the frame that was processed
    inference_time_ms : wall-clock time for the model forward pass only (ms)
    provider_used     : ONNX Runtime execution provider that actually ran
                        (e.g. "QNNExecutionProvider", "CPUExecutionProvider")
                        — this is the confirmed value, not a preference
    model_path        : path to the .onnx file used
    input_resolution  : (H, W) fed to the model (after preprocessing)
    device_note       : free-text note about whether measurements were taken
                        on the actual target device or a dev/CI environment
    """
    detections       : List[Detection]
    frame_source     : str
    inference_time_ms: float
    provider_used    : str
    model_path       : str
    input_resolution : Tuple[int, int]          # (H, W)
    device_note      : str = "unvalidated / dev environment"

    @property
    def fps_equivalent(self) -> float:
        """Frames per second if inference were continuous at this latency."""
        if self.inference_time_ms <= 0:
            return 0.0
        return 1000.0 / self.inference_time_ms

    @property
    def top_state(self) -> EquipmentState:
        """
        Highest-priority state across all detections.

        Priority: ANOMALOUS > WARNING > NORMAL > UNKNOWN
        Returns UNKNOWN if there are no detections.
        """
        priority = {
            EquipmentState.ANOMALOUS: 3,
            EquipmentState.WARNING:   2,
            EquipmentState.NORMAL:    1,
            EquipmentState.UNKNOWN:   0,
        }
        if not self.detections:
            return EquipmentState.UNKNOWN
        return max(self.detections, key=lambda d: priority[d.state]).state
