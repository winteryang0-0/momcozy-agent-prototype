"""Extract the original 02 hero pixels without redrawing the character.

The alpha mask follows only the outer silhouette; interior ivory and burgundy
pixels are copied directly from the source concept PNG. The source itself is
included unchanged for visual comparison.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT.parent.parent / "2026-10-19-ai-characters" / "folded-assistant-v0.1.png"
OUTPUT = ROOT / "assets" / "folded-hero-original-pixels.png"

# Crop excludes title, footer caption, and the two secondary views.
BOX = (260, 75, 970, 905)

# Polygon deliberately sits inside the pale silhouette boundary. A narrow
# antialiased edge blends into the preview background; the body's visible
# material pixels remain copied from the source image.
SILHOUETTE = [
    (589, 86), (649, 91), (704, 111), (744, 143), (777, 187), (792, 232),
    (791, 281), (776, 333), (759, 362), (727, 381), (708, 397),
    (739, 425), (775, 452), (811, 486), (850, 521), (898, 538),
    (941, 538), (953, 550), (949, 577), (925, 613), (882, 649),
    (838, 663), (816, 659), (820, 709), (818, 761), (800, 817),
    (767, 846), (723, 862), (663, 868), (555, 870), (453, 869),
    (388, 861), (352, 835), (339, 797), (341, 746), (348, 701),
    (325, 703), (302, 691), (288, 664), (285, 624), (291, 580),
    (304, 541), (325, 501), (358, 459), (404, 424), (444, 398),
    (453, 383), (452, 361), (437, 332), (416, 299), (400, 262),
    (395, 222), (405, 183), (429, 146), (468, 116), (519, 97),
]


def main():
    original = Image.open(SOURCE).convert("RGB")
    crop = original.crop(BOX)
    width, height = crop.size
    polygon = [(x - BOX[0], y - BOX[1]) for x, y in SILHOUETTE]
    mask = Image.new("L", (width, height), 0)
    draw = ImageDraw.Draw(mask)
    draw.polygon(polygon, fill=255)
    # Feather only the cut edge. This does not recolor or repaint the source.
    mask = mask.filter(ImageFilter.GaussianBlur(2.3))

    # Use the source image's background color to avoid a dark fringe when
    # compositing. The original material's RGB values remain unmodified.
    rgb = np.asarray(crop)
    alpha = np.asarray(mask)
    rgba = np.dstack([rgb, alpha]).astype("uint8")
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(rgba, "RGBA").save(OUTPUT, optimize=True)
    visible = alpha >= 250
    exact = np.array_equal(rgba[:, :, :3][visible], rgb[visible])
    print(f"wrote {OUTPUT} ({width}x{height}); visible RGB pixels identical to source crop: {exact}")


if __name__ == "__main__":
    main()
