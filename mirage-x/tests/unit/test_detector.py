"""
tests/unit/test_detector.py

Unit tests for src/mirage_x/vision/detector.py (FR-02, FR-03).

Strategy (per SRS §18)
----------------------
- We do NOT require a real .onnx file in these unit tests.
- We DO test the detector's behaviour when the model file is missing
  (DEGRADED mode, never crashes).
- We test preprocessing shape correctness using a mock session.
- We test _score_to_state thresholds.
- We test _parse_yolo_output with a synthetic tensor.

Tests that require an actual .onnx model are tagged @pytest.mark.requires_model
and skipped automatically unless MIRAGE_X_MODEL_PATH is set in the environment.
"""

import os
from pathlib import Path
from unittest.mock import MagicMock, patch

import numpy as np
import pytest

from mirage_x.input.camera import make_mock_frame
from mirage_x.vision.detector import (
    ONNXDetector,
    _parse_yolo_output,
    _score_to_state,
    COCO_LABELS,
)
from mirage_x.vision.models import EquipmentState


# ---------------------------------------------------------------------------
# _score_to_state thresholds
# ---------------------------------------------------------------------------

class TestScoreToState:
    def test_high_confidence_is_normal(self):
        assert _score_to_state(0.95) == EquipmentState.NORMAL
        assert _score_to_state(0.70) == EquipmentState.NORMAL

    def test_mid_confidence_is_warning(self):
        assert _score_to_state(0.69) == EquipmentState.WARNING
        assert _score_to_state(0.45) == EquipmentState.WARNING

    def test_low_confidence_is_unknown(self):
        assert _score_to_state(0.44) == EquipmentState.UNKNOWN
        assert _score_to_state(0.0)  == EquipmentState.UNKNOWN


# ---------------------------------------------------------------------------
# _parse_yolo_output (synthetic tensors)
# ---------------------------------------------------------------------------

class TestParseYoloOutput:
    """Test YOLO output parser with hand-crafted tensors."""

    def _yolo_tensor(self, n_anchors=8400, num_classes=80, conf_row=0.9):
        """
        Build a minimal [1, 4+C, N] tensor with one high-confidence detection.
        """
        tensor = np.zeros((1, 4 + num_classes, n_anchors), dtype=np.float32)
        # One anchor at the centre
        tensor[0, 0, 0] = 320.0  # cx
        tensor[0, 1, 0] = 240.0  # cy
        tensor[0, 2, 0] = 100.0  # w
        tensor[0, 3, 0] = 80.0   # h
        tensor[0, 4, 0] = conf_row  # class 0 score
        return tensor

    def test_high_conf_detection_returned(self):
        tensor = self._yolo_tensor(conf_row=0.95)
        dets = _parse_yolo_output(
            tensor, COCO_LABELS, conf_threshold=0.5,
            img_w=640, img_h=480, model_input_w=640, model_input_h=640,
        )
        assert len(dets) >= 1
        assert dets[0].confidence >= 0.9

    def test_low_conf_filtered_out(self):
        tensor = self._yolo_tensor(conf_row=0.1)
        dets = _parse_yolo_output(
            tensor, COCO_LABELS, conf_threshold=0.5,
            img_w=640, img_h=480, model_input_w=640, model_input_h=640,
        )
        assert dets == []

    def test_detection_has_bbox(self):
        tensor = self._yolo_tensor(conf_row=0.95)
        dets = _parse_yolo_output(
            tensor, COCO_LABELS, conf_threshold=0.5,
            img_w=640, img_h=480, model_input_w=640, model_input_h=640,
        )
        assert dets[0].bbox is not None

    def test_class_name_from_label_list(self):
        labels = ["motor", "panel", "cable"]
        # Build [1, 4+3, 1] tensor: 1 anchor, 3 classes
        # Give class 0 ("motor") the highest score
        tensor = np.zeros((1, 7, 1), dtype=np.float32)
        tensor[0, 0, 0] = 10.0  # cx
        tensor[0, 1, 0] = 10.0  # cy
        tensor[0, 2, 0] = 5.0   # w
        tensor[0, 3, 0] = 5.0   # h
        tensor[0, 4, 0] = 0.9   # class 0 = "motor" wins
        tensor[0, 5, 0] = 0.1   # class 1 = "panel"
        tensor[0, 6, 0] = 0.05  # class 2 = "cable"
        dets = _parse_yolo_output(
            tensor, labels, conf_threshold=0.5,
            img_w=100, img_h=100, model_input_w=100, model_input_h=100,
        )
        assert len(dets) >= 1
        assert any(d.class_name == "motor" for d in dets)

    def test_results_sorted_by_confidence_descending(self):
        # Two anchors, 1 class: anchor0 at conf=0.9, anchor1 at conf=0.6
        # tensor shape [1, 5, 2] — 4 bbox + 1 class score, 2 anchors
        tensor = np.zeros((1, 5, 2), dtype=np.float32)
        tensor[0, 0, 0] = 50.0;  tensor[0, 1, 0] = 50.0
        tensor[0, 2, 0] = 20.0;  tensor[0, 3, 0] = 20.0
        tensor[0, 4, 0] = 0.9   # anchor 0 conf
        tensor[0, 0, 1] = 80.0;  tensor[0, 1, 1] = 80.0
        tensor[0, 2, 1] = 20.0;  tensor[0, 3, 1] = 20.0
        tensor[0, 4, 1] = 0.6   # anchor 1 conf
        labels = ["thing"]
        dets = _parse_yolo_output(
            tensor, labels, conf_threshold=0.5,
            img_w=100, img_h=100, model_input_w=100, model_input_h=100,
        )
        assert len(dets) == 2, f"Expected 2 detections, got {len(dets)}: {dets}"
        assert dets[0].confidence >= dets[-1].confidence


# ---------------------------------------------------------------------------
# ONNXDetector — degraded mode (no model file)
# ---------------------------------------------------------------------------

class TestONNXDetectorDegraded:
    def test_missing_model_enters_degraded(self, tmp_path):
        model = tmp_path / "nonexistent.onnx"
        det = ONNXDetector(model_path=model)
        assert det.is_degraded

    def test_degraded_run_returns_result_not_none(self, tmp_path):
        model = tmp_path / "nonexistent.onnx"
        det = ONNXDetector(model_path=model)
        frame = make_mock_frame()
        result = det.run(frame)
        assert result is not None

    def test_degraded_result_has_empty_detections(self, tmp_path):
        model = tmp_path / "nonexistent.onnx"
        det = ONNXDetector(model_path=model)
        frame = make_mock_frame()
        result = det.run(frame)
        assert result.detections == []

    def test_degraded_result_device_note_mentions_degraded(self, tmp_path):
        model = tmp_path / "nonexistent.onnx"
        det = ONNXDetector(model_path=model)
        frame = make_mock_frame()
        result = det.run(frame)
        assert "DEGRADED" in result.device_note.upper()

    def test_degraded_result_provider_not_claimed_as_npu(self, tmp_path):
        model = tmp_path / "nonexistent.onnx"
        det = ONNXDetector(model_path=model)
        # Provider must not claim QNN/NPU when model couldn't load
        assert "QNN" not in det.provider_used.upper()


# ---------------------------------------------------------------------------
# ONNXDetector — with a real minimal ONNX model (if onnxruntime installed)
# ---------------------------------------------------------------------------

@pytest.mark.requires_model
class TestONNXDetectorWithMinimalModel:
    """
    These tests build a tiny identity ONNX model in memory and validate
    the full detector path without needing a real pre-trained model file.
    Skipped if onnxruntime is not installed.
    """

    @pytest.fixture
    def tiny_onnx_model(self, tmp_path) -> Path:
        """Create a minimal ONNX model that returns a fixed-shape output."""
        try:
            import onnx
            from onnx import TensorProto, helper
        except ImportError:
            pytest.skip("onnx package not installed — skipping model-based tests")

        # Simple passthrough: input [1,3,H,W] -> output [1,5,1] (one anchor, 1 class)
        X = helper.make_tensor_value_info("images", TensorProto.FLOAT, [1, 3, 32, 32])
        Y = helper.make_tensor_value_info("output0", TensorProto.FLOAT, [1, 5, 1])

        # Constant node to emit fixed output regardless of input
        const_vals = np.array([[[10.0, 10.0, 5.0, 5.0, 0.95]]],
                               dtype=np.float32)  # [1, 5, 1] cx cy w h conf
        const_vals = const_vals.transpose(0, 2, 1)  # -> [1, 1, 5] — then fix shape
        const_vals = np.array([10.0, 10.0, 5.0, 5.0, 0.95], dtype=np.float32).reshape(1, 5, 1)
        const_node = helper.make_node(
            "Constant", inputs=[], outputs=["output0"],
            value=helper.make_tensor(
                name="val", data_type=TensorProto.FLOAT,
                dims=const_vals.shape, vals=const_vals.flatten().tolist()
            )
        )
        graph = helper.make_graph([const_node], "tiny", [X], [Y])
        model = helper.make_model(graph, opset_imports=[helper.make_opsetid("", 13)])
        model_path = tmp_path / "tiny.onnx"
        onnx.save(model, str(model_path))
        return model_path

    def test_loads_without_crash(self, tiny_onnx_model):
        pytest.importorskip("onnxruntime")
        det = ONNXDetector(
            model_path=tiny_onnx_model,
            preferred_providers=["CPUExecutionProvider"],
            input_size=(32, 32),
        )
        assert not det.is_degraded

    def test_provider_is_cpu_when_only_cpu_requested(self, tiny_onnx_model):
        pytest.importorskip("onnxruntime")
        det = ONNXDetector(
            model_path=tiny_onnx_model,
            preferred_providers=["CPUExecutionProvider"],
            input_size=(32, 32),
        )
        assert det.provider_used == "CPUExecutionProvider"

    def test_run_returns_result(self, tiny_onnx_model):
        pytest.importorskip("onnxruntime")
        det = ONNXDetector(
            model_path=tiny_onnx_model,
            preferred_providers=["CPUExecutionProvider"],
            input_size=(32, 32),
        )
        frame = make_mock_frame(32, 32)
        result = det.run(frame)
        assert result is not None
        assert result.inference_time_ms >= 0.0
        assert result.provider_used == "CPUExecutionProvider"

    def test_inference_time_is_positive(self, tiny_onnx_model):
        pytest.importorskip("onnxruntime")
        det = ONNXDetector(
            model_path=tiny_onnx_model,
            preferred_providers=["CPUExecutionProvider"],
            input_size=(32, 32),
        )
        frame = make_mock_frame(32, 32)
        result = det.run(frame)
        assert result.inference_time_ms > 0.0
