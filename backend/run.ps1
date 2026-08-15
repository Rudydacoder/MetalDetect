# MetalDetect backend launcher (Windows / PowerShell)
# First run: py -3 -m venv .venv ; .\.venv\Scripts\pip install -r requirements.txt
$env:OPENBLAS_NUM_THREADS = "1"   # avoids OpenBLAS thread-alloc errors on some setups
$env:OMP_NUM_THREADS = "1"
& "$PSScriptRoot\.venv\Scripts\python.exe" -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
