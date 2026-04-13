"""
ml/preprocess.py — Convert TACO COCO annotations to YOLO format and split dataset.

Run from repo root:
    python ml/preprocess.py
    python ml/preprocess.py --taco-dir data/taco --out-dir data/processed --seed 42
"""

import argparse
import json
import logging
import random
import shutil
import sys
from collections import Counter, defaultdict
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
log = logging.getLogger(__name__)

# Class names in order — must match ml/config/taco.yaml and recycling_rules.json
YOLO_CLASS_NAMES: list[str] = [
    "Aluminium foil",           #  0
    "Battery",                  #  1
    "Aluminium blister pack",   #  2
    "Carded blister pack",      #  3
    "Other plastic bottle",     #  4
    "Clear plastic bottle",     #  5
    "Glass bottle",             #  6
    "Plastic bottle cap",       #  7
    "Metal bottle cap",         #  8
    "Broken glass",             #  9
    "Food Can",                 # 10
    "Aerosol",                  # 11
    "Drink can",                # 12
    "Toilet tube",              # 13
    "Other carton",             # 14
    "Egg carton",               # 15
    "Drink carton",             # 16
    "Corrugated carton",        # 17
    "Meal carton",              # 18
    "Pizza box",                # 19
    "Paper cup",                # 20
    "Disposable plastic cup",   # 21
    "Foam cup",                 # 22
    "Glass cup",                # 23
    "Other plastic cup",        # 24
    "Food waste",               # 25
    "Glass jar",                # 26
    "Plastic jar",              # 27
    "Plastic lid",              # 28
    "Metal lid",                # 29
    "Other plastic",            # 30
    "Magazine paper",           # 31
    "Tissues",                  # 32
    "Wrapping paper",           # 33
    "Normal paper",             # 34
    "Paper bag",                # 35
    "Plastified paper bag",     # 36
    "Plastic film",             # 37
    "Six pack rings",           # 38
    "Garbage bag",              # 39
    "Other plastic wrapper",    # 40
    "Single-use carrier bag",   # 41
    "Polypropylene bag",        # 42
    "Crisp packet",             # 43
    "Spread tub",               # 44
    "Tupperware",               # 45
    "Disposable food container",# 46
    "Foam food container",      # 47
    "Other plastic container",  # 48
    "Plastic gloves",           # 49
    "Plastic utensils",         # 50
    "Pop tab",                  # 51
    "Rope",                     # 52
    "Shoe",                     # 53
    "Squeezable tube",          # 54
    "Plastic straw",            # 55
    "Paper straw",              # 56
    "Styrofoam piece",          # 57
    "Unlabeled litter",         # 58
    "Cigarette",                # 59
]

NAME_TO_IDX: dict[str, int] = {name: idx for idx, name in enumerate(YOLO_CLASS_NAMES)}


def clamp(value: float) -> float:
    return max(0.0, min(1.0, value))


def coco_bbox_to_yolo(
    x: float, y: float, w: float, h: float, img_w: int, img_h: int
) -> tuple[float, float, float, float] | None:
    """
    Convert COCO [x_top_left, y_top_left, width, height] (pixels) to
    YOLO [x_center, y_center, w_norm, h_norm] (normalised 0–1).

    Returns None if the box is degenerate (zero width or height).
    """
    if w <= 0 or h <= 0:
        return None
    x_c = clamp((x + w / 2) / img_w)
    y_c = clamp((y + h / 2) / img_h)
    w_n = clamp(w / img_w)
    h_n = clamp(h / img_h)
    return x_c, y_c, w_n, h_n


def stratified_split(
    image_ids: list[int],
    primary_class: dict[int, int],
    train_ratio: float = 0.8,
    val_ratio: float = 0.1,
    seed: int = 42,
) -> tuple[list[int], list[int], list[int]]:
    """
    Split image_ids into train/val/test while ensuring every class
    that appears anywhere also appears in every split where possible.

    Strategy: group by primary class, then split each group proportionally.
    """
    rng = random.Random(seed)

    # Group images by their primary class
    by_class: dict[int, list[int]] = defaultdict(list)
    for img_id in image_ids:
        cls = primary_class.get(img_id, -1)
        by_class[cls].append(img_id)

    train, val, test = [], [], []

    for cls, ids in by_class.items():
        rng.shuffle(ids)
        n = len(ids)
        n_train = max(1, round(n * train_ratio))
        n_val = max(1, round(n * val_ratio)) if n > 2 else 0
        train.extend(ids[:n_train])
        val.extend(ids[n_train : n_train + n_val])
        test.extend(ids[n_train + n_val :])

    rng.shuffle(train)
    rng.shuffle(val)
    rng.shuffle(test)
    return train, val, test


def write_split(
    split_name: str,
    image_ids: list[int],
    image_meta: dict[int, dict],
    yolo_labels: dict[int, list[str]],
    taco_dir: Path,
    out_dir: Path,
) -> int:
    """
    Copy images and write label files for one split.
    Returns the number of images successfully written.
    """
    img_out = out_dir / split_name / "images"
    lbl_out = out_dir / split_name / "labels"
    img_out.mkdir(parents=True, exist_ok=True)
    lbl_out.mkdir(parents=True, exist_ok=True)

    written = 0
    for img_id in image_ids:
        meta = image_meta[img_id]
        # TACO images may be in subdirectories; file_name is relative to taco_dir
        src = taco_dir / meta["file_name"]
        if not src.exists():
            # Some TACO downloads store images directly under taco_dir/images/
            src_alt = taco_dir / "images" / Path(meta["file_name"]).name
            if src_alt.exists():
                src = src_alt
            else:
                log.warning("Image file not found, skipping: %s", src)
                continue

        stem = src.stem
        dst_img = img_out / src.name
        dst_lbl = lbl_out / f"{stem}.txt"

        shutil.copy2(src, dst_img)

        lines = yolo_labels.get(img_id, [])
        dst_lbl.write_text("\n".join(lines) + ("\n" if lines else ""))
        written += 1

    return written


def main(taco_dir: Path, out_dir: Path, seed: int) -> None:
    ann_path = taco_dir / "annotations.json"

    if not ann_path.exists():
        print(
            "\n❌  annotations.json not found.\n"
            "\nTo download the TACO dataset:\n"
            "  1. Clone the TACO repo: git clone https://github.com/pedropro/TACO.git\n"
            "  2. Install gdown: pip install gdown\n"
            "  3. From inside the TACO repo: python download.py\n"
            "     This downloads all images and creates annotations.json\n"
            "  4. Copy/move the folder so your layout is:\n"
            "       data/taco/annotations.json\n"
            "       data/taco/<batch_1>/...jpg\n"
            f"\nExpected path: {ann_path.resolve()}\n"
        )
        sys.exit(1)

    log.info("Loading annotations from %s", ann_path)
    with ann_path.open(encoding="utf-8") as f:
        coco = json.load(f)

    # ── Build lookup tables ────────────────────────────────────────────────────

    # image_id → {file_name, width, height}
    image_meta: dict[int, dict] = {
        img["id"]: img for img in coco["images"]
    }

    # TACO category_id → our YOLO class index (via name matching)
    cat_id_to_class: dict[int, int] = {}
    unknown_cats: list[str] = []
    for cat in coco["categories"]:
        name = cat["name"]
        if name in NAME_TO_IDX:
            cat_id_to_class[cat["id"]] = NAME_TO_IDX[name]
        else:
            unknown_cats.append(name)

    if unknown_cats:
        log.warning(
            "These TACO categories have no matching YOLO class and will be skipped: %s",
            unknown_cats,
        )

    # ── Convert annotations to YOLO format ───────────────────────────────────

    # image_id → list of YOLO label lines
    yolo_labels: dict[int, list[str]] = defaultdict(list)
    # image_id → Counter of class appearances (for stratification)
    img_class_counts: dict[int, Counter] = defaultdict(Counter)

    skipped_missing_cat = 0
    skipped_bad_bbox = 0

    for ann in coco["annotations"]:
        img_id = ann["image_id"]
        cat_id = ann["category_id"]

        if cat_id not in cat_id_to_class:
            skipped_missing_cat += 1
            continue

        cls_idx = cat_id_to_class[cat_id]
        meta = image_meta.get(img_id)
        if meta is None:
            continue

        img_w = meta.get("width", 0)
        img_h = meta.get("height", 0)
        if img_w == 0 or img_h == 0:
            log.warning("Image %d has zero dimensions, skipping annotation.", img_id)
            continue

        x, y, w, h = ann["bbox"]
        result = coco_bbox_to_yolo(x, y, w, h, img_w, img_h)
        if result is None:
            log.warning(
                "Degenerate bbox [%.1f, %.1f, %.1f, %.1f] on image %d — skipped.",
                x, y, w, h, img_id,
            )
            skipped_bad_bbox += 1
            continue

        x_c, y_c, w_n, h_n = result
        yolo_labels[img_id].append(
            f"{cls_idx} {x_c:.6f} {y_c:.6f} {w_n:.6f} {h_n:.6f}"
        )
        img_class_counts[img_id][cls_idx] += 1

    log.info("Skipped %d annotations with unknown categories.", skipped_missing_cat)
    log.info("Skipped %d annotations with degenerate bounding boxes.", skipped_bad_bbox)

    # Only keep images that have at least one valid annotation
    annotated_ids = [img_id for img_id in yolo_labels if yolo_labels[img_id]]
    log.info("%d images have valid annotations.", len(annotated_ids))

    if not annotated_ids:
        print("❌  No annotated images found. Check that annotations.json is the TACO file.")
        sys.exit(1)

    # ── Stratified split ──────────────────────────────────────────────────────

    # Primary class = most common class in that image
    primary_class: dict[int, int] = {
        img_id: counts.most_common(1)[0][0]
        for img_id, counts in img_class_counts.items()
    }

    train_ids, val_ids, test_ids = stratified_split(
        annotated_ids, primary_class, seed=seed
    )

    log.info(
        "Split → train: %d | val: %d | test: %d",
        len(train_ids), len(val_ids), len(test_ids),
    )

    # ── Write splits ──────────────────────────────────────────────────────────

    out_dir.mkdir(parents=True, exist_ok=True)

    n_train = write_split("train", train_ids, image_meta, yolo_labels, taco_dir, out_dir)
    n_val   = write_split("val",   val_ids,   image_meta, yolo_labels, taco_dir, out_dir)
    n_test  = write_split("test",  test_ids,  image_meta, yolo_labels, taco_dir, out_dir)

    # ── Summary ───────────────────────────────────────────────────────────────

    all_class_counts: Counter = Counter()
    for counts in img_class_counts.values():
        all_class_counts.update(counts)

    classes_found = len(all_class_counts)
    rare = [
        YOLO_CLASS_NAMES[cls_idx]
        for cls_idx, count in all_class_counts.items()
        if count < 10
    ]

    print("\n" + "═" * 60)
    print("  Preprocessing complete")
    print("═" * 60)
    print(f"  Total images processed : {n_train + n_val + n_test}")
    print(f"  Train                  : {n_train} images")
    print(f"  Val                    : {n_val} images")
    print(f"  Test                   : {n_test} images")
    print(f"  Classes found          : {classes_found} / 60")
    if rare:
        print(f"  Classes with <10 samples: {rare}")
    else:
        print("  All classes have ≥10 samples ✓")
    print(f"\n  Output written to: {out_dir.resolve()}")
    print("═" * 60 + "\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Convert TACO COCO annotations to YOLO format and split dataset."
    )
    parser.add_argument(
        "--taco-dir",
        type=Path,
        default=Path("data/taco"),
        help="Directory containing TACO annotations.json and image folders (default: data/taco)",
    )
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=Path("data/processed"),
        help="Output directory for YOLO-format splits (default: data/processed)",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed for reproducible splits (default: 42)",
    )
    args = parser.parse_args()
    main(args.taco_dir, args.out_dir, args.seed)
