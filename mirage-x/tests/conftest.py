"""
conftest.py — pytest configuration for MIRAGE-X test suite.

Adds:
  --model-path  custom CLI option (used by requires_model tests)
  requires_model marker declaration (avoids PytestUnknownMarkWarning)
"""

import pytest


def pytest_addoption(parser):
    parser.addoption(
        "--model-path",
        action="store",
        default=None,
        help="Absolute path to .onnx model file for requires_model tests.",
    )


def pytest_configure(config):
    config.addinivalue_line(
        "markers",
        "requires_model: tests that need a real .onnx model file "
        "(skipped automatically if --model-path is not provided).",
    )
