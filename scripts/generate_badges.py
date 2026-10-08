import math
import os
from PIL import Image, ImageDraw, ImageFilter

OUTPUT_DIR = "public/assets"
os.makedirs(OUTPUT_DIR, exist_ok=True)

SIZE = 320
CENTER = SIZE // 2
RADIUS = 120

def create_radial_gradient(size, inner_color, outer_color):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    center = size / 2.0
    max_dist = center * 0.8
    pixels = img.load()
    for y in range(size):
        for x in range(size):
            dx = x - center
            dy = y - center
            dist = math.hypot(dx, dy)
            t = min(max(dist / max_dist, 0.0), 1.0)
            t = t * t * (3 - 2 * t)
            r = int(inner_color[0] + (outer_color[0] - inner_color[0]) * t)
            g = int(inner_color[1] + (outer_color[1] - inner_color[1]) * t)
            b = int(inner_color[2] + (outer_color[2] - inner_color[2]) * t)
            a = int(inner_color[3] + (outer_color[3] - inner_color[3]) * t)
            pixels[x, y] = (r, g, b, a)
    return img

def draw_star(draw, cx, cy, r_outer, r_inner, points=5, fill=(255, 235, 120, 255), outline=None):
    angle_step = math.pi / points
    poly = []
    start_angle = -math.pi / 2
    for i in range(2 * points):
        r = r_outer if i % 2 == 0 else r_inner
        ang = start_angle + i * angle_step
        x = cx + r * math.cos(ang)
        y = cy + r * math.sin(ang)
        poly.append((x, y))
    draw.polygon(poly, fill=fill, outline=outline)

def draw_ribbon(img, color=(190, 40, 40, 255), border_color=(255, 220, 80, 255)):
    draw = ImageDraw.Draw(img)
    rx = CENTER
    ry = CENTER + RADIUS - 14
    rw = 100
    rh = 26
    
    # Shadow
    shadow_l = [(rx - rw - 14, ry + 12), (rx - rw + 15, ry - 6), (rx - rw + 15, ry + 22)]
    draw.polygon(shadow_l, fill=(30, 10, 10, 180))
    shadow_r = [(rx + rw + 14, ry + 12), (rx + rw - 15, ry - 6), (rx + rw - 15, ry + 22)]
    draw.polygon(shadow_r, fill=(30, 10, 10, 180))

    # Tails
    tail_l = [
        (rx - rw - 18, ry + 2),
        (rx - rw + 10, ry - 8),
        (rx - rw + 10, ry + 22),
        (rx - rw - 18, ry + 30),
        (rx - rw - 8, ry + 16)
    ]
    draw.polygon(tail_l, fill=(max(0, color[0]-40), max(0, color[1]-40), max(0, color[2]-40), 255), outline=border_color, width=2)

    tail_r = [
        (rx + rw + 18, ry + 2),
        (rx + rw - 10, ry - 8),
        (rx + rw - 10, ry + 22),
        (rx + rw + 18, ry + 30),
        (rx + rw + 8, ry + 16)
    ]
    draw.polygon(tail_r, fill=(max(0, color[0]-40), max(0, color[1]-40), max(0, color[2]-40), 255), outline=border_color, width=2)

    # Banner
    banner = [
        (rx - rw, ry - 8),
        (rx + rw, ry - 8),
        (rx + rw + 5, ry + 18),
        (rx - rw - 5, ry + 18)
    ]
    draw.polygon(banner, fill=color, outline=border_color, width=2)
    
    # 3 Gold stars
    draw_star(draw, rx - 35, ry + 5, 7, 3.5, fill=(255, 230, 80, 255))
    draw_star(draw, rx, ry + 5, 9, 4.5, fill=(255, 250, 150, 255))
    draw_star(draw, rx + 35, ry + 5, 7, 3.5, fill=(255, 230, 80, 255))

def create_base_medal(bg_inner, bg_outer):
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    
    # Shadow
    shadow_mask = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow_mask)
    s_draw.ellipse([CENTER - RADIUS - 4, CENTER - RADIUS + 10, CENTER + RADIUS + 4, CENTER + RADIUS + 24], fill=(0, 0, 0, 150))
    img.alpha_composite(shadow_mask.filter(ImageFilter.GaussianBlur(10)))
    
    draw = ImageDraw.Draw(img)
    gold_outer = (220, 170, 45, 255)
    gold_light = (255, 240, 130, 255)
    gold_dark  = (130, 85, 15, 255)
    gold_base  = (210, 155, 40, 255)
    
    draw.ellipse([CENTER - RADIUS, CENTER - RADIUS, CENTER + RADIUS, CENTER + RADIUS], fill=gold_base, outline=gold_dark, width=3)
    
    r_step = RADIUS - 7
    draw.ellipse([CENTER - r_step, CENTER - r_step, CENTER + r_step, CENTER + r_step], outline=gold_light, width=2)
    
    # Rivets
    for i in range(16):
        ang = i * (2 * math.pi / 16)
        sx = CENTER + (RADIUS - 13) * math.cos(ang)
        sy = CENTER + (RADIUS - 13) * math.sin(ang)
        draw.ellipse([sx - 3.5, sy - 3.5, sx + 3.5, sy + 3.5], fill=gold_light, outline=gold_dark, width=1)
        draw.point((sx - 1, sy - 1), fill=(255, 255, 255, 255))

    # Inner disc
    r_inner = RADIUS - 22
    mask = Image.new("L", (SIZE, SIZE), 0)
    m_draw = ImageDraw.Draw(mask)
    m_draw.ellipse([CENTER - r_inner, CENTER - r_inner, CENTER + r_inner, CENTER + r_inner], fill=255)
    
    grad = create_radial_gradient(SIZE, bg_inner, bg_outer)
    img.paste(grad, (0, 0), mask)
    
    draw = ImageDraw.Draw(img)
    draw.ellipse([CENTER - r_inner, CENTER - r_inner, CENTER + r_inner, CENTER + r_inner], outline=gold_dark, width=3)
    draw.ellipse([CENTER - r_inner + 2, CENTER - r_inner + 2, CENTER + r_inner - 2, CENTER + r_inner - 2], outline=(255, 220, 80, 200), width=1)
    
    return img

def apply_finish(img, ribbon_color=(180, 30, 30, 255)):
    r_inner = RADIUS - 22
    sheen = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(sheen)
    s_draw.chord([CENTER - r_inner + 5, CENTER - r_inner + 5, CENTER + r_inner - 5, CENTER + r_inner - 5],
                 start=195, end=345, fill=(255, 255, 255, 40))
    img.alpha_composite(sheen)
    
    draw_ribbon(img, color=ribbon_color)
    
    sparkle = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    sp_draw = ImageDraw.Draw(sparkle)
    sp_cx = CENTER - int(RADIUS * 0.58)
    sp_cy = CENTER - int(RADIUS * 0.58)
    draw_star(sp_draw, sp_cx, sp_cy, 13, 3, points=4, fill=(255, 255, 255, 240))
    draw_star(sp_draw, sp_cx, sp_cy, 6, 2, points=4, fill=(255, 255, 210, 255))
    img.alpha_composite(sparkle)
    return img

# --- SYMBOLS FOR EACH BADGE ---

def draw_stream(img):
    draw = ImageDraw.Draw(img)
    # 1. Shallows stream badge
    # River flow waves
    for yoff, col, w in [(-12, (200, 240, 255, 220), 8), (2, (255, 255, 255, 250), 10), (16, (140, 210, 255, 200), 7)]:
        pts = []
        for x in range(CENTER - 55, CENTER + 56, 4):
            dx = x - CENTER
            y = CENTER - 10 + yoff + 10 * math.sin(dx * 0.08)
            pts.append((x, y))
        draw.line(pts, fill=col, width=w, joint='curve')
    # Stones
    draw.ellipse([CENTER - 35, CENTER + 18, CENTER - 10, CENTER + 34], fill=(130, 140, 150, 255), outline=(230, 240, 250, 255), width=2)
    draw.ellipse([CENTER + 10, CENTER + 20, CENTER + 38, CENTER + 38], fill=(160, 170, 180, 255), outline=(240, 245, 250, 255), width=2)
    # Splash droplets
    draw.ellipse([CENTER - 15, CENTER - 32, CENTER - 7, CENTER - 24], fill=(220, 245, 255, 240))
    draw.ellipse([CENTER + 12, CENTER - 38, CENTER + 22, CENTER - 28], fill=(220, 245, 255, 240))

def draw_dam(img):
    draw = ImageDraw.Draw(img)
    # 2. Dam badge - Woven logs & branches
    # Horizontal logs
    logs = [
        (CENTER - 50, CENTER + 14, CENTER + 50, CENTER + 32, (150, 90, 45, 255)),
        (CENTER - 55, CENTER - 4, CENTER + 55, CENTER + 14, (170, 110, 60, 255)),
        (CENTER - 45, CENTER - 22, CENTER + 45, CENTER - 4, (190, 130, 75, 255)),
        (CENTER - 30, CENTER - 40, CENTER + 30, CENTER - 22, (210, 150, 90, 255)),
    ]
    for x1, y1, x2, y2, col in logs:
        draw.rounded_rectangle([x1, y1, x2, y2], radius=6, fill=col, outline=(255, 230, 140, 255), width=2)
        # Log rings
        draw.ellipse([x2 - 10, y1 + 2, x2 - 2, y2 - 2], outline=(100, 60, 30, 180), width=1)
    # Crossed stakes
    draw.line([(CENTER - 35, CENTER - 35), (CENTER + 35, CENTER + 30)], fill=(120, 70, 30, 255), width=6)
    draw.line([(CENTER + 35, CENTER - 35), (CENTER - 35, CENTER + 30)], fill=(120, 70, 30, 255), width=6)
    # Leaves
    draw.ellipse([CENTER + 25, CENTER - 42, CENTER + 45, CENTER - 26], fill=(100, 200, 60, 255), outline=(230, 255, 180, 255), width=1)
    draw.ellipse([CENTER - 45, CENTER - 42, CENTER - 25, CENTER - 26], fill=(100, 200, 60, 255), outline=(230, 255, 180, 255), width=1)

def draw_lodge(img):
    draw = ImageDraw.Draw(img)
    # 3. Lodge badge - Cozy beaver cabin
    # Chimney & Smoke
    draw.rectangle([CENTER + 20, CENTER - 48, CENTER + 32, CENTER - 25], fill=(160, 80, 50, 255), outline=(255, 220, 140, 255), width=2)
    # Smoke puffs
    draw.ellipse([CENTER + 24, CENTER - 60, CENTER + 34, CENTER - 50], fill=(240, 240, 240, 180))
    draw.ellipse([CENTER + 28, CENTER - 68, CENTER + 42, CENTER - 56], fill=(240, 240, 240, 140))
    # Log walls
    draw.rounded_rectangle([CENTER - 45, CENTER - 10, CENTER + 45, CENTER + 34], radius=6, fill=(160, 100, 55, 255), outline=(255, 220, 130, 255), width=3)
    for y in [CENTER + 2, CENTER + 14, CENTER + 26]:
        draw.line([(CENTER - 42, y), (CENTER + 42, y)], fill=(110, 65, 35, 220), width=2)
    # Triangle Roof
    roof = [(CENTER, CENTER - 44), (CENTER - 58, CENTER - 6), (CENTER + 58, CENTER - 6)]
    draw.polygon(roof, fill=(190, 65, 45, 255), outline=(255, 230, 150, 255), width=3)
    # Glowing window
    draw.rounded_rectangle([CENTER - 16, CENTER + 2, CENTER + 16, CENTER + 24], radius=4, fill=(255, 235, 100, 255), outline=(100, 60, 30, 255), width=2)
    draw.line([(CENTER, CENTER + 2), (CENTER, CENTER + 24)], fill=(100, 60, 30, 255), width=2)
    draw.line([(CENTER - 16, CENTER + 13), (CENTER + 16, CENTER + 13)], fill=(100, 60, 30, 255), width=2)

def draw_pier(img):
    draw = ImageDraw.Draw(img)
    # 4. Pier badge - Fishing dock & leaping fish
    # Water ripples
    for y in [CENTER + 15, CENTER + 28]:
        draw.line([(CENTER - 50, y), (CENTER + 50, y)], fill=(180, 230, 255, 180), width=3)
    # Wooden pier deck
    draw.polygon([(CENTER - 55, CENTER + 4), (CENTER - 5, CENTER - 12), (CENTER + 5, CENTER - 12), (CENTER - 40, CENTER + 18)], fill=(170, 110, 60, 255), outline=(255, 220, 130, 255))
    draw.line([(CENTER - 50, CENTER + 18), (CENTER - 50, CENTER + 36)], fill=(120, 75, 40, 255), width=5)
    draw.line([(CENTER - 25, CENTER + 10), (CENTER - 25, CENTER + 32)], fill=(120, 75, 40, 255), width=5)
    # Leaping Fish
    fish_body = [(CENTER + 5, CENTER - 5), (CENTER + 25, CENTER - 30), (CENTER + 42, CENTER - 22), (CENTER + 32, CENTER + 2)]
    draw.polygon(fish_body, fill=(220, 235, 245, 255), outline=(255, 215, 0, 255), width=2)
    # Tail fin
    draw.polygon([(CENTER + 38, CENTER - 24), (CENTER + 54, CENTER - 35), (CENTER + 48, CENTER - 15)], fill=(130, 200, 235, 255), outline=(255, 215, 0, 255))
    # Eye
    draw.ellipse([CENTER + 12, CENTER - 8, CENTER + 16, CENTER - 4], fill=(40, 40, 40, 255))
    # Fishing line arc
    draw.arc([CENTER - 30, CENTER - 48, CENTER + 30, CENTER + 2], start=180, end=330, fill=(255, 255, 255, 220), width=2)

def draw_watermill(img):
    draw = ImageDraw.Draw(img)
    # 5. Watermill badge - 8-spoke water wheel
    # Outer rim
    draw.ellipse([CENTER - 45, CENTER - 45, CENTER + 45, CENTER + 45], outline=(255, 220, 100, 255), width=6)
    draw.ellipse([CENTER - 38, CENTER - 38, CENTER + 38, CENTER + 38], outline=(140, 85, 40, 255), width=3)
    # Central hub
    draw.ellipse([CENTER - 14, CENTER - 14, CENTER + 14, CENTER + 14], fill=(220, 150, 50, 255), outline=(255, 235, 120, 255), width=3)
    # 8 Paddles / Spokes
    for i in range(8):
        ang = i * (2 * math.pi / 8)
        x1 = CENTER + 14 * math.cos(ang)
        y1 = CENTER + 14 * math.sin(ang)
        x2 = CENTER + 45 * math.cos(ang)
        y2 = CENTER + 45 * math.sin(ang)
        draw.line([(x1, y1), (x2, y2)], fill=(160, 100, 50, 255), width=5)
        # Paddle blade at tip
        perp = ang + math.pi / 2
        px1 = x2 - 8 * math.cos(perp)
        py1 = y2 - 8 * math.sin(perp)
        px2 = x2 + 8 * math.cos(perp)
        py2 = y2 + 8 * math.sin(perp)
        draw.line([(px1, py1), (px2, py2)], fill=(255, 220, 100, 255), width=3)
    # Water splash below
    draw.arc([CENTER - 52, CENTER + 10, CENTER + 52, CENTER + 46], start=20, end=160, fill=(220, 245, 255, 220), width=4)

def draw_garden(img):
    draw = ImageDraw.Draw(img)
    # 6. Garden badge - Blooming 5-petal flower & leaves
    # Green leaves behind
    draw.polygon([(CENTER - 15, CENTER - 10), (CENTER - 50, CENTER - 25), (CENTER - 35, CENTER + 8)], fill=(80, 180, 70, 255), outline=(200, 255, 160, 255), width=2)
    draw.polygon([(CENTER + 15, CENTER - 10), (CENTER + 50, CENTER - 25), (CENTER + 35, CENTER + 8)], fill=(80, 180, 70, 255), outline=(200, 255, 160, 255), width=2)
    # 5 Petals
    for i in range(5):
        ang = -math.pi / 2 + i * (2 * math.pi / 5)
        px = CENTER + 26 * math.cos(ang)
        py = CENTER + 26 * math.sin(ang)
        draw.ellipse([px - 18, py - 18, px + 18, py + 18], fill=(255, 140, 175, 255), outline=(255, 240, 245, 255), width=2)
    # Center golden pistil
    draw.ellipse([CENTER - 16, CENTER - 16, CENTER + 16, CENTER + 16], fill=(255, 225, 70, 255), outline=(255, 160, 30, 255), width=2)
    draw.ellipse([CENTER - 8, CENTER - 8, CENTER + 8, CENTER + 8], fill=(255, 250, 160, 255))

def draw_camp(img):
    draw = ImageDraw.Draw(img)
    # 7. Camp badge - Bonfire & crossed logs
    # Moon in sky
    draw.ellipse([CENTER + 25, CENTER - 48, CENTER + 47, CENTER - 26], fill=(255, 240, 150, 255))
    draw.ellipse([CENTER + 20, CENTER - 50, CENTER + 42, CENTER - 28], fill=(30, 35, 55, 255)) # crescent cutout
    # Crossed logs
    draw.line([(CENTER - 45, CENTER + 28), (CENTER + 45, CENTER + 12)], fill=(140, 80, 40, 255), width=8)
    draw.line([(CENTER + 45, CENTER + 28), (CENTER - 45, CENTER + 12)], fill=(120, 70, 35, 255), width=8)
    # Fire flames (multi-layered)
    flame_outer = [
        (CENTER, CENTER - 48),
        (CENTER + 28, CENTER - 15),
        (CENTER + 36, CENTER + 12),
        (CENTER, CENTER + 20),
        (CENTER - 36, CENTER + 12),
        (CENTER - 28, CENTER - 15)
    ]
    draw.polygon(flame_outer, fill=(240, 70, 30, 255), outline=(255, 200, 80, 255), width=2)
    flame_mid = [
        (CENTER, CENTER - 32),
        (CENTER + 18, CENTER - 5),
        (CENTER + 22, CENTER + 14),
        (CENTER, CENTER + 18),
        (CENTER - 22, CENTER + 14),
        (CENTER - 18, CENTER - 5)
    ]
    draw.polygon(flame_mid, fill=(255, 160, 20, 255))
    flame_inner = [
        (CENTER, CENTER - 15),
        (CENTER + 10, CENTER + 2),
        (CENTER, CENTER + 14),
        (CENTER - 10, CENTER + 2)
    ]
    draw.polygon(flame_inner, fill=(255, 250, 160, 255))

def draw_workshop(img):
    draw = ImageDraw.Draw(img)
    # 8. Workshop badge - Crossed Hammer & Saw
    # Saw (Diagonal /)
    saw_blade = [(CENTER - 42, CENTER + 36), (CENTER + 36, CENTER - 42), (CENTER + 45, CENTER - 33), (CENTER - 33, CENTER + 45)]
    draw.polygon(saw_blade, fill=(210, 220, 230, 255), outline=(255, 220, 100, 255), width=2)
    # Saw handle
    draw.rounded_rectangle([CENTER - 54, CENTER + 24, CENTER - 34, CENTER + 50], radius=4, fill=(160, 95, 50, 255), outline=(255, 220, 100, 255), width=2)
    # Hammer (Diagonal \)
    # Handle
    draw.line([(CENTER + 42, CENTER + 38), (CENTER - 30, CENTER - 34)], fill=(170, 100, 50, 255), width=7)
    # Hammer head
    draw.rectangle([CENTER - 44, CENTER - 44, CENTER - 18, CENTER - 24], fill=(130, 140, 150, 255), outline=(255, 240, 150, 255), width=3)
    # Gear accent behind center
    draw.ellipse([CENTER - 16, CENTER - 16, CENTER + 16, CENTER + 16], outline=(255, 215, 0, 255), width=3)

def draw_bridge(img):
    draw = ImageDraw.Draw(img)
    # 9. Bridge badge - Grand canyon arched timber bridge
    # Canyon cliffs on left and right
    draw.polygon([(CENTER - 60, CENTER - 15), (CENTER - 35, CENTER + 38), (CENTER - 60, CENTER + 38)], fill=(120, 90, 75, 255), outline=(220, 180, 140, 255), width=2)
    draw.polygon([(CENTER + 60, CENTER - 15), (CENTER + 35, CENTER + 38), (CENTER + 60, CENTER + 38)], fill=(120, 90, 75, 255), outline=(220, 180, 140, 255), width=2)
    # Main arch span
    draw.arc([CENTER - 48, CENTER - 32, CENTER + 48, CENTER + 38], start=180, end=360, fill=(255, 220, 100, 255), width=6)
    draw.arc([CENTER - 42, CENTER - 26, CENTER + 42, CENTER + 38], start=180, end=360, fill=(160, 100, 50, 255), width=4)
    # Bridge walkway line
    draw.line([(CENTER - 45, CENTER - 4), (CENTER + 45, CENTER - 4)], fill=(255, 230, 140, 255), width=4)
    # Vertical posts
    for x in [-30, -15, 0, 15, 30]:
        draw.line([(CENTER + x, CENTER - 4), (CENTER + x, CENTER + 6)], fill=(150, 90, 45, 255), width=2)

def draw_spring(img):
    draw = ImageDraw.Draw(img)
    # 10. Spring badge - Pristine spring ripples, glowing crystal droplet & fireflies
    # Concentric water ripples
    for r, col, w in [(44, (160, 230, 255, 120), 2), (32, (180, 240, 255, 160), 3), (20, (210, 250, 255, 200), 3)]:
        draw.ellipse([CENTER - r, CENTER + 6 - int(r*0.5), CENTER + r, CENTER + 6 + int(r*0.5)], outline=col, width=w)
    # Crystal drop
    drop = [(CENTER, CENTER - 45), (CENTER + 20, CENTER - 10), (CENTER + 15, CENTER + 12), (CENTER - 15, CENTER + 12), (CENTER - 20, CENTER - 10)]
    draw.polygon(drop, fill=(140, 235, 255, 240), outline=(255, 255, 255, 255), width=3)
    # Drop facets
    draw.line([(CENTER, CENTER - 45), (CENTER, CENTER + 12)], fill=(255, 255, 255, 200), width=2)
    draw.polygon([(CENTER, CENTER - 45), (CENTER - 12, CENTER - 5), (CENTER, CENTER + 6)], fill=(200, 250, 255, 160))
    # Glowing Fireflies
    for fx, fy in [(CENTER - 35, CENTER - 25), (CENTER + 36, CENTER - 30), (CENTER + 30, CENTER + 20), (CENTER - 32, CENTER + 18)]:
        draw.ellipse([fx - 4, fy - 4, fx + 4, fy + 4], fill=(255, 255, 150, 255))
        draw.ellipse([fx - 8, fy - 8, fx + 8, fy + 8], outline=(255, 255, 120, 100), width=2)

def draw_orchard(img):
    draw = ImageDraw.Draw(img)
    # 11. Orchard badge - Red apples & sweet berries with green leaves
    # Big Red Apple (Center-Left)
    ax, ay = CENTER - 14, CENTER + 2
    draw.ellipse([ax - 26, ay - 24, ax + 26, ay + 24], fill=(225, 45, 45, 255), outline=(255, 220, 130, 255), width=3)
    # Apple shine
    draw.arc([ax - 18, ay - 16, ax + 2, ay + 2], start=180, end=270, fill=(255, 180, 180, 220), width=3)
    # Stem & Leaf
    draw.line([(ax, ay - 24), (ax + 4, ay - 36)], fill=(120, 70, 30, 255), width=4)
    draw.polygon([(ax + 4, ay - 32), (ax + 24, ay - 42), (ax + 22, ay - 24)], fill=(80, 190, 60, 255), outline=(255, 240, 160, 255), width=2)
    # Berries (Right)
    bx, by = CENTER + 24, CENTER + 10
    for ox, oy, col in [(-8, -6, (180, 30, 90, 255)), (8, -6, (210, 40, 70, 255)), (0, 8, (150, 20, 80, 255))]:
        draw.ellipse([bx + ox - 11, by + oy - 11, bx + ox + 11, by + oy + 11], fill=col, outline=(255, 210, 140, 255), width=2)

def draw_waterfall(img):
    draw = ImageDraw.Draw(img)
    # 12. Waterfall badge - Two-tiered cascading falls & cliffs
    # Rock cliffs
    draw.polygon([(CENTER - 52, CENTER - 45), (CENTER - 20, CENTER - 45), (CENTER - 25, CENTER + 35), (CENTER - 52, CENTER + 35)], fill=(100, 110, 125, 255), outline=(200, 220, 240, 255), width=2)
    draw.polygon([(CENTER + 20, CENTER - 45), (CENTER + 52, CENTER - 45), (CENTER + 52, CENTER + 35), (CENTER + 25, CENTER + 35)], fill=(100, 110, 125, 255), outline=(200, 220, 240, 255), width=2)
    # Upper fall
    draw.rounded_rectangle([CENTER - 18, CENTER - 45, CENTER + 18, CENTER - 8], radius=3, fill=(225, 245, 255, 255), outline=(255, 255, 255, 255), width=2)
    # Mid ledge
    draw.rectangle([CENTER - 26, CENTER - 8, CENTER + 26, CENTER], fill=(130, 140, 155, 255), outline=(255, 255, 255, 255), width=1)
    # Lower fall (wider cascade)
    draw.polygon([(CENTER - 20, CENTER), (CENTER + 20, CENTER), (CENTER + 28, CENTER + 32), (CENTER - 28, CENTER + 32)], fill=(210, 240, 255, 255), outline=(255, 255, 255, 255), width=2)
    # Water foam lines
    for y in [CENTER - 30, CENTER - 20, CENTER + 10, CENTER + 22]:
        draw.line([(CENTER - 10, y), (CENTER + 10, y)], fill=(255, 255, 255, 220), width=2)

def draw_stars(img):
    draw = ImageDraw.Draw(img)
    # 13. Stars badge - Telescope & golden constellations
    # Golden Telescope
    # Tube
    draw.polygon([(CENTER - 32, CENTER + 6), (CENTER + 28, CENTER - 36), (CENTER + 36, CENTER - 25), (CENTER - 24, CENTER + 17)], fill=(240, 190, 50, 255), outline=(255, 240, 150, 255), width=2)
    # Eyepiece
    draw.rectangle([CENTER - 38, CENTER + 12, CENTER - 28, CENTER + 22], fill=(160, 100, 30, 255), outline=(255, 230, 120, 255), width=1)
    # Tripod legs
    draw.line([(CENTER + 2, CENTER - 10), (CENTER - 32, CENTER + 38)], fill=(120, 70, 30, 255), width=4)
    draw.line([(CENTER + 2, CENTER - 10), (CENTER + 2, CENTER + 38)], fill=(140, 85, 35, 255), width=4)
    draw.line([(CENTER + 2, CENTER - 10), (CENTER + 36, CENTER + 38)], fill=(120, 70, 30, 255), width=4)
    # Stars in sky
    draw_star(draw, CENTER - 30, CENTER - 32, 10, 4, fill=(255, 255, 180, 255))
    draw_star(draw, CENTER + 38, CENTER - 42, 8, 3.5, fill=(255, 255, 180, 255))
    draw_star(draw, CENTER + 42, CENTER - 8, 6, 2.5, fill=(255, 240, 130, 255))

def draw_sacred(img):
    draw = ImageDraw.Draw(img)
    # 14. Sacred badge - Vermilion Torii gate & Sacred Tree leaves
    # Radiant aura rays
    for i in range(12):
        ang = i * (2 * math.pi / 12)
        x1 = CENTER + 35 * math.cos(ang)
        y1 = CENTER - 6 + 35 * math.sin(ang)
        x2 = CENTER + 55 * math.cos(ang)
        y2 = CENTER - 6 + 55 * math.sin(ang)
        draw.line([(x1, y1), (x2, y2)], fill=(255, 235, 120, 100), width=2)
    # Torii Gate (Vermilion red & black)
    # Main Pillars
    draw.rectangle([CENTER - 34, CENTER - 20, CENTER - 24, CENTER + 35], fill=(215, 45, 30, 255), outline=(255, 220, 100, 255), width=2)
    draw.rectangle([CENTER + 24, CENTER - 20, CENTER + 34, CENTER + 35], fill=(215, 45, 30, 255), outline=(255, 220, 100, 255), width=2)
    # Lower lintel
    draw.rectangle([CENTER - 42, CENTER - 14, CENTER + 42, CENTER - 7], fill=(215, 45, 30, 255), outline=(255, 220, 100, 255), width=2)
    # Upper Curved Kasagi roof
    kasagi = [(CENTER - 52, CENTER - 30), (CENTER + 52, CENTER - 30), (CENTER + 46, CENTER - 20), (CENTER - 46, CENTER - 20)]
    draw.polygon(kasagi, fill=(40, 30, 30, 255), outline=(255, 230, 110, 255), width=2)
    # Center tablet
    draw.rectangle([CENTER - 8, CENTER - 20, CENTER + 8, CENTER - 7], fill=(40, 30, 30, 255), outline=(255, 220, 100, 255), width=1)
    # Sacred rope / Shimenawa
    draw.arc([CENTER - 28, CENTER - 10, CENTER + 28, CENTER + 8], start=0, end=180, fill=(255, 240, 160, 255), width=3)

def draw_paradise(img):
    draw = ImageDraw.Draw(img)
    # 15. Paradise badge - Imperial Golden Crown & Grand Dam masterwork
    # Grand Fortress silhouette in background
    fortress = [
        (CENTER - 50, CENTER + 32),
        (CENTER - 50, CENTER + 10),
        (CENTER - 30, CENTER + 10),
        (CENTER - 30, CENTER + 16),
        (CENTER + 30, CENTER + 16),
        (CENTER + 30, CENTER + 10),
        (CENTER + 50, CENTER + 10),
        (CENTER + 50, CENTER + 32),
    ]
    draw.polygon(fortress, fill=(180, 120, 50, 255), outline=(255, 230, 120, 255), width=2)
    # Imperial Crown (Centerpiece)
    crown = [
        (CENTER - 44, CENTER + 10),
        (CENTER - 40, CENTER - 28),
        (CENTER - 18, CENTER - 8),
        (CENTER, CENTER - 36),
        (CENTER + 18, CENTER - 8),
        (CENTER + 40, CENTER - 28),
        (CENTER + 44, CENTER + 10)
    ]
    draw.polygon(crown, fill=(255, 205, 40, 255), outline=(255, 255, 200, 255), width=3)
    # Jewels on crown peaks
    draw.ellipse([CENTER - 43, CENTER - 33, CENTER - 35, CENTER - 25], fill=(230, 40, 50, 255), outline=(255, 255, 255, 255), width=1)
    draw.ellipse([CENTER - 5, CENTER - 41, CENTER + 5, CENTER - 31], fill=(40, 180, 255, 255), outline=(255, 255, 255, 255), width=2)
    draw.ellipse([CENTER + 35, CENTER - 33, CENTER + 43, CENTER - 25], fill=(80, 210, 60, 255), outline=(255, 255, 255, 255), width=1)
    # Crown base band
    draw.rounded_rectangle([CENTER - 42, CENTER + 2, CENTER + 42, CENTER + 14], radius=3, fill=(210, 40, 50, 255), outline=(255, 240, 140, 255), width=2)
    for cx in [-28, -14, 0, 14, 28]:
        draw.ellipse([CENTER + cx - 3, CENTER + 5, CENTER + cx + 3, CENTER + 11], fill=(255, 255, 255, 255))

BADGES_CONFIG = [
    {
        "filename": "badge_stream.png",
        "bg_inner": (120, 210, 255, 255),
        "bg_outer": (15, 70, 130, 255),
        "ribbon": (40, 130, 200, 255),
        "draw_func": draw_stream
    },
    {
        "filename": "badge_dam.png",
        "bg_inner": (130, 200, 110, 255),
        "bg_outer": (40, 80, 30, 255),
        "ribbon": (60, 130, 50, 255),
        "draw_func": draw_dam
    },
    {
        "filename": "badge_lodge.png",
        "bg_inner": (255, 180, 90, 255),
        "bg_outer": (130, 60, 20, 255),
        "ribbon": (190, 70, 30, 255),
        "draw_func": draw_lodge
    },
    {
        "filename": "badge_pier.png",
        "bg_inner": (90, 200, 230, 255),
        "bg_outer": (20, 60, 110, 255),
        "ribbon": (30, 110, 170, 255),
        "draw_func": draw_pier
    },
    {
        "filename": "badge_watermill.png",
        "bg_inner": (100, 210, 210, 255),
        "bg_outer": (20, 80, 85, 255),
        "ribbon": (35, 140, 140, 255),
        "draw_func": draw_watermill
    },
    {
        "filename": "badge_garden.png",
        "bg_inner": (255, 175, 200, 255),
        "bg_outer": (140, 40, 90, 255),
        "ribbon": (190, 50, 110, 255),
        "draw_func": draw_garden
    },
    {
        "filename": "badge_camp.png",
        "bg_inner": (255, 140, 60, 255),
        "bg_outer": (70, 30, 50, 255),
        "ribbon": (180, 50, 25, 255),
        "draw_func": draw_camp
    },
    {
        "filename": "badge_workshop.png",
        "bg_inner": (245, 175, 95, 255),
        "bg_outer": (100, 50, 15, 255),
        "ribbon": (160, 80, 30, 255),
        "draw_func": draw_workshop
    },
    {
        "filename": "badge_bridge.png",
        "bg_inner": (240, 160, 100, 255),
        "bg_outer": (80, 45, 55, 255),
        "ribbon": (150, 70, 60, 255),
        "draw_func": draw_bridge
    },
    {
        "filename": "badge_spring.png",
        "bg_inner": (130, 235, 255, 255),
        "bg_outer": (20, 55, 120, 255),
        "ribbon": (25, 130, 190, 255),
        "draw_func": draw_spring
    },
    {
        "filename": "badge_orchard.png",
        "bg_inner": (255, 210, 90, 255),
        "bg_outer": (140, 30, 30, 255),
        "ribbon": (200, 45, 45, 255),
        "draw_func": draw_orchard
    },
    {
        "filename": "badge_waterfall.png",
        "bg_inner": (100, 205, 255, 255),
        "bg_outer": (15, 50, 110, 255),
        "ribbon": (30, 95, 175, 255),
        "draw_func": draw_waterfall
    },
    {
        "filename": "badge_stars.png",
        "bg_inner": (140, 130, 240, 255),
        "bg_outer": (25, 20, 70, 255),
        "ribbon": (75, 50, 160, 255),
        "draw_func": draw_stars
    },
    {
        "filename": "badge_sacred.png",
        "bg_inner": (255, 215, 110, 255),
        "bg_outer": (40, 80, 40, 255),
        "ribbon": (190, 40, 30, 255),
        "draw_func": draw_sacred
    },
    {
        "filename": "badge_paradise.png",
        "bg_inner": (255, 230, 130, 255),
        "bg_outer": (140, 80, 10, 255),
        "ribbon": (210, 160, 20, 255),
        "draw_func": draw_paradise
    },
]

print("Starting generation of all 15 commemorative badges...")
for cfg in BADGES_CONFIG:
    img = create_base_medal(cfg["bg_inner"], cfg["bg_outer"])
    cfg["draw_func"](img)
    img = apply_finish(img, ribbon_color=cfg["ribbon"])
    out_path = os.path.join(OUTPUT_DIR, cfg["filename"])
    img.save(out_path, format="PNG")
    print(f"Generated: {out_path}")

print("All 15 badges generated successfully!")
