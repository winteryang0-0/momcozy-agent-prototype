"""Derive the eye-free head surface used only during intermediate fold frames.

The character is a static concept image, not a recovered 3D model.  This
script keeps the source PNG's canvas, alpha, silhouette, and every pixel below
row 299.  Only two small face regions are reconstructed from nearby pixels of
the same ivory material.  The original PNG remains the final animation frame.
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "assets" / "folded-hero-original-pixels.png"
OUTPUT = ROOT / "assets" / "folded-head-shell.png"
QA = ROOT / "reviews" / "frames" / "head-shell-comparison.png"

# center x/y, horizontal/vertical radii, donor x offset.  The ellipses include
# both the maroon pupils and their soft shadows, plus a few clean edge pixels.
EYES = (
    (382.5, 155.5, 20.5, 24.5, 43),
    (474.0, 166.5, 18.5, 23.5, -39),
)


def reconstruct_eye(out: np.ndarray, original: np.ndarray, eye: tuple) -> None:
    cx, cy, rx, ry, donor_dx = eye
    x0, x1 = int(cx - rx - 3), int(cx + rx + 4)
    y0, y1 = int(cy - ry - 3), int(cy + ry + 4)
    yy, xx = np.mgrid[y0:y1, x0:x1]
    radius = np.sqrt(((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2)
    mask = radius <= 1.0

    # Harmonic interpolation reproduces the existing material's gradual
    # lighting from the clean ring around the eye.  Boundary pixels stay exact.
    tile = original[y0:y1, x0:x1, :3].astype(np.float32)
    fill = tile.copy()
    for _ in range(1800):
        average = (
            np.roll(fill, 1, 0)
            + np.roll(fill, -1, 0)
            + np.roll(fill, 1, 1)
            + np.roll(fill, -1, 1)
        ) * 0.25
        fill[mask] = average[mask]

    # Restore restrained fine variation sampled from adjacent, unpainted
    # ivory surface.  Taper this variation at the mask boundary to avoid seams.
    donor = original[y0:y1, x0 + donor_dx:x1 + donor_dx, :3]
    low = np.asarray(Image.fromarray(donor).filter(ImageFilter.GaussianBlur(4.0)))
    detail = donor.astype(np.float32) - low.astype(np.float32)
    detail_weight = np.clip((1.0 - radius) * 9.0, 0.0, 1.0)[..., None]
    fill += 0.7 * detail * detail_weight
    result = out[y0:y1, x0:x1, :3]
    result[mask] = np.clip(np.rint(fill[mask]), 0, 255).astype(np.uint8)


def composite_head(image: Image.Image, color: tuple) -> Image.Image:
    head = image.crop((320, 115, 515, 205)).resize((780, 360), Image.Resampling.LANCZOS)
    matte = Image.new("RGBA", head.size, color)
    matte.alpha_composite(head)
    return matte.convert("RGB")


def main() -> None:
    source_image = Image.open(SOURCE).convert("RGBA")
    source = np.asarray(source_image)
    result = source.copy()
    for eye in EYES:
        reconstruct_eye(result, source, eye)
    if not np.array_equal(result[300:], source[300:]):
        raise AssertionError("Rows at and below 300 must be unchanged")
    if not np.array_equal(result[:, :, 3], source[:, :, 3]):
        raise AssertionError("Alpha silhouette must be unchanged")
    for label, (x0, y0, x1, y1) in {
        "left": (365, 130, 403, 181),
        "right": (458, 141, 493, 191),
    }.items():
        before = source[y0:y1, x0:x1, :3]
        after = result[y0:y1, x0:x1, :3]
        dark_before = int(np.count_nonzero(np.max(before, axis=2) < 200))
        dark_after = int(np.count_nonzero(np.max(after, axis=2) < 200))
        print(f"{label}: dark pixels {dark_before} -> {dark_after}")
    Image.fromarray(result, "RGBA").save(OUTPUT, optimize=True)

    # Side-by-side checks against two animation panel backgrounds.
    from PIL import ImageDraw

    fixed = Image.fromarray(result, "RGBA")
    qa = Image.new("RGB", (1560, 780), "#f7f3ed")
    for row, bg in enumerate(((247, 243, 237, 255), (37, 31, 34, 255))):
        qa.paste(composite_head(source_image, bg), (0, row * 390))
        qa.paste(composite_head(fixed, bg), (780, row * 390))
    draw = ImageDraw.Draw(qa)
    draw.text((12, 6), "original", fill="#59434a")
    draw.text((792, 6), "eye-free intermediate", fill="#59434a")
    QA.parent.mkdir(parents=True, exist_ok=True)
    qa.save(QA, optimize=True)
    print(f"Wrote {OUTPUT} and {QA}")


if __name__ == "__main__":
    main()
