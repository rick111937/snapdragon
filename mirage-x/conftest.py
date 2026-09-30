"""
Root conftest.py — adds src/ to sys.path so pytest can import mirage_x
without requiring an editable install.

This is a standard pattern for src-layout projects and is the fallback
for environments where `pip install -e .` is not available or fails.
"""
import sys
from pathlib import Path

# Ensure the src/ directory is on the Python path
sys.path.insert(0, str(Path(__file__).parent / "src"))
