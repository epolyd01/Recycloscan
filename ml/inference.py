"""
ml/inference.py — Test best.pt on a single image without running the backend.

Run from repo root:
    python ml/inference.py --image path/to/photo.jpg
    python ml/inference.py --image path/to/photo.jpg --conf 0.3
    python ml/inference.py --image path/to/photo.jpg --model data/models/best.pt
"""

import argparse
import json
import sys
import time
from pathlib import Path

RULES_PATH = Path("backend/app/data/recycling_rules.json")
DEFAULT_MODEL = Path("data/models/best.pt")
OUTPUT_IMAGE = Path("data/models/inference_output.jpg")


def load_rules() -> dict:
    if not RULES_PATH.exists():
        print(f"⚠   recycling_rules.json not found at {RULES_PATH}")
        return {}
    with RULES_PATH.open(encoding="utf-8") as f:
        return json.load(f)


def draw_boxes(image_path: Path, detections: list[dict], rules: dict, output_path: Path) -> None:
    """Draw bounding boxes and labels on the image and save it."""
    try:
        import cv2
        import numpy as np
    except ImportError:
        print("⚠   opencv-python not installed — skipping annotated image output.")
        return

    img = cv2.imread(str(image_path))
    if img is None:
        print(f"⚠   Could not read image for annotation: {image_path}")
        return

    h, w = img.shape[:2]

    for det in detections:
        x1, y1, x2, y2 = [int(v) for v in det["bbox"]]
        class_name = det["class_name"]
        conf = det["confidence"]
        rule = rules.get(class_name, {})
        recyclable = rule.get("recyclable", None)

        # Green = recyclable, Red = not recyclable, Grey = unknown
        if recyclable is True:
            color = (34, 197, 94)   # green
        elif recyclable is False:
            color = (239, 68, 68)   # red
        else:
            color = (150, 150, 150)

        cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)

        label = f"{class_name} {conf:.0%}"
        (lw, lh), baseline = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 1)
        cv2.rectangle(img, (x1, y1 - lh - baseline - 4), (x1 + lw, y1), color, -1)
        cv2.putText(
            img, label,
            (x1, y1 - baseline - 2),
            cv2.FONT_HERSHEY_SIMPLEX, 0.55,
            (255, 255, 255), 1, cv2.LINE_AA,
        )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(output_path), img)
    print(f"\n📸  Annotated image saved to: {output_path.resolve()}")


def run(image_path: Path, model_path: Path, conf: float) -> None:
    if not model_path.exists():
        print(
            f"\n❌  Model not found: {model_path}\n"
            "    Run python ml/train.py first to produce best.pt.\n"
        )
        sys.exit(1)

    if not image_path.exists():
        print(f"\n❌  Image not found: {image_path}\n")
        sys.exit(1)

    try:
        from ultralytics import YOLO
    except ImportError:
        print("❌  ultralytics not installed. Run: pip install ultralytics")
        sys.exit(1)

    rules = load_rules()

    print(f"\n🔍  Loading model from {model_path}…")
    model = YOLO(str(model_path))

    print(f"📷  Running inference on {image_path}  (confidence threshold: {conf})\n")
    t0 = time.perf_counter()
    results = model(str(image_path), conf=conf, verbose=False)
    elapsed_ms = (time.perf_counter() - t0) * 1000

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
                "bbox":       [round(v, 1) for v in box.xyxy[0].tolist()],
            })

    detections.sort(key=lambda d: d["confidence"], reverse=True)

    print("─" * 70)
    if not detections:
        print(f"  No items detected above confidence threshold ({conf})")
        print("─" * 70)
        print(f"\n  Inference time: {elapsed_ms:.1f} ms")
        return

    print(f"  {len(detections)} detection(s) found:\n")

    for i, det in enumerate(detections, 1):
        name = det["class_name"]
        conf_pct = det["confidence"] * 100
        rule = rules.get(name, {})
        recyclable = rule.get("recyclable")

        if recyclable is True:
            verdict = "♻   YES — recyclable"
        elif recyclable is False:
            verdict = "🗑   NO  — not recyclable"
        else:
            verdict = "❓  Unknown"

        print(f"  [{i}] Class      : {name}")
        print(f"      Confidence : {conf_pct:.1f}%")
        print(f"      Recyclable : {verdict}")
        if rule.get("reason"):
            print(f"      Reason     : {rule['reason']}")
        if rule.get("tip"):
            print(f"      Tip        : {rule['tip']}")
        if rule.get("misconception"):
            print(f"      Note       : {rule['misconception']}")
        print()

    print("─" * 70)
    print(f"\n  Inference time: {elapsed_ms:.1f} ms")

    draw_boxes(image_path, detections, rules, OUTPUT_IMAGE)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Run YOLOv8 inference on a single image and display recycling verdict."
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
        default=DEFAULT_MODEL,
        help=f"Path to .pt model file (default: {DEFAULT_MODEL})",
    )
    parser.add_argument(
        "--conf",
        type=float,
        default=0.5,
        help="Confidence threshold (default: 0.5)",
    )
    args = parser.parse_args()
    run(args.image, args.model, args.conf)
