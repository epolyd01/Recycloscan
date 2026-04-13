"""
ml/train.py — Fine-tune YOLOv8 on the preprocessed TACO dataset.

Run from repo root:
    python ml/train.py                          # default: yolov8n, 100 epochs
    python ml/train.py --epochs 50 --batch 8 --model s
    python ml/train.py --resume                 # continue from last checkpoint
    python ml/train.py --model m --epochs 100 --batch 16
"""

import argparse
import shutil
import sys
from pathlib import Path


YAML_PATH   = Path("ml/config/taco.yaml")
OUTPUT_DIR  = Path("data/models")
RUN_NAME    = "taco_yolov8"
BEST_PT_DST = OUTPUT_DIR / "best.pt"

MODEL_SIZES = {
    "n": "yolov8n.pt",  # nano   — fastest, good for testing
    "s": "yolov8s.pt",  # small  — better accuracy, still mobile-friendly
    "m": "yolov8m.pt",  # medium — use for final production training
    "l": "yolov8l.pt",  # large  — high accuracy, needs strong GPU
    "x": "yolov8x.pt",  # xlarge — maximum accuracy
}


def detect_device() -> str:
    """Return 'cuda', 'mps', or 'cpu' — whichever is available."""
    try:
        import torch
        if torch.cuda.is_available():
            return "cuda"
        if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            return "mps"
    except ImportError:
        pass
    return "cpu"


def train(
    epochs: int,
    imgsz: int,
    batch: int,
    model_size: str,
    resume: bool,
    cache: bool,
    workers: int,
) -> None:
    if not YAML_PATH.exists():
        print(f"❌  Dataset config not found: {YAML_PATH}")
        print("    Run python ml/preprocess.py first.")
        sys.exit(1)

    processed_train = Path("data/processed/train/images")
    if not processed_train.exists() or not any(processed_train.iterdir()):
        print("❌  Processed dataset is empty or missing.")
        print("    Run python ml/preprocess.py first.")
        sys.exit(1)

    try:
        from ultralytics import YOLO
    except ImportError:
        print("❌  ultralytics not installed. Run: pip install ultralytics")
        sys.exit(1)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    device = detect_device()
    print(f"\n🖥   Training device : {device}")

    if resume:
        last_pt = OUTPUT_DIR / RUN_NAME / "weights" / "last.pt"
        if not last_pt.exists():
            print(f"❌  No checkpoint found to resume from: {last_pt}")
            sys.exit(1)
        print(f"▶   Resuming from {last_pt}")
        model = YOLO(str(last_pt))
        results = model.train(resume=True)
    else:
        base_weights = MODEL_SIZES.get(model_size, "yolov8n.pt")
        print(f"▶   Starting training: {base_weights}  →  {RUN_NAME}")
        print(f"    Epochs: {epochs} | Image size: {imgsz} | Batch: {batch}")
        print(f"    Early stopping patience: 20 epochs\n")

        model = YOLO(base_weights)
        results = model.train(
            data=str(YAML_PATH),
            epochs=epochs,
            imgsz=imgsz,
            batch=batch,
            patience=20,
            save=True,
            project=str(OUTPUT_DIR),
            name=RUN_NAME,
            exist_ok=True,
            pretrained=True,
            optimizer="AdamW",
            lr0=0.001,
            augment=True,
            cache=cache,
            device=device,
            workers=workers,
            verbose=True,
        )

    # ── Copy best.pt to the canonical location the backend expects ────────────
    run_best = OUTPUT_DIR / RUN_NAME / "weights" / "best.pt"
    if run_best.exists():
        shutil.copy2(run_best, BEST_PT_DST)
        print(f"\n✅  best.pt copied to {BEST_PT_DST.resolve()}")
    else:
        print(f"\n⚠   Could not find {run_best} — check the training output directory.")

    # ── Print final metrics ───────────────────────────────────────────────────
    try:
        metrics = results.results_dict
        map50    = metrics.get("metrics/mAP50(B)",    metrics.get("metrics/mAP50", "N/A"))
        map50_95 = metrics.get("metrics/mAP50-95(B)", metrics.get("metrics/mAP50-95", "N/A"))
        print("\n" + "═" * 50)
        print("  Training complete")
        print("═" * 50)
        if isinstance(map50, float):
            print(f"  mAP50      : {map50:.4f}  ({map50*100:.1f}%)")
        else:
            print(f"  mAP50      : {map50}")
        if isinstance(map50_95, float):
            print(f"  mAP50-95   : {map50_95:.4f}  ({map50_95*100:.1f}%)")
        else:
            print(f"  mAP50-95   : {map50_95}")
        print(f"  Model path : {BEST_PT_DST.resolve()}")
        print("═" * 50 + "\n")
    except Exception:
        print("  (Could not parse final metrics from results object.)")

    print("Next step: python ml/evaluate.py")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Fine-tune YOLOv8 on TACO trash dataset."
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=100,
        help="Number of training epochs (default: 100)",
    )
    parser.add_argument(
        "--imgsz",
        type=int,
        default=640,
        help="Input image size in pixels (default: 640)",
    )
    parser.add_argument(
        "--batch",
        type=int,
        default=16,
        help="Batch size — reduce to 8 if you get out-of-memory errors (default: 16)",
    )
    parser.add_argument(
        "--model",
        choices=list(MODEL_SIZES.keys()),
        default="n",
        help="YOLOv8 model size: n=nano, s=small, m=medium, l=large, x=xlarge (default: n)",
    )
    parser.add_argument(
        "--resume",
        action="store_true",
        help="Resume training from the last checkpoint (data/models/taco_yolov8/weights/last.pt)",
    )
    parser.add_argument(
        "--cache",
        action="store_true",
        help="Cache images in RAM for faster training (recommended if you have >16 GB RAM)",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=4,
        help="Number of dataloader worker processes (default: 4)",
    )
    args = parser.parse_args()
    train(
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        model_size=args.model,
        resume=args.resume,
        cache=args.cache,
        workers=args.workers,
    )
