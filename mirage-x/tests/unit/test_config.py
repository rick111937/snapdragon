"""
tests/unit/test_config.py

Unit tests for src/mirage_x/utils/config.py.

Tests cover:
  - Default config returned when no file exists
  - YAML is parsed and values arrive in the right fields
  - Malformed YAML falls back to defaults gracefully
  - ExecutionConfig.ort_providers() maps shorthand names correctly
  - CPUExecutionProvider is always appended as final fallback
"""

import pytest
from pathlib import Path
from mirage_x.utils.config import load_config, AppConfig, ExecutionConfig


class TestLoadConfigDefaults:
    def test_missing_file_returns_defaults(self, tmp_path):
        cfg = load_config(tmp_path / "nonexistent.yaml")
        assert isinstance(cfg, AppConfig)
        assert cfg.name == "MIRAGE-X"
        assert cfg.offline_first is True

    def test_malformed_yaml_returns_defaults(self, tmp_path):
        bad = tmp_path / "bad.yaml"
        bad.write_text(": {not valid yaml[[", encoding="utf-8")
        cfg = load_config(bad)
        assert isinstance(cfg, AppConfig)


class TestLoadConfigParsing:
    def _write_yaml(self, tmp_path, content: str) -> Path:
        p = tmp_path / "app.yaml"
        p.write_text(content, encoding="utf-8")
        return p

    def test_app_name_parsed(self, tmp_path):
        p = self._write_yaml(tmp_path, "app:\n  name: TestApp\n")
        cfg = load_config(p)
        assert cfg.name == "TestApp"

    def test_offline_first_false(self, tmp_path):
        p = self._write_yaml(tmp_path, "app:\n  offline_first: false\n")
        cfg = load_config(p)
        assert cfg.offline_first is False

    def test_camera_resolution(self, tmp_path):
        p = self._write_yaml(tmp_path, "camera:\n  default_resolution: [320, 240]\n")
        cfg = load_config(p)
        assert cfg.camera.width  == 320
        assert cfg.camera.height == 240

    def test_execution_providers(self, tmp_path):
        p = self._write_yaml(tmp_path, "execution:\n  providers: [cuda, cpu]\n")
        cfg = load_config(p)
        assert cfg.execution.providers == ["cuda", "cpu"]

    def test_audio_enabled_flag(self, tmp_path):
        p = self._write_yaml(tmp_path, "audio:\n  enabled: true\n")
        cfg = load_config(p)
        assert cfg.audio.enabled is True

    def test_risk_levels(self, tmp_path):
        p = self._write_yaml(tmp_path,
            "risk_levels: [LOW, MEDIUM, HIGH, CRITICAL]\n")
        cfg = load_config(p)
        assert "CRITICAL" in cfg.risk_levels


class TestExecutionConfigOrtProviders:
    def test_qnn_mapped_correctly(self):
        ec = ExecutionConfig(providers=["qnn"])
        providers = ec.ort_providers()
        assert "QNNExecutionProvider" in providers

    def test_cpu_always_present(self):
        ec = ExecutionConfig(providers=["qnn"])
        providers = ec.ort_providers()
        assert "CPUExecutionProvider" in providers

    def test_cpu_not_duplicated(self):
        ec = ExecutionConfig(providers=["cpu"])
        providers = ec.ort_providers()
        assert providers.count("CPUExecutionProvider") == 1

    def test_unknown_provider_skipped(self):
        ec = ExecutionConfig(providers=["unknown_provider_xyz", "cpu"])
        providers = ec.ort_providers()
        assert "unknown_provider_xyz" not in providers
        assert "CPUExecutionProvider" in providers

    def test_ordering_preserved(self):
        ec = ExecutionConfig(providers=["qnn", "dml", "cpu"])
        providers = ec.ort_providers()
        qnn_idx = providers.index("QNNExecutionProvider")
        dml_idx = providers.index("DmlExecutionProvider")
        assert qnn_idx < dml_idx
