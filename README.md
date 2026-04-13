```markdown
# RecycleRight

A mobile app that scans trash items and tells you whether they are recyclable — with explanations, confidence scores, and education on common recycling misconceptions.

Built with React Native (Expo), FastAPI, and YOLOv8 fine-tuned on the TACO dataset. Selected as a top-12 finalist team.

For the full technical pipeline diagram, see [`full_recyclescan_pipeline.svg`](./full_recyclescan_pipeline.svg).

---

## What it does

Point your phone camera at any trash item. The app identifies it, tells you if it's recyclable, explains why, and corrects common misconceptions — for example, that pizza boxes are always recyclable, or that bottle caps must be removed before recycling.

---

## Tech stack

| Layer | Technology |
|---|---|
| Mobile app | React Native, Expo SDK 51 |
| State management | Zustand + AsyncStorage |
| Backend API | FastAPI, Python |
| Object detection | YOLOv8 (Ultralytics) |
| Training dataset | TACO (Trash Annotations in Context) |
| Database | SQLite via SQLAlchemy (async) |
| Containerization | Docker + Docker Compose |

---

## Project structure

```
recyclescan/
├── frontend/          # React Native Expo app
├── backend/           # FastAPI server
├── ml/                # Training, evaluation, inference scripts
├── data/              # Raw TACO dataset + processed splits + model weights
├── docker-compose.yml
└── .env.example
```

---

## Prerequisites

- Node.js 18+
- Python 3.10+
- Expo Go app on your phone (for development)
- A GPU is recommended for training (see ML section)

---

## Quickstart

### 1. Clone the repo

```bash
git clone https://github.com/your-username/recyclescan.git
cd recyclescan
```

### 2. Environment variables

```bash
cp .env.example .env
```

Edit `.env` and set your values. The defaults work for local development without changes.

### 3. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The server starts at `http://localhost:8000`. Visit `http://localhost:8000/` to confirm — it returns `{ "status": "ok", "model_loaded": false }` if `best.pt` has not been trained yet (which is expected on first run).

### 4. Frontend

```bash
cd frontend
npm install
npx expo start
```

Scan the QR code in Expo Go. The app will connect to the backend at `http://localhost:8000` by default.

To change the backend URL, set this in `frontend/.env`:

```
EXPO_PUBLIC_API_URL=http://your-server-ip:8000
```

---

## ML — training the model

The backend returns a 503 until `best.pt` exists. Follow these steps to train it.

### Download TACO dataset

```bash
mkdir -p data/taco
curl -L https://github.com/pedropro/TACO/raw/master/data/annotations.json \
  -o data/taco/annotations.json

python - <<'EOF'
import json, urllib.request, os, pathlib
with open("data/taco/annotations.json") as f:
    data = json.load(f)
pathlib.Path("data/taco/images").mkdir(parents=True, exist_ok=True)
for img in data["images"]:
    dest = f"data/taco/images/{img['file_name']}"
    if not os.path.exists(dest):
        print(f"Downloading {img['file_name']}...")
        urllib.request.urlretrieve(img["flickr_url"], dest)
print("Done.")
EOF
```

### Run the full pipeline

```bash
# Step 1 — convert COCO annotations to YOLO format and split dataset
python ml/preprocess.py

# Step 2 — fine-tune YOLOv8 on TACO (see hardware notes below)
python ml/train.py --model s

# Step 3 — evaluate accuracy on the test split
python ml/evaluate.py

# Step 4 — sanity check before connecting the app
python ml/test_integration.py --image data/taco/images/any_image.jpg
```

After training, `best.pt` is automatically copied to `data/models/best.pt` — the exact path the backend reads from. No manual steps needed.

### CLI options for train.py

```bash
python ml/train.py                   # default: yolov8s, 100 epochs, batch 16
python ml/train.py --model n         # faster, less accurate (good for testing)
python ml/train.py --model m         # more accurate, slower
python ml/train.py --epochs 50       # fewer epochs
python ml/train.py --batch 8         # reduce if you get out-of-memory errors
python ml/train.py --resume          # continue from last checkpoint
```

### Hardware recommendations

| Setup | Training time |
|---|---|
| CPU only (8GB RAM) | ~4 hours for 100 epochs |
| GPU 6GB+ VRAM | 30–40 minutes |
| Google Colab (free GPU) | ~45 minutes |

### Training on Google Colab

1. Upload the `data/` folder to your Google Drive
2. Open `ml/notebooks/explore_taco.ipynb` in Colab
3. Mount Drive and run `train.py` from the notebook:

```python
import subprocess
subprocess.run([
    "python", "ml/train.py",
    "--model", "s",
    "--epochs", "100"
])
```

4. Download `data/models/best.pt` back to your machine when done

---

## API reference

All routes are prefixed with `/api`.

| Method | Route | Description |
|---|---|---|
| `GET` | `/` | Health check, model loaded status |
| `POST` | `/api/scan` | Upload image, returns recyclability verdict |
| `GET` | `/api/education` | Returns list of myth-vs-fact education cards |
| `GET` | `/api/history` | Returns past scan records |
| `DELETE` | `/api/history/{id}` | Deletes a scan record by ID |

### POST /api/scan — example response

```json
{
  "item": "plastic bottle",
  "recyclable": true,
  "confidence": 0.87,
  "reason": "PET plastic bottles are accepted in most curbside recycling programs.",
  "tip": "Rinse before recycling. Leave the cap on.",
  "misconception": "Caps do NOT need to be removed — most modern facilities accept them attached."
}
```

---

## Running with Docker

```bash
cp .env.example .env
docker-compose up --build
```

This starts the FastAPI backend on port 8000. The frontend still runs via Expo on your machine — Docker is for the backend and database only.

---

## How scan history works

History is stored entirely on the user's device using AsyncStorage — no account or login required. Zustand's persist middleware automatically saves every scan result as JSON on the phone and reloads it when the app opens. History is capped at 50 entries, newest first.

This means history is device-only. If the user uninstalls the app, history is lost. Cross-device sync is not implemented — the backend `scan_history` table exists for server-side logging only.

---

## Dataset

This project uses the [TACO dataset](http://tacodataset.org/) — Trash Annotations in Context. TACO contains ~1500 images of litter in the wild annotated across 60 categories including plastic bottles, cans, cigarettes, cardboard, and more.

```
@article{taco2020,
  title={TACO: Trash Annotations in Context for Litter Detection},
  author={Pedro F Proença and Pedro Simões},
  journal={arXiv preprint arXiv:2003.06975},
  year={2020}
}
```

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a pull request

---

## License

MIT
```