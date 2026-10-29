"""Generate raster app icons from the same visual language as assets/icon.svg."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets"
S = 1024
paper = (243, 238, 228, 255)
ink = (32, 42, 36, 255)
red = (198, 92, 66, 255)
light = (243, 238, 228, 255)

img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(img)
d.rounded_rectangle((0, 0, S, S), radius=208, fill=paper)
d.ellipse((148, 148, S - 148, S - 148), fill=ink)
d.ellipse((198, 198, S - 198, S - 198), outline=(243, 238, 228, 90), width=4)
d.rounded_rectangle((308, 298, 716, 726), radius=28, outline=red, width=18)
d.rounded_rectangle((340, 330, 684, 694), radius=14, outline=(198, 92, 66, 160), width=5)

font_path = "C:/Windows/Fonts/simsun.ttc"
font = ImageFont.truetype(font_path, 264)
bbox = d.textbbox((0, 0), "岸", font=font)
w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
d.text(((S - w) / 2 - bbox[0], 506 - h / 2 - bbox[1]), "岸", font=font, fill=red)

try:
    latin = ImageFont.truetype("C:/Windows/Fonts/georgia.ttf", 46)
except OSError:
    latin = ImageFont.load_default()
label = "YANTU"
bbox = d.textbbox((0, 0), label, font=latin)
w = bbox[2] - bbox[0]
# Manual letter spacing
x = (S - (w + 8 * 9)) / 2
for ch in label:
    d.text((x, 812), ch, font=latin, fill=light)
    x += d.textbbox((0, 0), ch, font=latin)[2] + 9

for size, name in [(192, "icon-192.png"), (512, "icon-512.png"), (180, "icon-180.png")]:
    img.resize((size, size), Image.Resampling.LANCZOS).save(OUT / name, optimize=True)

# Maskable version keeps the seal inside the safe zone.
mask = Image.new("RGBA", (S, S), ink)
mask.paste(img.resize((820, 820), Image.Resampling.LANCZOS), (102, 102))
mask.save(OUT / "icon-maskable-512.png", optimize=True)
print("icons written")
