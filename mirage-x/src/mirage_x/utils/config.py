"""
utils/config.py — MIRAGE-X centralised configuration loader.

Reads configs/app.yaml (or a path supplied at runtime) and exposes a
thin AppConfig dataclass.  No secrets or API keys are ever stored here
(SRS §13 hard constraint).
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import List

import yaml

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Default config path — resolved relative to the project root, which is
# three parents above this file (src/mirage_x/utils/config.py).
# ---------------------------------------------------------------------------
_REPO_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_CONFIG_PATH = _REPO_ROOT / "configs" / "app.yaml"


@dataclass
class CameraConfig:
    enabled: bool = True
    default_resolution: List[int] = field(default_factory=lambda: [1280, 720])

    @property
    def width(self) -> int:
        return self.default_resolution[0]

    @property
    def height(self) -> int:
        return self.default_resolution[1]


@dataclass
class AudioConfig:
    enabled: bool = False


@dataclass
class ExecutionConfig:
    """
    Ordered list of ONNX Runtime execution-provider names to attempt.

    The implementation MUST try them in order and report which one
    actually initialised — never assume NPU execution (SRS §10).

    YAML key names are normalised to the ONNX Runtime provider strings:
        qnn   -> QNNExecutionProvider
        cuda  -> CUDAExecutionProvider
        dml   -> DmlExecutionProvider   (DirectML – Snapdragon GPU path)
        cpu   -> CPUExecutionProvider   (always available, final fallback)
    """
    providers: List[str] = field(default_factory=lambda: ["qnn", "cpu"])

    # Mapping from shorthand config names to ONNX Runtime provider strings.
    _PROVIDER_MAP: dict = field(default_factory=lambda: {
        "qnn":  "QNNExecutionProvider",
        "cuda": "CUDAExecutionProvider",
        "dml":  "DmlExecutionProvider",
        "cpu":  "CPUExecutionProvider",
    }, repr=False)

    def ort_providers(self) -> List[str]:
        """Return provider names as ONNX Runtime expects them."""
        result = []
        for p in self.providers:
            mapped = self._PROVIDER_MAP.get(p.lower())
            if mapped:
                result.append(mapped)
            else:
                logger.warning("Unknown execution provider '%s' in config — skipping.", p)
        # CPUExecutionProvider must always be reachable as final fallback.
        if "CPUExecutionProvider" not in result:
            result.append("CPUExecutionProvider")
        return result


@dataclass
class AppConfig:
    name: str = "MIRAGE-X"
    offline_first: bool = True
    camera: CameraConfig = field(default_factory=CameraConfig)
    audio: AudioConfig = field(default_factory=AudioConfig)
    execution: ExecutionConfig = field(default_factory=ExecutionConfig)
    risk_levels: List[str] = field(
        default_factory=lambda: ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    )
    equipment_states: List[str] = field(
        default_factory=lambda: ["NORMAL", "WARNING", "ANOMALOUS", "UNKNOWN"]
    )


# ---------------------------------------------------------------------------
# Loader
# ---------------------------------------------------------------------------

def load_config(path: Path | str | None = None) -> AppConfig:
    """
    Load and parse the YAML config file.

    Falls back gracefully to an all-default AppConfig if the file is
    missing or malformed — this keeps the app runnable without a config
    file in development/CI environments (NFR-05).
    """
    cfg_path = Path(path) if path else DEFAULT_CONFIG_PATH
    if not cfg_path.exists():
        logger.warning(
            "Config file not found at '%s'. Using built-in defaults.", cfg_path
        )
        return AppConfig()

    try:
        raw: dict = yaml.safe_load(cfg_path.read_text(encoding="utf-8")) or {}
    except yaml.YAMLError as exc:
        logger.error("Failed to parse config file '%s': %s. Using defaults.", cfg_path, exc)
        return AppConfig()

    app_raw   = raw.get("app", {})
    cam_raw   = raw.get("camera", {})
    audio_raw = raw.get("audio", {})
    exec_raw  = raw.get("execution", {})

    return AppConfig(
        name          = app_raw.get("name", "MIRAGE-X"),
        offline_first = app_raw.get("offline_first", True),
        camera        = CameraConfig(
            enabled            = cam_raw.get("enabled", True),
            default_resolution = cam_raw.get("default_resolution", [1280, 720]),
        ),
        audio         = AudioConfig(
            enabled = audio_raw.get("enabled", False),
        ),
        execution     = ExecutionConfig(
            providers = exec_raw.get("providers", ["qnn", "cpu"]),
        ),
        risk_levels     = raw.get("risk_levels",
                                  ["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
        equipment_states= raw.get("equipment_states",
                                  ["NORMAL", "WARNING", "ANOMALOUS", "UNKNOWN"]),
    )
