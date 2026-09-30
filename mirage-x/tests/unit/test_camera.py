"""
tests/unit/test_camera.py

Unit tests for src/mirage_x/input/camera.py (FR-01).

Tests cover:
  - make_mock_frame produces a valid CameraFrame
  - CameraCapture degrades gracefully when device is unavailable
  - CameraCapture.start() returns False for an invalid device index
    (uses a high device index that will not exist in any CI environment)
  - CameraCapture status transitions

Note: We do NOT test against a real camera here — that belongs in
integration tests or manual validation.  All hardware is mocked.
"""

import numpy as np
import pytest

from mirage_x.input.camera import (
    CameraCapture,
    CameraFrame,
    CameraStatus,
    make_mock_frame,
)


# ---------------------------------------------------------------------------
# make_mock_frame
# ---------------------------------------------------------------------------

class TestMakeMockFrame:
    def test_returns_camera_frame(self):
        f = make_mock_frame()
        assert isinstance(f, CameraFrame)

    def test_default_dimensions(self):
        f = make_mock_frame()
        assert f.width  == 640
        assert f.height == 480
        assert f.image.shape == (480, 640, 3)

    def test_custom_dimensions(self):
        f = make_mock_frame(width=320, height=240)
        assert f.width  == 320
        assert f.height == 240
        assert f.image.shape == (240, 320, 3)

    def test_image_dtype_uint8(self):
        f = make_mock_frame()
        assert f.image.dtype == np.uint8

    def test_source_is_mock(self):
        f = make_mock_frame()
        assert f.source == "mock"

    def test_timestamp_positive(self):
        f = make_mock_frame()
        assert f.timestamp > 0


# ---------------------------------------------------------------------------
# CameraCapture — degraded mode (no real camera)
# ---------------------------------------------------------------------------

class TestCameraCaptureDegrade:
    """
    We use device index 99 which is effectively guaranteed to not exist
    in any standard test environment.
    """

    def test_start_returns_false_on_missing_device(self):
        try:
            import cv2  # noqa: F401
        except ImportError:
            pytest.skip("opencv-python not installed")

        cap = CameraCapture(device_index=99)
        result = cap.start()
        assert result is False
        assert cap.status == CameraStatus.DEGRADED

    def test_read_frame_returns_none_in_degraded_mode(self):
        try:
            import cv2  # noqa: F401
        except ImportError:
            pytest.skip("opencv-python not installed")

        cap = CameraCapture(device_index=99)
        cap.start()
        frame = cap.read_frame()
        assert frame is None

    def test_stop_is_safe_when_degraded(self):
        try:
            import cv2  # noqa: F401
        except ImportError:
            pytest.skip("opencv-python not installed")

        cap = CameraCapture(device_index=99)
        cap.start()
        cap.stop()  # must not raise
        assert cap.status == CameraStatus.STOPPED

    def test_is_available_false_in_degraded(self):
        try:
            import cv2  # noqa: F401
        except ImportError:
            pytest.skip("opencv-python not installed")

        cap = CameraCapture(device_index=99)
        cap.start()
        assert cap.is_available is False

    def test_initial_status_is_stopped(self):
        cap = CameraCapture()
        assert cap.status == CameraStatus.STOPPED

    def test_no_cv2_graceful_degradation(self, monkeypatch):
        """Simulate opencv not being installed — must not crash."""
        import sys
        # Remove cv2 from sys.modules if present and make import fail
        monkeypatch.setitem(sys.modules, "cv2", None)
        cap = CameraCapture()
        result = cap.start()
        assert result is False
        assert cap.status == CameraStatus.DEGRADED
