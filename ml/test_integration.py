"""
ml/test_integration.py — End-to-end sanity check: image → YOLO → classifier → JSON verdict.

Replicates exactly what yolo_service.py + classifier.py do in the backend,
without needing the FastAPI server running.

Run from repo root:
    python ml/test_integration.py --image path/to/photo.jpg
    python ml/test_integration.py --image path/to/photo.jpg --conf 0.3
    python ml/test_integration.py --image path/to/photo.jpg --model data/models/best.pt

Exit code 0 on success, 1 on any error.
"""

import argparse
import json
import sys
import time
from io import BytesIO
from pathlib import Path

MODEL_PATH = Path("data/models/best.pt")
RULES_PATH = Path("backend/app/data/recycling_rules.json")


def check_prerequisites(model_path: Path) -> bool:
    ok = True
    if not model_path.exists():
        print(
            f"\n❌  Model not found: {model_path}\n"
            "    Run the full pipeline first:\n"
            "      1. python ml/preprocess.py\n"
            "      2. python ml/train.py\n"
        )
        ok = False
    if not RULES_PATH.exists():
        print(f"\n❌  recycling_rules.json not found: {RULES_PATH}")
        ok = False
    return ok


def load_rules() -> dict:
    with RULES_PATH.open(encoding="utf-8") as f:
        return json.load(f)


def run_yolo(model, image_bytes: bytes, conf: float) -> list[dict]:
    """
    Mirrors yolo_service.run_inference() exactly.
    """
    import numpy as np
    from PIL import Image

    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    img_array = numpy_from_pil(image)

    results = model(img_array, conf=conf, verbose=False)

    detections = []
    for result in results:
        boxes = result.boxes
        if boxes is None:
            continue
        names = result.names
        for box in boxes:
            cls_id = int(box.cls[0].item())
            detections.append({
                "class_id":   cls_id,
                "class_name": names.get(cls_id, f"class_{cls_id}"),
                "confidence": float(box.conf[0].item()),
                "bbox":       [round(v, 2) for v in box.xyxy[0].tolist()],
            })

    detections.sort(key=lambda d: d["confidence"], reverse=True)
    return detections


def numpy_from_pil(image) -> "np.ndarray":
    import numpy as np
    return np.array(image)


def classify(detections: list[dict], rules: dict) -> dict:
    """
    Mirrors classifier.classify() exactly.
    """
    if not detections:
        return {
            "item":         "Unknown",
            "recyclable":   False,
            "confidence":   0.0,
            "reason":       "No item detected. Try better lighting or move closer to the object.",
            "tip":          "Make sure the item fills most of the camera frame and is well-lit.",
            "misconception": None,
        }

    best = detections[0]
    class_name = best["class_name"]
    confidence = best["confidence"]

    rule = rules.get(class_name)
    if rule is None:
        return {
            "item":         class_name,
            "recyclable":   False,
            "confidence":   confidence,
            "reason":       "Item recognised but its recycling status is not yet in our database.",
            "tip":          "Check your local council's recycling guidelines for this item.",
            "misconception": None,
        }

    return {
        "item":         class_name,
        "recyclable":   rule["recyclable"],
        "confidence":   confidence,
        "reason":       rule["reason"],
        "tip":          rule["tip"],
        "misconception": rule.get("misconception"),
    }


def main(image_path: Path, model_path: Path, conf: float) -> int:
    print("\n" + "═" * 60)
    print("  RecycloScan Integration Test")
    print("═" * 60)

    if not check_prerequisites(model_path):
        return 1

    if not image_path.exists():
        print(f"\n❌  Image not found: {image_path}\n")
        return 1

    # ── Step 1: Load model ────────────────────────────────────────────────────
    try:
        from ultralytics import YOLO
    except ImportError:
        print("❌  ultralytics not installed. Run: pip install ultralytics")
        return 1

    try:
        print(f"\n[1/4] Loading model: {model_path}")
        t_load = time.perf_counter()
        model = YOLO(str(model_path))
        load_ms = (time.perf_counter() - t_load) * 1000
        print(f"      ✓  Model loaded in {load_ms:.0f} ms")
    except Exception as exc:
        print(f"❌  Failed to load model: {exc}")
        return 1

    # ── Step 2: Load image ────────────────────────────────────────────────────
    try:
        print(f"\n[2/4] Reading image: {image_path}")
        image_bytes = image_path.read_bytes()
        print(f"      ✓  Image size: {len(image_bytes) / 1024:.1f} KB")
    except Exception as exc:
        print(f"❌  Failed to read image: {exc}")
        return 1

    # ── Step 3: Run YOLO inference ────────────────────────────────────────────
    try:
        print(f"\n[3/4] Running YOLO inference  (conf threshold: {conf})")
        t_inf = time.perf_counter()
        detections = run_yolo(model, image_bytes, conf)
        inf_ms = (time.perf_counter() - t_inf) * 1000
        print(f"      ✓  Inference complete in {inf_ms:.0f} ms")
        print(f"      ✓  Detections: {len(detections)}")
        for det in detections:
            print(f"         • {det['class_name']}  ({det['confidence']:.0%})")
    except Exception as exc:
        print(f"❌  Inference failed: {exc}")
        return 1

    # ── Step 4: Classify → verdict ────────────────────────────────────────────
    try:
        print(f"\n[4/4] Classifying detections against recycling_rules.json")
        rules = load_rules()
        verdict = classify(detections, rules)
        print(f"      ✓  Classification complete")
    except Exception as exc:
        print(f"❌  Classification failed: {exc}")
        return 1

    # ── Output ────────────────────────────────────────────────────────────────
    total_ms = load_ms + inf_ms

    print("\n" + "─" * 60)
    print("  Verdict (JSON — exactly what backend returns to frontend):")
    print("─" * 60)
    print(json.dumps(verdict, indent=2, ensure_ascii=False))
    print("─" * 60)
    print(f"\n  Total pipeline time : {total_ms:.0f} ms")
    print(f"    Model load        : {load_ms:.0f} ms  (one-time cost at server start)")
    print(f"    Inference         : {inf_ms:.0f} ms  (per-request cost)")
    print()

    if verdict["recyclable"]:
        print("  ♻   RECYCLABLE — this item can go in the recycling bin.")
    else:
        print("  🗑   NOT RECYCLABLE — this item goes in general waste.")

    print("\n" + "═" * 60 + "\n")
    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="End-to-end integration test: image → YOLO → recycling verdict."
    )
    parser.add_argument(
        "--image",
        type=Path,
        required=True,
        help="Path to input image (JPEG or PNG)",
    )
    parser.add_argument(
        "--model",
        type=Path,
        default=MODEL_PATH,
        help=f"Path to .pt model file (default: {MODEL_PATH})",
    )
    parser.add_argument(
        "--conf",
        type=float,
        default=0.5,
        help="YOLO confidence threshold (default: 0.5)",
    )
    args = parser.parse_args()
    sys.exit(main(args.image, args.model, args.conf))
