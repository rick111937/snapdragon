"""input/camera.py — Camera capture module (FR-01).

Wraps OpenCV VideoCapture with:
  - configurable resolution (FR-01)
  - start / stop lifecycle
  - graceful degradation when no camera is present (NFR-05, SRS §14)

The caller receives numpy arrays (BGR, matching OpenCV convention).
Conversion to RGB happens in the vision layer if needed.

Design note
-----------
This module intentionally has no knowledge of the AI pipeline.  It is a
pure "frame source" that can be mocked out in tests without touching
any vision or benchmarking code.
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass
from enum import Enum, auto
from typing import Optional, Tuple

import numpy as np

logger = logging.getLogger(__name__)


class CameraStatus(Enum):
    """Lifecycle states for the camera capture device."""
    STOPPED    = auto()   # not yet opened / cleanly closed
    RUNNING    = auto()   # actively capturing frames
    DEGRADED   = auto()   # open failed or device lost; operating without camera
    ERROR      = auto()   # unrecoverable hardware fault


@dataclass(frozen=True)
class CameraFrame:
    """Container for a single captured frame and its metadata."""
    image: np.ndarray       # HxWx3 BGR uint8
    timestamp: float        # time.monotonic() at capture
    width: int
    height: int
    source: str             # e.g. "camera:0", "mock", "degraded"


class CameraCapture:
    """
    Thread-safe-ish camera capture source.

    Usage
    -----
    >>> cap = CameraCapture(device_index=0, width=1280, height=720)
    >>> cap.start()
    >>> frame = cap.read_frame()   # None if degraded
    >>> cap.stop()

    Degraded mode
    -------------
    If the requested device cannot be opened, the instance transitions to
    DEGRADED status and ``read_frame()`` returns None every call.  The
    caller is responsible for checking status and handling None gracefully.
    This means *the app never crashes* due to a missing camera (NFR-05).
    """

    def __init__(
        self,
        device_index: int = 0,
        width: int = 1280,
        height: int = 720,
    ) -> None:
        self._index  = device_index
        self._width  = width
        self._height = height
        self._cap    = None          # cv2.VideoCapture instance, lazily opened
        self.status  = CameraStatus.STOPPED

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    def start(self) -> bool:
        """
        Open the capture device.

        Returns True on success, False if the device could not be opened
        (status -> DEGRADED).  Never raises.
        """
        try:
            import cv2  # lazy import so the rest of the app loads without cv2
        except ImportError:
            logger.warning(
                "opencv-python not installed — camera unavailable. "
                "Running in DEGRADED mode (vision-only features disabled)."
            )
            self.status = CameraStatus.DEGRADED
            return False

        self._cap = cv2.VideoCapture(self._index)

        if not self._cap.isOpened():
            logger.warning(
                "Camera device %d could not be opened. "
                "Running in DEGRADED mode.",
                self._index,
            )
            self._cap.release()
            self._cap = None
            self.status = CameraStatus.DEGRADED
            return False

        # Apply requested resolution
        self._cap.set(cv2.CAP_PROP_FRAME_WIDTH,  self._width)
        self._cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self._height)

        actual_w = int(self._cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        actual_h = int(self._cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        logger.info(
            "Camera %d opened. Requested %dx%d, device reports %dx%d.",
            self._index, self._width, self._height, actual_w, actual_h,
        )
        self._width  = actual_w
        self._height = actual_h
        self.status  = CameraStatus.RUNNING
        return True

    def stop(self) -> None:
        """Release the capture device.  Safe to call even in DEGRADED state."""
        if self._cap is not None:
            self._cap.release()
            self._cap = None
            logger.info("Camera %d released.", self._index)
        self.status = CameraStatus.STOPPED

    # ------------------------------------------------------------------
    # Frame acquisition
    # ------------------------------------------------------------------

    def read_frame(self) -> Optional[CameraFrame]:
        """
        Capture one frame.

        Returns a CameraFrame on success, None if the camera is unavailable
        or the read fails.  The caller must handle None — never assume a
        frame is always returned (NFR-05).
        """
        if self.status == CameraStatus.DEGRADED or self._cap is None:
            return None

        ts  = time.monotonic()
        ret, img = self._cap.read()

        if not ret or img is None:
            logger.warning(
                "Camera read failed (device %d). Transitioning to DEGRADED.",
                self._index,
            )
            self.status = CameraStatus.DEGRADED
            return None

        return CameraFrame(
            image     = img,
            timestamp = ts,
            width     = img.shape[1],
            height    = img.shape[0],
            source    = f"camera:{self._index}",
        )

    # ------------------------------------------------------------------
    # Context manager support
    # ------------------------------------------------------------------

    def __enter__(self) -> "CameraCapture":
        self.start()
        return self

    def __exit__(self, *_) -> None:
        self.stop()

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @property
    def is_available(self) -> bool:
        return self.status == CameraStatus.RUNNING

    def __repr__(self) -> str:
        return (
            f"CameraCapture(device={self._index}, "
            f"resolution={self._width}x{self._height}, "
            f"status={self.status.name})"
        )


# ---------------------------------------------------------------------------
# Mock frame source — used in tests and when no real camera is available
# ---------------------------------------------------------------------------

def make_mock_frame(width: int = 640, height: int = 480) -> CameraFrame:
    """
    Return a synthetic CameraFrame containing a solid-colour test pattern.

    This is the canonical mock used in unit/integration tests and in
    degraded-mode demonstrations (e.g. no webcam on CI).  The pattern is
    intentionally trivial so its content makes no inference-quality claims.
    """
    img = np.zeros((height, width, 3), dtype=np.uint8)
    # draw a simple grey rectangle so the frame is not entirely black
    img[height // 4 : 3 * height // 4, width // 4 : 3 * width // 4] = 128
    return CameraFrame(
        image     = img,
        timestamp = time.monotonic(),
        width     = width,
        height    = height,
        source    = "mock",
    )
