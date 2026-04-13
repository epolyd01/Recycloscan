# RecycloScan — ML Training Pipeline

This folder contains everything needed to go from the raw TACO dataset to a
trained `best.pt` model file that the backend loads for live inference.

---

## Setup

```bash
pip install ultralytics opencv-python pillow numpy
```

The backend's `requirements.txt` already includes `ultralytics`, so if you
installed that you have everything needed.

---

## Download TACO Dataset

TACO (Trash Annotations in Context) is a real open-source dataset of ~1,500
images of trash in the wild with COCO-format annotations.

```bash
# 1. Clone the TACO helper repo
git clone https://github.com/pedropro/TACO.git /tmp/taco-downloader

# 2. Install the downloader's dependency
pip install gdown

# 3. Download all images (this fetches ~1.5 GB spread across batches)
cd /tmp/taco-downloader
python download.py

# 4. Copy the downloaded data into this repo's data/taco/ directory
#    The downloader creates a data/ folder with batch subdirectories and annotations.json
cp /tmp/taco-downloader/data/annotations.json <repo-root>/data/taco/
cp -r /tmp/taco-downloader/data/batch_*       <repo-root>/data/taco/
```

After this step your layout should look like:

```
data/
└── taco/
    ├── annotations.json
    ├── batch_1/
    │   ├── 000001.jpg
    │   └── ...
    ├── batch_2/
    └── ...
```

> **Alternative:** TACO is also mirrored on Kaggle.
> Search "TACO Trash Annotations in Context" and download from there
> if the official download is slow.

---

## Full Pipeline — Commands in Order

All commands run from the **repo root** (the folder containing `frontend/`,
`backend/`, `ml/`, and `data/`).

### 1. Preprocess

Convert TACO COCO annotations → YOLO format and split into train/val/test:

```bash
python ml/preprocess.py
```

Output goes to `data/processed/`. Takes ~1–2 minutes.

### 2. Train

Fine-tune YOLOv8 on the processed dataset:

```bash
# Quick test run (nano model, fast but less accurate)
python ml/train.py --model n --epochs 10 --batch 8

# Recommended for final training
python ml/train.py --model m --epochs 100 --batch 16

# Resume an interrupted run
python ml/train.py --resume
```

`best.pt` is automatically copied to `data/models/best.pt` when training
finishes — that's the exact path the backend reads from.

### 3. Evaluate

Run the model against the held-out test split and print a full report:

```bash
python ml/evaluate.py
```

Saves a full text report to `data/models/eval_report.txt`.

### 4. Integration test

Verify the full image → YOLO → verdict pipeline without the server:

```bash
python ml/test_integration.py --image path/to/any/photo.jpg
```

Prints the JSON verdict exactly as the backend would return it, plus timing.

### 5. (Optional) Debug a single image

```bash
python ml/inference.py --image path/to/photo.jpg
python ml/inference.py --image path/to/photo.jpg --conf 0.3
```

Prints per-detection verdict and saves an annotated image to
`data/models/inference_output.jpg`.

---

## Hardware Recommendations

| Hardware | Training time (100 epochs) | Notes |
|---|---|---|
| CPU only (8 GB RAM) | ~4–8 hours | Feasible, just slow. Use `--batch 4` |
| Apple M-series (MPS) | ~1–2 hours | Set `--batch 8` to avoid MPS OOM |
| NVIDIA GPU (6 GB+ VRAM) | 30–45 minutes | Default settings work well |
| NVIDIA GPU (12 GB+ VRAM) | 20–30 minutes | Try `--batch 32` for speed |

The training script auto-detects CUDA → MPS → CPU in that order.

---

## Running on Google Colab (Free GPU)

Google Colab provides a free T4 GPU that can train this model in ~35 minutes.

```python
# In a Colab cell:
!git clone https://github.com/YOUR_USERNAME/Recycloscan.git
%cd Recycloscan

# Upload your data/taco/ folder using the Files panel, or mount Google Drive:
from google.colab import drive
drive.mount('/content/drive')
!cp -r /content/drive/MyDrive/taco data/taco

!pip install ultralytics
!python ml/preprocess.py
!python ml/train.py --model m --epochs 100 --batch 16
```

After training, download `data/models/best.pt` from the Files panel and place
it in your local `data/models/` directory.

---

## Connecting to the Backend

After `train.py` completes, `best.pt` is automatically written to
`data/models/best.pt`. This is the exact path `backend/app/config.py`
points to via the `MODEL_PATH` environment variable.

**To activate the real model:**

1. Open `backend/.env`
2. Remove the line `MOCK_INFERENCE=true` (or set it to `false`)
3. Restart the backend: `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`

The server will load `best.pt` on startup and log:
```
INFO  | app.services.yolo_service | YOLO model loaded successfully.
```

No other changes are needed anywhere in the codebase.

---

## File Reference

| File | Purpose |
|---|---|
| `ml/preprocess.py` | COCO → YOLO format conversion + train/val/test split |
| `ml/train.py` | YOLOv8 fine-tuning with CLI arguments |
| `ml/evaluate.py` | Full evaluation report against test split |
| `ml/inference.py` | Single-image debugging tool |
| `ml/test_integration.py` | End-to-end pipeline sanity check |
| `ml/config/taco.yaml` | Dataset config for Ultralytics |
| `ml/notebooks/explore_taco.ipynb` | EDA + training curve visualisation |
