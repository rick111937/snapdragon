"""benchmarking/metrics.py -- Latency and FPS measurement (FR-18, SRS S15).

Design principles (from SRS S15 hard rules)
--------------------------------------------
- ALL numbers come from actual measurements -- never from documentation,
  theoretical peak or another device's results.
- Every Benchmark record carries the provider, model, input size, and
  a device_note that explicitly marks whether the measurement was taken
  on the real Snapdragon HP target or a dev/CI machine.
- The device_note propagates from the DetectionResult, which in turn
  gets it from the ONNXDetector constructor arg -- so the "who measured
  this?" chain is unbroken from config -> detector -> benchmark -> report.

Metrics collected
-----------------
- per-frame inference_time_ms  (session.run() wall-clock only)
- rolling FPS                  (mean of last N frame timings)
- rolling mean / min / max latency
- total frames processed
- provider_used                (confirmed, not assumed)
"""

from __future__ import annotations

import math

import logging
import statistics
import time
from collections import deque
from dataclasses import dataclass, field
from typing import Deque, List, Optional

from mirage_x.vision.models import DetectionResult

logger = logging.getLogger(__name__)


@dataclass
class FrameBenchmark:
    """Measurements for a single processed frame."""
    frame_index       : int
    wall_time_s       : float   # time.monotonic() at result receipt
    inference_time_ms : float   # model forward-pass only
    provider_used     : str     # confirmed ONNX RT provider
    num_detections    : int
    device_note       : str


@dataclass
class BenchmarkSummary:
    """
    Aggregate statistics over a run or session.

    SRS S15 requires: model, input_size, runtime, quantization, device,
    test conditions.  All except quantization are captured here;
    quantization info can be embedded in device_note by the caller when
    known.
    """
    total_frames       : int
    mean_latency_ms    : float
    min_latency_ms     : float
    max_latency_ms     : float
    p95_latency_ms     : float
    mean_fps           : float
    provider_used      : str   # the provider that ran for this session
    model_path         : str
    input_resolution   : tuple  # (H, W)
    device_note        : str
    wall_duration_s    : float  # total elapsed wall time
    samples            : List[float] = field(default_factory=list, repr=False)

    def as_dict(self) -> dict:
        return {
            "total_frames"      : self.total_frames,
            "mean_latency_ms"   : round(self.mean_latency_ms, 3),
            "min_latency_ms"    : round(self.min_latency_ms, 3),
            "max_latency_ms"    : round(self.max_latency_ms, 3),
            "p95_latency_ms"    : round(self.p95_latency_ms, 3),
            "mean_fps"          : round(self.mean_fps, 2),
            "provider_used"     : self.provider_used,
            "model_path"        : self.model_path,
            "input_resolution"  : list(self.input_resolution),
            "device_note"       : self.device_note,
            "wall_duration_s"   : round(self.wall_duration_s, 3),
        }

    def __str__(self) -> str:
        lines = [
            "-- MIRAGE-X Benchmark Summary ------------------------------",
            f"  Provider (confirmed) : {self.provider_used}",
            f"  Model                : {self.model_path}",
            f"  Input resolution     : {self.input_resolution[1]}x{self.input_resolution[0]}",
            f"  Frames processed     : {self.total_frames}",
            f"  Mean latency         : {self.mean_latency_ms:.2f} ms",
            f"  Min / Max latency    : {self.min_latency_ms:.2f} / {self.max_latency_ms:.2f} ms",
            f"  P95 latency          : {self.p95_latency_ms:.2f} ms",
            f"  Mean FPS (equiv.)    : {self.mean_fps:.2f}",
            f"  Wall duration        : {self.wall_duration_s:.2f} s",
            f"  [!] Device note        : {self.device_note}",
            "------------------------------------------------------------",
        ]
        return "\n".join(lines)


class LatencyMeter:
    """
    Rolling latency and FPS tracker.

    Designed to be updated once per frame with the DetectionResult produced
    by ONNXDetector.run().  Thread safety is NOT guaranteed -- use from a
    single thread or add external locking.

    Parameters
    ----------
    window_size : number of recent frames used for rolling statistics
    """

    def __init__(self, window_size: int = 30) -> None:
        self._window_size      = window_size
        self._latencies: Deque[float] = deque(maxlen=window_size)
        self._wall_times: Deque[float] = deque(maxlen=window_size + 1)
        self._all_latencies: List[float] = []
        self._frames: List[FrameBenchmark] = []
        self._session_start: Optional[float] = None
        self._frame_index = 0

    # ------------------------------------------------------------------
    # Update
    # ------------------------------------------------------------------

    def record(self, result: DetectionResult) -> FrameBenchmark:
        """
        Ingest a DetectionResult and return a FrameBenchmark for this frame.

        Call once per processed frame, in order.
        """
        if self._session_start is None:
            self._session_start = time.monotonic()

        now = time.monotonic()
        ms  = result.inference_time_ms

        self._latencies.append(ms)
        self._all_latencies.append(ms)
        self._wall_times.append(now)

        fb = FrameBenchmark(
            frame_index       = self._frame_index,
            wall_time_s       = now,
            inference_time_ms = ms,
            provider_used     = result.provider_used,
            num_detections    = len(result.detections),
            device_note       = result.device_note,
        )
        self._frames.append(fb)
        self._frame_index += 1
        return fb

    # ------------------------------------------------------------------
    # Rolling stats
    # ------------------------------------------------------------------

    @property
    def rolling_fps(self) -> float:
        """
        Compute FPS from the inter-frame wall-clock gaps in the current window.

        This reflects the actual end-to-end throughput (capture + inference)
        rather than the theoretical 1000/latency_ms value.
        """
        times = list(self._wall_times)
        if len(times) < 2:
            return 0.0
        elapsed = times[-1] - times[0]
        if elapsed <= 0:
            return 0.0
        return (len(times) - 1) / elapsed

    @property
    def rolling_mean_latency_ms(self) -> float:
        if not self._latencies:
            return 0.0
        return statistics.mean(self._latencies)

    @property
    def rolling_min_latency_ms(self) -> float:
        return min(self._latencies) if self._latencies else 0.0

    @property
    def rolling_max_latency_ms(self) -> float:
        return max(self._latencies) if self._latencies else 0.0

    # ------------------------------------------------------------------
    # Session summary
    # ------------------------------------------------------------------

    def summarise(self) -> Optional[BenchmarkSummary]:
        """
        Return a BenchmarkSummary over all frames recorded so far.

        Returns None if no frames have been recorded yet.
        """
        if not self._all_latencies or not self._frames:
            return None

        last = self._frames[-1]
        wall_dur = (
            (self._frames[-1].wall_time_s - self._session_start)
            if self._session_start
            else 0.0
        )

        sorted_lats = sorted(self._all_latencies)
        # Use ceiling so p95 of N samples is the sample at rank ceil(0.95*N).
        # For N=20: ceil(19.0)=19 -> sorted[19] = the top-5% value.
        p95_idx     = min(len(sorted_lats) - 1, max(0, math.ceil(len(sorted_lats) * 0.95) - 1))

        return BenchmarkSummary(
            total_frames     = len(self._all_latencies),
            mean_latency_ms  = statistics.mean(self._all_latencies),
            min_latency_ms   = min(self._all_latencies),
            max_latency_ms   = max(self._all_latencies),
            p95_latency_ms   = sorted_lats[p95_idx],
            mean_fps         = (
                len(self._all_latencies) / wall_dur if wall_dur > 0 else 0.0
            ),
            provider_used    = last.provider_used,
            model_path       = "",   # filled in by the pipeline
            input_resolution = (0, 0),
            device_note      = last.device_note,
            wall_duration_s  = wall_dur,
            samples          = list(self._all_latencies),
        )

    def reset(self) -> None:
        """Clear all recorded data for a fresh session."""
        self._latencies.clear()
        self._wall_times.clear()
        self._all_latencies.clear()
        self._frames.clear()
        self._session_start = None
        self._frame_index   = 0
