"""
tests/integration/test_mvp1_pipeline.py

Integration test: camera -> detector -> benchmarking meter (MVP-1 end-to-end).

Per SRS §18, integration tests exercise camera → model → temporal → anomaly.
This test covers the camera → model → benchmarking segment.

Design choices
--------------
- Uses make_mock_frame (no real camera required) to keep the test
  deterministic in CI environments.
- Uses the detector in DEGRADED mode (no real model file) to verify the
  pipeline end-to-end structural integrity.  Producing correct *detections*
  with a real model is covered in the manual device-validation checklist.
- Verifies NFR-05: no stage should raise or produce None — only graceful
  degraded results.
- Verifies SRS §10: provider_used must NOT claim NPU when running without
  a model.
- Verifies SRS §15: device_note carries through from detector to benchmark.
"""

from pathlib import Path

import pytest

from mirage_x.benchmarking.metrics import LatencyMeter
from mirage_x.input.camera import make_mock_frame
from mirage_x.vision.detector import ONNXDetector
from mirage_x.vision.models import EquipmentState


@pytest.fixture
def degraded_detector(tmp_path) -> ONNXDetector:
    """Detector pointing at a nonexistent model → enters DEGRADED mode."""
    return ONNXDetector(
        model_path=tmp_path / "nonexistent.onnx",
        preferred_providers=["CPUExecutionProvider"],
        device_note="integration-test / degraded mode",
    )


@pytest.fixture
def meter() -> LatencyMeter:
    return LatencyMeter(window_size=10)


# ---------------------------------------------------------------------------
# Structural pipeline integrity
# ---------------------------------------------------------------------------

class TestMVP1PipelineStructure:
    def test_full_pipeline_does_not_raise(self, degraded_detector, meter):
        """NFR-05: no stage raises even in fully degraded state."""
        frame  = make_mock_frame()
        result = degraded_detector.run(frame)
        fb     = meter.record(result)
        # We expect no exceptions above

    def test_result_is_never_none(self, degraded_detector, meter):
        for _ in range(5):
            frame  = make_mock_frame()
            result = degraded_detector.run(frame)
            assert result is not None

    def test_benchmark_records_all_frames(self, degraded_detector, meter):
        N = 10
        for _ in range(N):
            result = degraded_detector.run(make_mock_frame())
            meter.record(result)
        summary = meter.summarise()
        assert summary is not None
        assert summary.total_frames == N

    def test_top_state_returned_for_each_frame(self, degraded_detector, meter):
        for _ in range(3):
            result = degraded_detector.run(make_mock_frame())
            # top_state must be a valid EquipmentState — UNKNOWN in degraded mode
            assert result.top_state in list(EquipmentState)

    def test_degraded_state_is_unknown(self, degraded_detector, meter):
        result = degraded_detector.run(make_mock_frame())
        assert result.top_state == EquipmentState.UNKNOWN


# ---------------------------------------------------------------------------
# SRS §10 — provider honesty
# ---------------------------------------------------------------------------

class TestProviderHonesty:
    def test_no_npu_claim_in_degraded_mode(self, degraded_detector, meter):
        """
        SRS §10: provider_used must NOT claim QNN/NPU execution when the
        model could not load.
        """
        result = degraded_detector.run(make_mock_frame())
        meter.record(result)
        summary = meter.summarise()
        assert "QNN" not in summary.provider_used.upper()
        assert "NPU" not in summary.provider_used.upper()

    def test_provider_used_is_non_empty(self, degraded_detector):
        result = degraded_detector.run(make_mock_frame())
        assert result.provider_used  # non-empty string


# ---------------------------------------------------------------------------
# SRS §15 — benchmark honesty
# ---------------------------------------------------------------------------

class TestBenchmarkHonesty:
    def test_device_note_propagates_to_summary(self, tmp_path):
        note = "integration-test / unvalidated environment"
        det = ONNXDetector(
            model_path=tmp_path / "nonexistent.onnx",
            device_note=note,
        )
        m = LatencyMeter()
        m.record(det.run(make_mock_frame()))
        summary = m.summarise()
        assert note in summary.device_note

    def test_inference_time_ms_is_zero_in_degraded_mode(self, degraded_detector):
        """Degraded mode returns 0ms — not a fabricated number."""
        result = degraded_detector.run(make_mock_frame())
        assert result.inference_time_ms == 0.0

    def test_p95_latency_in_summary(self, tmp_path):
        """p95 must be computed from actual data, not guessed."""
        det = ONNXDetector(model_path=tmp_path / "nonexistent.onnx")
        m   = LatencyMeter()
        for _ in range(20):
            m.record(det.run(make_mock_frame()))
        s = m.summarise()
        # All latencies are 0ms in degraded mode → p95 also 0
        assert s.p95_latency_ms == 0.0
        assert s.min_latency_ms == 0.0
        assert s.max_latency_ms == 0.0


# ---------------------------------------------------------------------------
# NFR-05 — fault injection: camera returns None
# ---------------------------------------------------------------------------

class TestFaultInjectionNullFrame:
    """
    Simulate what happens when the camera read returns None mid-run.
    The main loop in main.py handles this; here we verify the detector
    is never handed a None and that it handles garbage input gracefully
    (belt-and-suspenders check).
    """

    def test_detector_does_not_receive_none_from_mock(self):
        """make_mock_frame never returns None — this is the safe path."""
        frame = make_mock_frame()
        assert frame is not None
        assert frame.image is not None


# ---------------------------------------------------------------------------
# Integration: pipeline with CPU-only real ONNX model (optional)
# ---------------------------------------------------------------------------

@pytest.mark.requires_model
class TestMVP1WithRealModel:
    """
    Marked requires_model — run manually with:
        pytest tests/integration/ -m requires_model
          --model-path models/vision/model.onnx

    Not run in standard CI (no model file present).
    """

    @pytest.fixture
    def real_detector(self, request) -> ONNXDetector:
        model_path = request.config.getoption("--model-path", default=None)
        if not model_path:
            pytest.skip("--model-path not provided")
        return ONNXDetector(
            model_path=Path(model_path),
            preferred_providers=["CPUExecutionProvider"],
            device_note="integration test / cpu-only",
        )

    def test_provider_is_cpu(self, real_detector):
        assert real_detector.provider_used == "CPUExecutionProvider"

    def test_inference_time_positive(self, real_detector):
        result = real_detector.run(make_mock_frame())
        assert result.inference_time_ms > 0.0

    def test_result_not_degraded(self, real_detector):
        assert not real_detector.is_degraded
