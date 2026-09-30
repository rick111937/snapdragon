"""
tests/unit/test_vision_models.py

Unit tests for src/mirage_x/vision/models.py (FR-02, FR-03).

Tests cover:
  - EquipmentState values and string representation
  - Detection validation (confidence range)
  - BoundingBox geometry helpers
  - DetectionResult.top_state priority ordering
  - DetectionResult.fps_equivalent
"""

import pytest
from mirage_x.vision.models import (
    BoundingBox,
    Detection,
    DetectionResult,
    EquipmentState,
)


# ---------------------------------------------------------------------------
# EquipmentState
# ---------------------------------------------------------------------------

class TestEquipmentState:
    def test_all_states_defined(self):
        states = {s.value for s in EquipmentState}
        assert states == {"NORMAL", "WARNING", "ANOMALOUS", "UNKNOWN"}

    def test_string_value(self):
        assert EquipmentState.NORMAL == "NORMAL"
        assert EquipmentState.ANOMALOUS == "ANOMALOUS"


# ---------------------------------------------------------------------------
# BoundingBox
# ---------------------------------------------------------------------------

class TestBoundingBox:
    def test_width_height(self):
        bb = BoundingBox(10, 20, 50, 80)
        assert bb.width  == 40
        assert bb.height == 60

    def test_area(self):
        bb = BoundingBox(0, 0, 100, 200)
        assert bb.area == 20_000

    def test_as_xyxy(self):
        bb = BoundingBox(5, 6, 7, 8)
        assert bb.as_xyxy() == (5, 6, 7, 8)


# ---------------------------------------------------------------------------
# Detection
# ---------------------------------------------------------------------------

class TestDetection:
    def test_valid_detection(self):
        d = Detection(
            class_id=0,
            class_name="motor",
            confidence=0.95,
            state=EquipmentState.NORMAL,
        )
        assert d.class_name == "motor"
        assert d.confidence == 0.95

    def test_confidence_below_zero_raises(self):
        with pytest.raises(ValueError):
            Detection(class_id=0, class_name="x", confidence=-0.1)

    def test_confidence_above_one_raises(self):
        with pytest.raises(ValueError):
            Detection(class_id=0, class_name="x", confidence=1.001)

    def test_confidence_exactly_zero_and_one(self):
        # Boundary values must not raise
        Detection(class_id=0, class_name="x", confidence=0.0)
        Detection(class_id=0, class_name="x", confidence=1.0)

    def test_default_state_is_unknown(self):
        d = Detection(class_id=0, class_name="x", confidence=0.5)
        assert d.state == EquipmentState.UNKNOWN


# ---------------------------------------------------------------------------
# DetectionResult — top_state priority
# ---------------------------------------------------------------------------

class TestDetectionResultTopState:
    def _make_result(self, states):
        dets = [
            Detection(class_id=i, class_name=f"obj{i}",
                      confidence=0.8, state=s)
            for i, s in enumerate(states)
        ]
        return DetectionResult(
            detections        = dets,
            frame_source      = "test",
            inference_time_ms = 10.0,
            provider_used     = "CPUExecutionProvider",
            model_path        = "test.onnx",
            input_resolution  = (640, 640),
        )

    def test_empty_detections_gives_unknown(self):
        r = self._make_result([])
        assert r.top_state == EquipmentState.UNKNOWN

    def test_anomalous_beats_normal(self):
        r = self._make_result([EquipmentState.NORMAL, EquipmentState.ANOMALOUS])
        assert r.top_state == EquipmentState.ANOMALOUS

    def test_anomalous_beats_warning(self):
        r = self._make_result([EquipmentState.WARNING, EquipmentState.ANOMALOUS])
        assert r.top_state == EquipmentState.ANOMALOUS

    def test_warning_beats_normal(self):
        r = self._make_result([EquipmentState.NORMAL, EquipmentState.WARNING])
        assert r.top_state == EquipmentState.WARNING

    def test_warning_beats_unknown(self):
        r = self._make_result([EquipmentState.UNKNOWN, EquipmentState.WARNING])
        assert r.top_state == EquipmentState.WARNING

    def test_all_normal(self):
        r = self._make_result([EquipmentState.NORMAL, EquipmentState.NORMAL])
        assert r.top_state == EquipmentState.NORMAL

    def test_all_unknown(self):
        r = self._make_result([EquipmentState.UNKNOWN])
        assert r.top_state == EquipmentState.UNKNOWN


# ---------------------------------------------------------------------------
# DetectionResult — fps_equivalent
# ---------------------------------------------------------------------------

class TestDetectionResultFPS:
    def _result(self, ms: float) -> DetectionResult:
        return DetectionResult(
            detections=[], frame_source="t",
            inference_time_ms=ms, provider_used="CPU",
            model_path="m.onnx", input_resolution=(640, 640),
        )

    def test_fps_at_10ms(self):
        assert abs(self._result(10.0).fps_equivalent - 100.0) < 0.01

    def test_fps_at_100ms(self):
        assert abs(self._result(100.0).fps_equivalent - 10.0) < 0.01

    def test_fps_zero_latency_returns_zero(self):
        assert self._result(0.0).fps_equivalent == 0.0
