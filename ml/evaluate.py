"""
ml/evaluate.py — Evaluate best.pt against the test split and produce a full report.

Run from repo root:
    python ml/evaluate.py
    python ml/evaluate.py --model data/models/best.pt
    python ml/evaluate.py --model data/models/best.pt --conf 0.5
"""

import argparse
import json
import sys
from pathlib import Path

RULES_PATH   = Path("backend/app/data/recycling_rules.json")
YAML_PATH    = Path("ml/config/taco.yaml")
DEFAULT_MODEL = Path("data/models/best.pt")
REPORT_PATH  = Path("data/models/eval_report.txt")

YOLO_CLASS_NAMES: list[str] = [
    "Aluminium foil", "Battery", "Aluminium blister pack", "Carded blister pack",
    "Other plastic bottle", "Clear plastic bottle", "Glass bottle", "Plastic bottle cap",
    "Metal bottle cap", "Broken glass", "Food Can", "Aerosol", "Drink can",
    "Toilet tube", "Other carton", "Egg carton", "Drink carton", "Corrugated carton",
    "Meal carton", "Pizza box", "Paper cup", "Disposable plastic cup", "Foam cup",
    "Glass cup", "Other plastic cup", "Food waste", "Glass jar", "Plastic jar",
    "Plastic lid", "Metal lid", "Other plastic", "Magazine paper", "Tissues",
    "Wrapping paper", "Normal paper", "Paper bag", "Plastified paper bag", "Plastic film",
    "Six pack rings", "Garbage bag", "Other plastic wrapper", "Single-use carrier bag",
    "Polypropylene bag", "Crisp packet", "Spread tub", "Tupperware",
    "Disposable food container", "Foam food container", "Other plastic container",
    "Plastic gloves", "Plastic utensils", "Pop tab", "Rope", "Shoe", "Squeezable tube",
    "Plastic straw", "Paper straw", "Styrofoam piece", "Unlabeled litter", "Cigarette",
]

# Classes likely to be confused with each other
SIMILAR_PAIRS: list[tuple[str, str]] = [
    ("Clear plastic bottle", "Other plastic bottle"),
    ("Drink can", "Food Can"),
    ("Glass bottle", "Glass jar"),
    ("Plastic jar", "Other plastic container"),
    ("Foam cup", "Foam food container"),
    ("Plastic lid", "Plastic bottle cap"),
    ("Crisp packet", "Other plastic wrapper"),
    ("Single-use carrier bag", "Plastic film"),
    ("Corrugated carton", "Other carton"),
    ("Disposable plastic cup", "Other plastic cup"),
]


def load_rules() -> dict:
    with RULES_PATH.open(encoding="utf-8") as f:
        return json.load(f)


def format_table_row(name: str, samples: int, prec: float, rec: float, ap50: float, flag: str = "") -> str:
    return f"  {name:<30} {samples:>7}   {prec:>9.3f}   {rec:>6.3f}   {ap50:>6.3f}  {flag}"


def run(model_path: Path, conf: float) -> None:
    if not model_path.exists():
        print(
            f"\n❌  Model not found: {model_path}\n"
            "    Run python ml/train.py first.\n"
        )
        sys.exit(1)

    test_images = Path("data/processed/test/images")
    if not test_images.exists() or not any(test_images.iterdir()):
        print(
            "\n❌  Test split is empty or missing.\n"
            "    Run python ml/preprocess.py first.\n"
        )
        sys.exit(1)

    try:
        from ultralytics import YOLO
    except ImportError:
        print("❌  ultralytics not installed. Run: pip install ultralytics")
        sys.exit(1)

    rules = load_rules()

    print(f"\n🔬  Loading model from {model_path}…")
    model = YOLO(str(model_path))

    print(f"📊  Running validation on test split…  (conf={conf})\n")
    metrics = model.val(
        data=str(YAML_PATH),
        split="test",
        conf=conf,
        iou=0.5,
        verbose=False,
    )

    # ── Extract per-class metrics ──────────────────────────────────────────────
    map50    = float(metrics.box.map50)
    map50_95 = float(metrics.box.map)

    # Per-class arrays (length = nc)
    ap50_per_class  = metrics.box.ap50.tolist()   if hasattr(metrics.box, "ap50")  else []
    prec_per_class  = metrics.box.p.tolist()       if hasattr(metrics.box, "p")     else []
    rec_per_class   = metrics.box.r.tolist()       if hasattr(metrics.box, "r")     else []
    nc = len(ap50_per_class)

    # Number of ground-truth samples per class (from confusion matrix if available)
    try:
        samples_per_class = metrics.box.nt.tolist()
    except AttributeError:
        samples_per_class = [0] * nc

    # Build per-class records
    class_rows = []
    for i in range(min(nc, len(YOLO_CLASS_NAMES))):
        class_rows.append({
            "name":    YOLO_CLASS_NAMES[i],
            "samples": int(samples_per_class[i]) if i < len(samples_per_class) else 0,
            "prec":    prec_per_class[i]  if i < len(prec_per_class)  else 0.0,
            "rec":     rec_per_class[i]   if i < len(rec_per_class)   else 0.0,
            "ap50":    ap50_per_class[i]  if i < len(ap50_per_class)  else 0.0,
            "recyclable": rules.get(YOLO_CLASS_NAMES[i], {}).get("recyclable"),
        })

    class_rows.sort(key=lambda r: r["ap50"], reverse=True)

    # ── Build report text ─────────────────────────────────────────────────────
    lines: list[str] = []

    def add(line: str = "") -> None:
        lines.append(line)

    add("=" * 70)
    add("  RecycloScan — Model Evaluation Report")
    add("=" * 70)
    add(f"  Model  : {model_path.resolve()}")
    add(f"  Split  : test")
    add(f"  Conf   : {conf}")
    add()
    add("  ── Overall Metrics ─────────────────────────────────────────────")
    add(f"  mAP50      : {map50:.4f}  ({map50*100:.1f}%)")
    add(f"  mAP50-95   : {map50_95:.4f}  ({map50_95*100:.1f}%)")
    add()

    # Per-class table
    add("  ── Per-Class Results (sorted by AP50 descending) ───────────────")
    add(f"  {'Class':<30} {'Samples':>7}   {'Precision':>9}   {'Recall':>6}   {'AP50':>6}")
    add("  " + "─" * 66)
    for row in class_rows:
        flag = "⚠ " if row["ap50"] < 0.3 else ""
        add(format_table_row(row["name"], row["samples"], row["prec"], row["rec"], row["ap50"], flag))
    add()

    # Worst performers
    worst = [r for r in class_rows if r["ap50"] < 0.3]
    if worst:
        add("  ── Worst Performing Classes (AP50 < 0.30) ─────────────────────")
        for row in worst:
            add(f"  ⚠  {row['name']:<30}  AP50={row['ap50']:.3f}  (samples: {row['samples']})")
        add()
    else:
        add("  ✓  All classes achieved AP50 ≥ 0.30")
        add()

    # Recyclable vs non-recyclable group summary
    add("  ── Group Accuracy: Recyclable vs Non-Recyclable ────────────────")
    for group_val, label in [(True, "Recyclable"), (False, "Not Recyclable"), (None, "Unknown")]:
        group = [r for r in class_rows if r["recyclable"] == group_val]
        if not group:
            continue
        avg_ap50 = sum(r["ap50"] for r in group) / len(group)
        avg_prec = sum(r["prec"] for r in group) / len(group)
        add(f"  {label:<18}  classes={len(group):>2}  avg AP50={avg_ap50:.3f}  avg Prec={avg_prec:.3f}")
    add()

    # Similar class confusions
    add("  ── Easily Confused Class Pairs ─────────────────────────────────")
    class_ap = {r["name"]: r["ap50"] for r in class_rows}
    for cls_a, cls_b in SIMILAR_PAIRS:
        ap_a = class_ap.get(cls_a, None)
        ap_b = class_ap.get(cls_b, None)
        if ap_a is None or ap_b is None:
            continue
        note = "⚠ " if ap_a < 0.4 or ap_b < 0.4 else "  "
        add(f"  {note}{cls_a:<30} AP50={ap_a:.3f}")
        add(f"    vs {cls_b:<28} AP50={ap_b:.3f}")
    add()
    add("=" * 70)

    report_text = "\n".join(lines)

    # ── Print to terminal ──────────────────────────────────────────────────────
    print(report_text)

    # ── Save to file ───────────────────────────────────────────────────────────
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(report_text + "\n", encoding="utf-8")
    print(f"\n📄  Full report saved to: {REPORT_PATH.resolve()}\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Evaluate trained YOLOv8 model on the TACO test split."
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
    run(args.model, args.conf)
