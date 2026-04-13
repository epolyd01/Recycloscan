# RecycloScan

A mobile app that scans trash items and tells you whether they are recyclable, with explanations and education on common recycling misconceptions.

Built with React Native (Expo), FastAPI, and YOLOv8 fine-tuned on the TACO dataset.

For the full technical pipeline diagram, see [`full_recyclescan_pipeline.svg`](./full_recyclescan_pipeline.svg).

---

## What it does

Point your phone camera at any item, press scan, and the app identifies the object and tells you:
- Whether it is recyclable
- Why (a plain-language reason)
- A practical tip
- A common misconception about that item

All past scans are saved locally on your device. The Education Hub contains myth-vs-fact cards for the most commonly misunderstood recyclable materials.

---

## Tech stack

| Layer | Technology |
|---|---|
| Mobile app | React Native + Expo (TypeScript) |
| State management | Zustand + AsyncStorage |
| Backend API | FastAPI (Python) |
| Object detection | YOLOv8 (Ultralytics) |
| Training data | TACO dataset (60 classes) |
| Database | SQLite via SQLAlchemy (async) |

---

## Project structure

```
recyclescan/
├── frontend/          # React Native Expo app
├── backend/           # FastAPI server
├── ml/                # YOLOv8 training pipeline
├── data/              # Dataset and trained model weights (gitignored)
└── .env.example
```

---

## Getting started

### Prerequisites

- Node.js 18+
- Python 3.10+
- Expo Go app on your phone (for development)
- A GPU is recommended for training but not required to run the app

---

### 1. Clone the repo

```bash
git clone https://github.com/your-username/recyclescan.git
cd recyclescan
```

---

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
cp ../.env.example .env
uvicorn app.main:app --reload --port 8000
```

The server starts at `http://localhost:8000`.  
`GET /` returns `{ "status": "ok", "model_loaded": false }` until a trained model is present.

> If `best.pt` is missing, the server still starts. POST /api/scan will return a clear 503 until the model is trained.

---

### 3. Frontend

```bash
cd frontend
npm install
npx expo start
```

Scan the QR code in Expo Go.

By default the app points to `http://localhost:8000`. To change this, set the environment variable in `frontend/.env`:

```
EXPO_PUBLIC_API_URL=http://your-server-ip:8000
```

---

### 4. ML training pipeline

#### Download the TACO dataset

```bash
mkdir -p data/taco
curl -L https://github.com/pedropro/TACO/raw/master/data/annotations.json \
  -o data/taco/annotations.json
```

For the images, use the official TACO download script:

```bash
git clone https://github.com/pedropro/TACO.git taco_repo
cd taco_repo
pip install -r requirements.txt
python download.py --dataset_path ../data/taco
cd ..
```

#### Run the pipeline

```bash
# 1. Convert COCO annotations to YOLO format and split dataset
python ml/preprocess.py

# 2. Train YOLOv8 (use --model s for better accuracy, n for speed)
python ml/train.py --model s --epochs 100

# 3. Evaluate accuracy on the test split
python ml/evaluate.py

# 4. Test the full scan flow on a single image
python ml/test_integration.py --image path/to/photo.jpg
```

After training, `best.pt` is automatically copied to `data/models/best.pt` — the path the backend reads from. No manual steps needed.

#### Hardware recommendations

| Setup | Training time |
|---|---|
| CPU only (8GB RAM) | ~4 hours for 100 epochs |
| GPU 6GB+ VRAM | 30–40 minutes |
| Google Colab (free GPU) | ~45 minutes |

For Colab: upload the `data/` folder to your Google Drive, mount it, and run `ml/train.py` from the notebook.

---

## Environment variables

Copy `.env.example` to `backend/.env` and fill in:

```
MODEL_PATH=../data/models/best.pt
DATABASE_URL=sqlite+aiosqlite:///./recyclescan.db
CONFIDENCE_THRESHOLD=0.5
MAX_IMAGE_SIZE_MB=10
ALLOWED_ORIGINS=http://localhost:8081
```

---

## API endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/` | Health check, model loaded status |
| POST | `/api/scan` | Upload image, returns recyclability verdict |
| GET | `/api/education` | Returns list of myth-vs-fact education cards |
| GET | `/api/history` | Returns past scan records |
| DELETE | `/api/history/{id}` | Deletes a scan record |

---

## Connecting frontend to real backend

During development the frontend uses a mock API response. When the backend is ready:

1. Open `frontend/src/services/api.service.ts`
2. Delete the mock `scan()` implementation
3. Uncomment the real Axios POST `/api/scan` block below it

---

## Data

The `data/` folder is gitignored. It contains:
- `data/taco/` — raw TACO dataset images and annotations
- `data/processed/` — YOLO-format labels and train/val/test splits
- `data/models/best.pt` — trained model weights

---

## Acknowledgements

- [TACO dataset](http://tacodataset.org) — Trash Annotations in Context
- [Ultralytics YOLOv8](https://github.com/ultralytics/ultralytics)
- [Expo](https://expo.dev)
- [FastAPI](https://fastapi.tiangolo.com)

## LICENSE

MIT
