import os
import sys

# Ensure src/ is on PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'src')))

import uvicorn
from mirage_x.ui.server import app

if __name__ == '__main__':
    print("[MIRAGE-X] Starting FastAPI Backend on http://127.0.0.1:8000 ...")
    uvicorn.run(app, host='127.0.0.1', port=8000, log_level='info')
