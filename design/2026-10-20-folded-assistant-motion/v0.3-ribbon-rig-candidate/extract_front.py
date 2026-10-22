"""Isolate the front view from the original concept board.

The RGB channels are copied directly from the source. Only the alpha channel
is hand masked around the outer silhouette. This is a 2D view, not a mesh.
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parent
SOURCE = ROOT.parent.parent / "2026-10-19-ai-characters" / "folded-assistant-v0.1.png"
OUTPUT = ROOT / "assets" / "folded-front-original-pixels.png"

# Front figure in original board coordinates, excluding its ground shadow.
BOX = (1080, 70, 1410, 455)

# Coordinates are measured from an inspection crop at (1010, 55). The polygon
# follows the outside edge, including both folded wings; the face and interior
# material are untouched source pixels.
OUTLINE = [
    (216, 24), (243, 25), (269, 33), (293, 47), (310, 68),
    (320, 90), (324, 115), (320, 138), (306, 156), (318, 165),
    (331, 178), (340, 203), (344, 231), (360, 247), (376, 268),
    (385, 291), (388, 307), (383, 319), (373, 327), (359, 327),
    (349, 322), (341, 311), (348, 336), (343, 357), (327, 375),
    (305, 382), (274, 386), (229, 389), (185, 388), (155, 383),
    (136, 373), (125, 357), (121, 341), (124, 318), (115, 327),
    (100, 328), (91, 320), (87, 305), (89, 280), (94, 256),
    (107, 232), (127, 208), (151, 185), (158, 169), (153, 160),
    (142, 147), (135, 130), (130, 111), (132, 90), (140, 72),
    (151, 55), (171, 40), (192, 30),
]


def main() -> None:
    source = Image.open(SOURCE).convert("RGB")
    crop = source.crop(BOX)
    mask = Image.new("L", crop.size, 0)
    draw = ImageDraw.Draw(mask)
    inspection_x, inspection_y = 1010, 55
    points = [(x + inspection_x - BOX[0], y + inspection_y - BOX[1]) for x, y in OUTLINE]
    draw.polygon(points, fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(1.8))

    rgb = np.asarray(crop)
    alpha = np.asarray(mask)
    rgba = np.dstack([rgb, alpha]).astype("uint8")
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(rgba, "RGBA").save(OUTPUT, optimize=True)
    assert np.array_equal(rgba[:, :, :3], rgb)
    print(f"{OUTPUT} {crop.width}x{crop.height}; RGB identical to source crop")


if __name__ == "__main__":
    main()
