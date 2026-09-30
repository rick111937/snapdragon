"""
tests/unit/test_benchmarking.py

Unit tests for src/mirage_x/benchmarking/metrics.py (FR-18, SRS §15).

Tests cover:
  - LatencyMeter.record() accumulates correctly
  - Rolling FPS is > 0 after multiple frames
  - BenchmarkSummary statistics (mean, min, max, p95)
  - device_note propagates from DetectionResult into FrameBenchmark
  - summarise() returns None on empty meter
  - reset() clears all state
"""

import time
import pytest
from mirage_x.benchmarking.metrics import LatencyMeter, BenchmarkSummary
from mirage_x.vision.models import DetectionResult


def _make_result(ms: float, provider: str = "CPUExecutionProvider",
                 note: str = "test") -> DetectionResult:
    return DetectionResult(
        detections=[], frame_source="test",
        inference_time_ms=ms, provider_used=provider,
        model_path="model.onnx", input_resolution=(640, 640),
        device_note=note,
    )


class TestLatencyMeterRecord:
    def test_empty_meter_summarise_returns_none(self):
        m = LatencyMeter()
        assert m.summarise() is None

    def test_single_record(self):
        m = LatencyMeter()
        fb = m.record(_make_result(25.0))
        assert fb.inference_time_ms == 25.0
        assert fb.frame_index == 0

    def test_frame_indices_increment(self):
        m = LatencyMeter()
        for i in range(5):
            fb = m.record(_make_result(10.0))
            assert fb.frame_index == i

    def test_device_note_propagates(self):
        m = LatencyMeter()
        note = "HP Snapdragon X Elite, target device"
        fb = m.record(_make_result(10.0, note=note))
        assert fb.device_note == note

    def test_provider_propagates(self):
        m = LatencyMeter()
        fb = m.record(_make_result(10.0, provider="QNNExecutionProvider"))
        assert fb.provider_used == "QNNExecutionProvider"


class TestLatencyMeterRollingStats:
    def test_rolling_mean_single(self):
        m = LatencyMeter()
        m.record(_make_result(40.0))
        assert abs(m.rolling_mean_latency_ms - 40.0) < 1e-6

    def test_rolling_mean_multiple(self):
        m = LatencyMeter()
        for ms in [10.0, 20.0, 30.0]:
            m.record(_make_result(ms))
        assert abs(m.rolling_mean_latency_ms - 20.0) < 1e-6

    def test_rolling_min_max(self):
        m = LatencyMeter()
        for ms in [5.0, 50.0, 25.0]:
            m.record(_make_result(ms))
        assert m.rolling_min_latency_ms == 5.0
        assert m.rolling_max_latency_ms == 50.0

    def test_rolling_fps_positive_after_multiple_frames(self):
        m = LatencyMeter()
        for _ in range(5):
            m.record(_make_result(10.0))
            time.sleep(0.01)  # 10ms gap ensures measurable wall-clock intervals
        # After 5 records separated by 10ms gaps, FPS should be ~100
        fps = m.rolling_fps
        assert fps > 0.0, f"Expected positive FPS, got {fps}"

    def test_rolling_fps_zero_on_single_frame(self):
        m = LatencyMeter()
        m.record(_make_result(10.0))
        # Only one wall-time stamp; can't compute interval
        assert m.rolling_fps == 0.0


class TestLatencyMeterSummarise:
    def test_summarise_returns_summary(self):
        m = LatencyMeter()
        for ms in [10.0, 20.0, 30.0, 40.0, 50.0]:
            m.record(_make_result(ms))
        summary = m.summarise()
        assert isinstance(summary, BenchmarkSummary)
        assert summary.total_frames == 5
        assert abs(summary.mean_latency_ms - 30.0) < 1e-6
        assert summary.min_latency_ms == 10.0
        assert summary.max_latency_ms == 50.0

    def test_p95_latency(self):
        m = LatencyMeter()
        # 20 latencies: 19 at 10ms, 1 at 100ms.
        # With ceil-based index: ceil(20*0.95)-1 = ceil(19)-1 = 19-1 = 18
        # sorted[18] = 10.0 (the 19th value), sorted[19] = 100.0
        # So p95 = sorted[18] = 10.0 for this exact distribution.
        # To put 100ms at p95 we need it at position ceil(0.95*N)-1:
        # Use 21 samples: 20 at 10ms, 1 at 100ms -> ceil(21*0.95)-1 = ceil(19.95)-1 = 20-1 = 19
        # sorted[19] = 10.0 again. Easier: use 4 samples [10,10,10,100] -> ceil(4*0.95)-1 = ceil(3.8)-1 = 4-1 = 3 -> sorted[3] = 100.
        m2 = LatencyMeter()
        for ms in [10.0, 10.0, 10.0, 100.0]:
            m2.record(_make_result(ms))
        summary2 = m2.summarise()
        assert summary2.p95_latency_ms == 100.0

    def test_reset_clears_state(self):
        m = LatencyMeter()
        m.record(_make_result(10.0))
        m.reset()
        assert m.summarise() is None
        assert m.rolling_fps == 0.0


class TestBenchmarkSummaryStr:
    def test_str_contains_provider(self):
        m = LatencyMeter()
        m.record(_make_result(15.0, provider="CPUExecutionProvider"))
        s = m.summarise()
        text = str(s)
        assert "CPUExecutionProvider" in text

    def test_str_contains_device_note(self):
        m = LatencyMeter()
        m.record(_make_result(15.0, note="unvalidated / dev environment"))
        s = m.summarise()
        assert "unvalidated / dev environment" in str(s)

    def test_as_dict_keys(self):
        m = LatencyMeter()
        m.record(_make_result(20.0))
        d = m.summarise().as_dict()
        for key in ("mean_latency_ms", "min_latency_ms", "max_latency_ms",
                    "p95_latency_ms", "mean_fps", "provider_used", "device_note"):
            assert key in d
