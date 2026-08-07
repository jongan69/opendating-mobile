#!/usr/bin/env python3

from pathlib import Path
import subprocess

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]

OUTPUTS = [
    ("icon", 1024, 1024, "src/assets/icon.png"),
    ("adaptive", 1024, 1024, "src/assets/adaptive-icon.png"),
    ("adaptive", 1024, 1024, "src/assets/images/adaptive-icon.png"),
    ("favicon", 96, 96, "src/assets/favicon.png"),
    ("splash", 1284, 2778, "src/assets/splash.png"),
]

VISUAL_OUTPUTS = [
    ("welcome", 933, 1400, "src/assets/img/welcome.jpg"),
    ("onboarding", 856, 1330, "src/assets/img/onboarding.png"),
    ("nutrition", 898, 1346, "src/assets/img/onboarding-1.jpg"),
    ("training", 898, 1346, "src/assets/img/onboarding-2.jpg"),
    ("sync", 856, 366, "src/assets/img/onboarding-3.png"),
    ("dashboard", 856, 366, "src/assets/img/banner.png"),
    ("muscles", 950, 634, "src/assets/img/muscles.png"),
    ("progress", 508, 508, "src/assets/img/progress.png"),
    ("support", 1280, 897, "src/assets/img/service-1.jpg"),
    ("subscription", 869, 541, "src/assets/img/subscription-banner.jpg"),
    ("wallpaper", 885, 1341, "src/assets/img/wallpaper-3.jpg"),
    ("wallpaper-webp", 1024, 1536, "src/assets/img/wallpaper.webp"),
]

THEME = {
    "ink": (5, 18, 22),
    "deep": (7, 35, 37),
    "panel": (14, 45, 47),
    "mint": (53, 241, 207),
    "green": (113, 239, 132),
    "blue": (66, 135, 255),
    "paper": (235, 255, 250),
    "muted": (143, 183, 179),
}


def font(size, bold=True):
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/SFNS.ttf",
        "/Library/Fonts/Arial Bold.ttf" if bold else "/Library/Fonts/Arial.ttf",
    ]

    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size)
        except OSError:
            continue

    return ImageFont.load_default(size=size)


def gradient_background(size):
    width, height = size
    image = Image.new("RGBA", (1, height))
    pixels = image.load()

    top = (6, 18, 21)
    mid = (9, 36, 37)
    bottom = (6, 16, 22)

    for y in range(height):
        t = y / max(1, height - 1)
        if t < 0.55:
            local = t / 0.55
            color = tuple(round(top[i] * (1 - local) + mid[i] * local) for i in range(3))
        else:
            local = (t - 0.55) / 0.45
            color = tuple(round(mid[i] * (1 - local) + bottom[i] * local) for i in range(3))

        pixels[0, y] = (*color, 255)

    return image.resize((width, height), Image.Resampling.BICUBIC)


def add_glow(base, center, radius, color, alpha=135):
    glow = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(glow)
    x, y = center
    draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=(*color, alpha))
    glow = glow.filter(ImageFilter.GaussianBlur(radius // 3))
    base.alpha_composite(glow)


def rounded_panel(draw, box, radius, fill=None, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def text_center(draw, text, center_x, y, size, fill, bold=True):
    text_font = font(size, bold=bold)
    bbox = draw.textbbox((0, 0), text, font=text_font)
    draw.text((center_x - (bbox[2] - bbox[0]) / 2, y), text, font=text_font, fill=fill)


def draw_mini_mark(size=180):
    return draw_mark(size, include_background=False, transparent=True)


def arc(draw, box, start, end, fill, width):
    draw.arc(box, start=start, end=end, fill=fill, width=width)


def line_with_shadow(draw, points, fill, width, shadow_fill=(4, 12, 14, 180)):
    shadow_points = [(x + width * 0.1, y + width * 0.1) for x, y in points]
    draw.line(shadow_points, fill=shadow_fill, width=max(1, int(width * 1.1)), joint="curve")
    draw.line(points, fill=fill, width=width, joint="curve")


def draw_mark(size=1024, include_background=True, transparent=False, include_wordmark=False):
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    scale = size / 1024

    def s(value):
        return int(round(value * scale))

    if include_background:
        bg = gradient_background((size, size))
        mask = Image.new("L", (size, size), 0)
        mask_draw = ImageDraw.Draw(mask)
        mask_draw.rounded_rectangle((0, 0, size, size), radius=s(232), fill=255)
        image.alpha_composite(Image.composite(bg, Image.new("RGBA", (size, size), (0, 0, 0, 0)), mask))
    elif not transparent:
        image.alpha_composite(gradient_background((size, size)))

    add_glow(image, (s(410), s(350)), s(330), THEME["mint"], 92)
    add_glow(image, (s(725), s(730)), s(280), THEME["blue"], 72)
    draw = ImageDraw.Draw(image)

    # Brand mark: a local wellness compass combining food, recovery, and AI nodes.
    plate = (s(178), s(198), s(846), s(866))
    draw.ellipse(plate, fill=(8, 29, 31, 246), outline=(35, 88, 88, 255), width=s(3))
    draw.arc(plate, start=206, end=334, fill=(52, 235, 204, 255), width=s(26))
    draw.arc(plate, start=26, end=136, fill=(111, 239, 132, 255), width=s(26))
    draw.arc((s(222), s(242), s(802), s(822)), start=154, end=394, fill=(66, 135, 255, 230), width=s(10))

    tile_shadow = Image.new("RGBA", image.size, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(tile_shadow)
    shadow_draw.rounded_rectangle((s(294), s(286), s(746), s(738)), radius=s(136), fill=(0, 0, 0, 95))
    tile_shadow = tile_shadow.filter(ImageFilter.GaussianBlur(s(18)))
    image.alpha_composite(tile_shadow)
    draw = ImageDraw.Draw(image)

    tile = (s(278), s(270), s(730), s(722))
    draw.rounded_rectangle(tile, radius=s(132), fill=(10, 39, 40, 248), outline=(226, 255, 239, 235), width=s(6))

    bowl = (s(350), s(526), s(660), s(650))
    draw.arc(bowl, start=0, end=180, fill=(235, 255, 249, 255), width=s(24))
    draw.line((s(372), s(590), s(638), s(590)), fill=(235, 255, 249, 255), width=s(22))

    pulse = [(326, 484), (408, 484), (448, 414), (504, 566), (564, 354), (608, 484), (698, 484)]
    pulse = [(s(x), s(y)) for x, y in pulse]
    line_with_shadow(draw, pulse, (220, 255, 236, 255), s(25))
    draw.line(pulse, fill=(115, 240, 125, 255), width=s(12), joint="curve")

    leaf_layer = Image.new("RGBA", image.size, (0, 0, 0, 0))
    leaf_draw = ImageDraw.Draw(leaf_layer)
    leaf_draw.ellipse((s(454), s(312), s(590), s(496)), fill=(55, 237, 205, 255))
    leaf_draw.line((s(515), s(470), s(565), s(338)), fill=(8, 35, 36, 210), width=s(9))
    leaf_layer = leaf_layer.rotate(-28, center=(s(522), s(404)), resample=Image.Resampling.BICUBIC)
    image.alpha_composite(leaf_layer)
    draw = ImageDraw.Draw(image)

    node_specs = [
        (278, 420, 18, THEME["green"]),
        (746, 540, 18, THEME["blue"]),
        (660, 302, 13, THEME["mint"]),
    ]
    for x, y, radius, color in node_specs:
        draw.ellipse((s(x - radius), s(y - radius), s(x + radius), s(y + radius)), fill=(*color, 255))

    sparkle = [(690, 392), (708, 430), (746, 448), (708, 466), (690, 504), (672, 466), (634, 448), (672, 430)]
    draw.polygon([(s(x), s(y)) for x, y in sparkle], fill=(235, 255, 249, 255))
    draw.polygon(
        [(s(x), s(y)) for x, y in [(690, 418), (704, 446), (690, 474), (676, 446)]],
        fill=(53, 241, 207, 255),
    )

    if include_wordmark:
        title_font = font(s(124), bold=True)
        caption_font = font(s(36), bold=True)
        for text, y, text_font, fill in [
            ("PrepAI", 824, title_font, (233, 255, 251, 255)),
            ("LOCAL HEALTH INTELLIGENCE", 884, caption_font, (143, 183, 179, 255)),
        ]:
            bbox = draw.textbbox((0, 0), text, font=text_font)
            draw.text((s(512) - (bbox[2] - bbox[0]) / 2, s(y)), text, font=text_font, fill=fill)

    return image


def draw_splash(width, height):
    image = gradient_background((width, height))
    add_glow(image, (width // 2, int(height * 0.37)), 420, (31, 211, 194), 90)

    mark_size = 540
    mark = draw_mark(1024, include_background=False, transparent=True)
    mark = mark.resize((mark_size, mark_size), Image.Resampling.LANCZOS)
    mark_top = int(height * 0.32) - mark_size // 2
    image.alpha_composite(mark, (width // 2 - mark_size // 2, mark_top))

    draw = ImageDraw.Draw(image)
    title_font = font(140, bold=True)
    caption_font = font(38, bold=True)
    title = "PrepAI"
    caption = "LOCAL HEALTH INTELLIGENCE"
    title_bbox = draw.textbbox((0, 0), title, font=title_font)
    caption_bbox = draw.textbbox((0, 0), caption, font=caption_font)
    title_y = mark_top + mark_size + 60
    caption_y = title_y + 138
    draw.text((width / 2 - (title_bbox[2] - title_bbox[0]) / 2, title_y), title, font=title_font, fill=(233, 255, 251, 255))
    draw.text(
        (width / 2 - (caption_bbox[2] - caption_bbox[0]) / 2, caption_y),
        caption,
        font=caption_font,
        fill=(143, 183, 179, 255),
    )
    return image


def draw_metric_card(draw, x, y, w, h, title, value, accent, radius=32):
    rounded_panel(draw, (x, y, x + w, y + h), radius, fill=(11, 37, 39, 235), outline=accent, width=2)
    pad = max(14, int(min(w, h) * 0.14))
    title_size = max(14, min(24, int(h * 0.16)))
    value_size = max(24, min(58, int(h * 0.34)))
    draw.text((x + pad, y + pad), title, font=font(title_size, bold=True), fill=THEME["muted"])
    draw.text((x + pad, y + pad + title_size + 8), value, font=font(value_size, bold=True), fill=THEME["paper"])
    bar_top = y + h - pad - 14
    draw.rounded_rectangle((x + pad, bar_top, x + w - pad, bar_top + 14), radius=7, fill=(23, 59, 61, 255))
    draw.rounded_rectangle((x + pad, bar_top, x + int(w * 0.7), bar_top + 14), radius=7, fill=accent)


def draw_banner_metric(draw, x, y, w, title, value, accent):
    draw.text((x, y), title, font=font(26, bold=True), fill=THEME["muted"])
    draw.text((x, y + 42), value, font=font(62, bold=True), fill=THEME["paper"])
    draw.rounded_rectangle((x, y + 126, x + w, y + 144), radius=9, fill=(23, 59, 61, 255))
    draw.rounded_rectangle((x, y + 126, x + int(w * 0.72), y + 144), radius=9, fill=accent)


def draw_line_chart(draw, box, color):
    x1, y1, x2, y2 = box
    width = x2 - x1
    height = y2 - y1
    points = [
        (x1, y1 + int(height * 0.7)),
        (x1 + int(width * 0.2), y1 + int(height * 0.58)),
        (x1 + int(width * 0.38), y1 + int(height * 0.62)),
        (x1 + int(width * 0.55), y1 + int(height * 0.35)),
        (x1 + int(width * 0.74), y1 + int(height * 0.42)),
        (x2, y1 + int(height * 0.18)),
    ]
    draw.line(points, fill=(8, 16, 18, 180), width=12, joint="curve")
    draw.line(points, fill=color, width=7, joint="curve")
    for x, y in points:
      draw.ellipse((x - 8, y - 8, x + 8, y + 8), fill=THEME["paper"], outline=color, width=4)


def draw_bar_chart(draw, x, y, w, h, color):
    values = [0.34, 0.62, 0.48, 0.78, 0.54, 0.9, 0.7]
    gap = w * 0.035
    bar_w = (w - gap * (len(values) - 1)) / len(values)
    for index, value in enumerate(values):
        left = x + int(index * (bar_w + gap))
        top = y + int(h * (1 - value))
        right = int(left + bar_w)
        draw.rounded_rectangle((left, top, right, y + h), radius=12, fill=color if index != 5 else THEME["green"])


def draw_plate(draw, cx, cy, r):
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(237, 255, 250, 255))
    draw.ellipse((cx - int(r * 0.72), cy - int(r * 0.72), cx + int(r * 0.72), cy + int(r * 0.72)), fill=(17, 54, 55, 255))
    colors = [THEME["green"], THEME["mint"], THEME["blue"], (255, 218, 102)]
    wedges = [(210, 330), (330, 32), (32, 114), (114, 210)]
    for color, (start, end) in zip(colors, wedges):
        draw.pieslice((cx - int(r * 0.62), cy - int(r * 0.62), cx + int(r * 0.62), cy + int(r * 0.62)), start, end, fill=color)


def draw_dumbbell(draw, cx, cy, scale=1.0, color=None):
    color = color or THEME["paper"]
    s = scale
    draw.rounded_rectangle((cx - 118 * s, cy - 16 * s, cx + 118 * s, cy + 16 * s), radius=int(10 * s), fill=color)
    for side in [-1, 1]:
        draw.rounded_rectangle((cx + side * 86 * s - 24 * s, cy - 58 * s, cx + side * 86 * s + 24 * s, cy + 58 * s), radius=int(12 * s), fill=THEME["mint"])
        draw.rounded_rectangle((cx + side * 126 * s - 30 * s, cy - 78 * s, cx + side * 126 * s + 30 * s, cy + 78 * s), radius=int(12 * s), fill=color)


def draw_visual(kind, width, height):
    image = gradient_background((width, height))
    add_glow(image, (int(width * 0.55), int(height * 0.35)), int(min(width, height) * 0.42), THEME["mint"], 80)
    draw = ImageDraw.Draw(image)

    margin = max(32, int(width * 0.065))
    if height >= 900:
        mark = draw_mini_mark(max(120, int(min(width, height) * 0.18)))
        image.alpha_composite(mark, (margin, margin))

    if kind in {"welcome", "onboarding", "wallpaper", "wallpaper-webp"}:
        text_center(draw, "PrepAI", width // 2, int(height * 0.16), int(width * 0.14), THEME["paper"])
        text_center(draw, "Local health intelligence", width // 2, int(height * 0.16) + int(width * 0.13), int(width * 0.037), THEME["muted"])
        card_w = int(width * 0.82)
        card_h = int(height * 0.38)
        x = (width - card_w) // 2
        y = int(height * 0.42)
        rounded_panel(draw, (x, y, x + card_w, y + card_h), 42, fill=(12, 43, 45, 232), outline=THEME["mint"], width=3)
        draw_metric_card(draw, x + 36, y + 42, int(card_w * 0.42), int(card_h * 0.35), "Recovery", "82", THEME["green"])
        draw_metric_card(draw, x + int(card_w * 0.52), y + 42, int(card_w * 0.4), int(card_h * 0.35), "Hydration", "2.4L", THEME["blue"])
        draw_line_chart(draw, (x + 52, y + int(card_h * 0.55), x + card_w - 52, y + card_h - 54), THEME["mint"])
        return image

    if kind in {"nutrition", "dashboard"}:
        if height <= 600:
            draw_plate(draw, int(width * 0.74), int(height * 0.42), int(height * 0.2))
            draw_banner_metric(draw, margin, int(height * 0.28), int(width * 0.46), "Today's Fuel", "1,842 cal", THEME["green"])
            draw.text(
                (margin, int(height * 0.78)),
                "Nutrition that stays on your device",
                font=font(int(width * 0.038), bold=True),
                fill=THEME["paper"],
            )
            return image

        draw_plate(draw, int(width * 0.5), int(height * 0.38), int(min(width, height) * 0.2))
        draw_metric_card(draw, margin, int(height * 0.62), width - margin * 2, int(height * 0.19), "Today's Fuel", "1,842 cal", THEME["green"])
        text_center(draw, "Nutrition that stays on your device", width // 2, int(height * 0.86), int(width * 0.042), THEME["paper"])
        return image

    if kind in {"training", "muscles"}:
        if height <= 700:
            draw_dumbbell(draw, int(width * 0.72), int(height * 0.34), min(width, height) / 760)
            draw_banner_metric(draw, margin, int(height * 0.34), int(width * 0.48), "Training Load", "45 min", THEME["blue"])
            draw.text(
                (margin, int(height * 0.8)),
                "Track sessions, sets, and recovery",
                font=font(int(width * 0.04), bold=True),
                fill=THEME["paper"],
            )
            return image

        draw_dumbbell(draw, int(width * 0.5), int(height * 0.38), min(width, height) / 650)
        draw_metric_card(draw, margin, int(height * 0.62), width - margin * 2, int(height * 0.2), "Training Load", "45 min", THEME["blue"])
        text_center(draw, "Track sessions, sets, and recovery", width // 2, int(height * 0.86), int(width * 0.04), THEME["paper"])
        return image

    if kind in {"sync", "health"}:
        rounded_panel(draw, (margin, int(height * 0.22), width - margin, int(height * 0.76)), 36, fill=(12, 43, 45, 232), outline=THEME["mint"], width=3)
        draw_line_chart(draw, (margin + 48, int(height * 0.35), width - margin - 48, int(height * 0.62)), THEME["green"])
        text_center(draw, "Apple Health sync", width // 2, int(height * 0.72), int(width * 0.05), THEME["paper"])
        return image

    if kind in {"recovery", "progress"}:
        cx, cy = width // 2, height // 2
        r = int(min(width, height) * 0.32)
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), outline=(31, 79, 80, 255), width=max(10, width // 42))
        draw.arc((cx - r, cy - r, cx + r, cy + r), start=128, end=394, fill=THEME["green"], width=max(14, width // 32))
        text_center(draw, "82", cx, cy - int(r * 0.38), int(min(width, height) * 0.24), THEME["paper"])
        text_center(draw, "READINESS", cx, cy + int(r * 0.32), int(min(width, height) * 0.05), THEME["muted"])
        return image

    if kind in {"support", "subscription"}:
        rounded_panel(draw, (margin, int(height * 0.23), width - margin, int(height * 0.75)), 38, fill=(12, 43, 45, 232), outline=THEME["mint"], width=3)
        draw_bar_chart(draw, margin + 58, int(height * 0.42), width - margin * 2 - 116, int(height * 0.19), THEME["blue"])
        text_center(draw, "Private health command center", width // 2, int(height * 0.28), int(width * 0.052), THEME["paper"])
        text_center(draw, "Nutrition • Training • Recovery", width // 2, int(height * 0.68), int(width * 0.032), THEME["muted"])
        return image

    return image


def save_asset(kind, width, height, output):
    if kind == "splash":
        image = draw_splash(width, height)
    elif kind == "adaptive":
        image = draw_mark(width, include_background=False, transparent=True)
    elif kind == "favicon":
        image = draw_mark(1024, include_background=True).resize((width, height), Image.Resampling.LANCZOS)
    else:
        image = draw_mark(width, include_background=True)

    destination = ROOT / output
    destination.parent.mkdir(parents=True, exist_ok=True)
    image.save(destination, "PNG", optimize=True)


for output in OUTPUTS:
    save_asset(*output)

for kind, width, height, output in VISUAL_OUTPUTS:
    image = draw_visual(kind, width, height)
    destination = ROOT / output
    destination.parent.mkdir(parents=True, exist_ok=True)
    extension = destination.suffix.lower()
    if extension in {".jpg", ".jpeg"}:
        image.convert("RGB").save(destination, "JPEG", quality=88, optimize=True, progressive=True)
    elif extension == ".webp":
        temp_png = destination.with_suffix(".webp-source.png")
        image.convert("RGB").save(temp_png, "PNG", optimize=True)
        try:
            subprocess.run(
                ["cwebp", "-quiet", "-q", "86", str(temp_png), "-o", str(destination)],
                check=True,
            )
        finally:
            temp_png.unlink(missing_ok=True)
    else:
        image.save(destination, "PNG", optimize=True)

print(f"Generated {len(OUTPUTS) + len(VISUAL_OUTPUTS)} PrepAI brand assets.")
