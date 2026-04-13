# RecycloScan

A prototype mobile app that uses your phone camera and a fine-tuned AI model to tell you whether an item is recyclable — in under one second.

Point your camera at a piece of litter, tap scan, and get back a clear verdict: ♻ recyclable or not recyclable, with a plain-English reason and a tip on what to do with it.

---

## How it works

The system has three phases:

**1. Training (done once, offline)**
A YOLOv8 object detection model is fine-tuned on the [TACO dataset](http://tacodataset.org/) — ~1,500 real-world photos of litter in the wild. The result is a `best.pt` weights file that knows how to detect 60 categories of trash.

**2. Server startup**
When the FastAPI backend starts, it loads `best.pt` into memory once. It also loads `recycling_rules.json` — a lookup table that maps each of the 60 TACO classes to a human-readable recycling verdict, reason, tip, and common misconception.

**3. Live scan (every request)**
The app compresses the photo and sends it to the backend. The model detects what's in the image and returns the highest-confidence detection. The classifier looks it up in the rules table and sends back a JSON verdict. The whole round trip takes under one second.

For the full technical pipeline diagram, see [`full_recyclescan_pipeline.svg`](./full_recyclescan_pipeline.svg).

---

## Project structure

```
├── frontend/        # React Native app (Expo)
├── backend/         # FastAPI server + recycling rules
├── ml/              # Training, evaluation, and inference scripts
└── data/            # TACO dataset + processed splits + model weights (gitignored)
```

---

## Running locally

### Backend
```bash
cd backend
cp .env.example .env
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm install
npx expo start
```

Scan the QR code in Expo Go on your phone. Make sure your phone and Mac are on the same Wi-Fi network, and set `EXPO_PUBLIC_API_URL=http://<your-mac-ip>:8000` in `frontend/.env`.

### Training the model
```bash
# 1. Download TACO dataset (see ml/README.md for instructions)
# 2. Preprocess
python3 ml/preprocess.py
# 3. Train
python3 ml/train.py --model m --epochs 100
# 4. Evaluate
python3 ml/evaluate.py
```

See [`ml/README.md`](./ml/README.md) for full training instructions including Google Colab setup.

---

## Tech stack

| Layer | Technology |
|---|---|
| Mobile app | React Native, Expo, TypeScript |
| UI state | Zustand |
| Backend API | FastAPI, Python |
| Object detection | YOLOv8 (Ultralytics) |
| Training data | TACO dataset (60 classes) |
| Database | SQLite (scan history) |
