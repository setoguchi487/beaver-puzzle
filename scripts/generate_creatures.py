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
    max_dist = center * 0.85
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

def create_creature_frame(bg_inner, bg_outer, border_gold=(215, 160, 45, 255)):
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    
    # Shadow
    shadow_mask = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow_mask)
    s_draw.ellipse([CENTER - RADIUS - 4, CENTER - RADIUS + 8, CENTER + RADIUS + 4, CENTER + RADIUS + 22], fill=(0, 0, 0, 150))
    img.alpha_composite(shadow_mask.filter(ImageFilter.GaussianBlur(10)))
    
    # Outer frame
    draw = ImageDraw.Draw(img)
    draw.ellipse([CENTER - RADIUS, CENTER - RADIUS, CENTER + RADIUS, CENTER + RADIUS], fill=border_gold, outline=(110, 70, 20, 255), width=3)
    
    # Stepped ring
    r_sub = RADIUS - 6
    draw.ellipse([CENTER - r_sub, CENTER - r_sub, CENTER + r_sub, CENTER + r_sub], outline=(255, 240, 140, 255), width=2)
    
    # Border studs
    for i in range(12):
        ang = i * (2 * math.pi / 12)
        sx = CENTER + (RADIUS - 12) * math.cos(ang)
        sy = CENTER + (RADIUS - 12) * math.sin(ang)
        draw.ellipse([sx - 3, sy - 3, sx + 3, sy + 3], fill=(255, 245, 170, 255), outline=(130, 85, 25, 255), width=1)
        draw.point((sx - 1, sy - 1), fill=(255, 255, 255, 255))
        
    # Inner circular backdrop
    r_inner = RADIUS - 18
    mask = Image.new("L", (SIZE, SIZE), 0)
    m_draw = ImageDraw.Draw(mask)
    m_draw.ellipse([CENTER - r_inner, CENTER - r_inner, CENTER + r_inner, CENTER + r_inner], fill=255)
    
    grad = create_radial_gradient(SIZE, bg_inner, bg_outer)
    img.paste(grad, (0, 0), mask)
    
    # Disc border
    draw = ImageDraw.Draw(img)
    draw.ellipse([CENTER - r_inner, CENTER - r_inner, CENTER + r_inner, CENTER + r_inner], outline=(100, 60, 20, 255), width=3)
    draw.ellipse([CENTER - r_inner + 2, CENTER - r_inner + 2, CENTER + r_inner - 2, CENTER + r_inner - 2], outline=(255, 230, 100, 180), width=1)
    
    return img

def apply_creature_finish(img):
    r_inner = RADIUS - 18
    sheen = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(sheen)
    s_draw.chord([CENTER - r_inner + 4, CENTER - r_inner + 4, CENTER + r_inner - 4, CENTER + r_inner - 4],
                 start=200, end=340, fill=(255, 255, 255, 30))
    img.alpha_composite(sheen)
    return img

# --- CREATURE DRAWING FUNCTIONS ---

def draw_duck(img):
    draw = ImageDraw.Draw(img)
    # Water ripples
    draw.arc([CENTER - 60, CENTER + 20, CENTER + 60, CENTER + 55], start=0, end=180, fill=(180, 240, 255, 200), width=3)
    # Mother Duck
    # Body
    draw.ellipse([CENTER - 50, CENTER - 10, CENTER + 25, CENTER + 35], fill=(135, 95, 60, 255), outline=(90, 60, 35, 255), width=2)
    # Wing detail
    draw.arc([CENTER - 35, CENTER - 5, CENTER + 5, CENTER + 25], start=40, end=170, fill=(50, 80, 140, 255), width=5)
    # Green Head
    draw.ellipse([CENTER - 10, CENTER - 45, CENTER + 30, CENTER - 5], fill=(30, 130, 70, 255), outline=(15, 75, 40, 255), width=2)
    # White neck ring
    draw.line([(CENTER - 5, CENTER - 8), (CENTER + 20, CENTER - 8)], fill=(255, 255, 255, 255), width=3)
    # Yellow Beak
    draw.polygon([(CENTER + 25, CENTER - 28), (CENTER + 46, CENTER - 22), (CENTER + 25, CENTER - 16)], fill=(255, 200, 30, 255), outline=(210, 140, 10, 255), width=1)
    # Eye
    draw.ellipse([CENTER + 10, CENTER - 32, CENTER + 16, CENTER - 26], fill=(20, 20, 20, 255))
    draw.point((CENTER + 12, CENTER - 30), fill=(255, 255, 255, 255))
    # Baby Duckling (Right)
    draw.ellipse([CENTER + 20, CENTER + 5, CENTER + 52, CENTER + 32], fill=(255, 225, 70, 255), outline=(210, 160, 20, 255), width=2)
    draw.ellipse([CENTER + 36, CENTER - 8, CENTER + 56, CENTER + 10], fill=(255, 225, 70, 255), outline=(210, 160, 20, 255), width=2)
    draw.polygon([(CENTER + 52, CENTER - 2), (CENTER + 64, CENTER + 1), (CENTER + 52, CENTER + 4)], fill=(255, 160, 30, 255))
    draw.ellipse([CENTER + 44, CENTER - 3, CENTER + 48, CENTER + 1], fill=(20, 20, 20, 255))

def draw_sweetfish(img):
    draw = ImageDraw.Draw(img)
    # Water stream curves
    for yoff in [-30, 25, 50]:
        pts = [(x, CENTER + yoff + 10 * math.sin((x - CENTER) * 0.08)) for x in range(CENTER - 60, CENTER + 65, 5)]
        draw.line(pts, fill=(180, 235, 255, 180), width=3, joint='curve')
    # Ayu leaping (Curved body)
    body = [
        (CENTER - 45, CENTER + 15),
        (CENTER - 20, CENTER - 20),
        (CENTER + 15, CENTER - 28),
        (CENTER + 45, CENTER - 10),
        (CENTER + 25, CENTER + 5),
        (CENTER - 15, CENTER + 18),
    ]
    draw.polygon(body, fill=(200, 225, 215, 255), outline=(90, 130, 110, 255), width=2)
    # Yellow spot on gill (追星)
    draw.ellipse([CENTER + 18, CENTER - 22, CENTER + 28, CENTER - 12], fill=(255, 230, 50, 255))
    # Dorsal fin
    draw.polygon([(CENTER, CENTER - 26), (CENTER + 12, CENTER - 42), (CENTER + 18, CENTER - 26)], fill=(150, 190, 170, 255), outline=(80, 120, 100, 255))
    # Tail fin
    draw.polygon([(CENTER - 42, CENTER + 14), (CENTER - 65, CENTER + 5), (CENTER - 58, CENTER + 28), (CENTER - 40, CENTER + 18)], fill=(160, 200, 180, 255), outline=(90, 130, 110, 255))
    # Eye
    draw.ellipse([CENTER + 32, CENTER - 18, CENTER + 38, CENTER - 12], fill=(30, 30, 30, 255))
    draw.point((CENTER + 34, CENTER - 16), fill=(255, 255, 255, 255))
    # Droplets
    draw.ellipse([CENTER - 10, CENTER - 38, CENTER - 4, CENTER - 32], fill=(220, 245, 255, 240))
    draw.ellipse([CENTER + 35, CENTER + 15, CENTER + 42, CENTER + 22], fill=(220, 245, 255, 240))

def draw_chipmunk(img):
    draw = ImageDraw.Draw(img)
    # Fluffy tail (Left curled up)
    tail = [(CENTER - 30, CENTER + 30), (CENTER - 60, CENTER + 10), (CENTER - 65, CENTER - 25), (CENTER - 40, CENTER - 35), (CENTER - 30, CENTER - 10)]
    draw.polygon(tail, fill=(185, 120, 65, 255), outline=(120, 70, 30, 255), width=2)
    # Body
    draw.ellipse([CENTER - 35, CENTER - 10, CENTER + 25, CENTER + 45], fill=(195, 130, 75, 255), outline=(130, 80, 35, 255), width=2)
    # Stripes on back
    draw.line([(CENTER - 25, CENTER - 5), (CENTER - 25, CENTER + 30)], fill=(50, 30, 15, 255), width=3)
    draw.line([(CENTER - 20, CENTER - 5), (CENTER - 20, CENTER + 30)], fill=(255, 255, 255, 255), width=2)
    draw.line([(CENTER - 15, CENTER - 5), (CENTER - 15, CENTER + 30)], fill=(50, 30, 15, 255), width=3)
    # Head & Puffed Cheeks
    draw.ellipse([CENTER - 5, CENTER - 42, CENTER + 45, CENTER + 8], fill=(210, 145, 90, 255), outline=(130, 80, 35, 255), width=2)
    # White cheek patch
    draw.ellipse([CENTER + 5, CENTER - 20, CENTER + 42, CENTER + 6], fill=(250, 240, 230, 255))
    # Round Ears
    draw.ellipse([CENTER + 5, CENTER - 50, CENTER + 20, CENTER - 35], fill=(195, 130, 75, 255), outline=(120, 70, 30, 255))
    draw.ellipse([CENTER + 25, CENTER - 48, CENTER + 40, CENTER - 33], fill=(195, 130, 75, 255), outline=(120, 70, 30, 255))
    # Big sparkling eye
    draw.ellipse([CENTER + 16, CENTER - 32, CENTER + 26, CENTER - 22], fill=(25, 25, 25, 255))
    draw.ellipse([CENTER + 18, CENTER - 30, CENTER + 22, CENTER - 26], fill=(255, 255, 255, 255))
    # Nose
    draw.polygon([(CENTER + 42, CENTER - 18), (CENTER + 48, CENTER - 15), (CENTER + 42, CENTER - 12)], fill=(210, 100, 100, 255))
    # Holding Acorn in hands
    draw.ellipse([CENTER + 5, CENTER + 8, CENTER + 28, CENTER + 32], fill=(160, 90, 40, 255), outline=(100, 50, 20, 255), width=2)
    draw.chord([CENTER + 5, CENTER + 5, CENTER + 28, CENTER + 20], start=180, end=360, fill=(110, 60, 25, 255), outline=(80, 40, 15, 255), width=2)

def draw_kingfisher(img):
    draw = ImageDraw.Draw(img)
    # Perch branch
    draw.line([(CENTER - 60, CENTER + 38), (CENTER + 60, CENTER + 25)], fill=(120, 75, 35, 255), width=7)
    # Orange Belly
    draw.ellipse([CENTER - 25, CENTER - 12, CENTER + 22, CENTER + 35], fill=(235, 110, 35, 255), outline=(160, 70, 20, 255), width=2)
    # Cobalt Blue Wing
    draw.ellipse([CENTER - 36, CENTER - 15, CENTER + 5, CENTER + 32], fill=(25, 120, 210, 255), outline=(10, 70, 140, 255), width=2)
    # White neck patch
    draw.ellipse([CENTER - 10, CENTER - 25, CENTER + 15, CENTER - 10], fill=(255, 255, 255, 255))
    # Vivid Blue Head
    draw.ellipse([CENTER - 18, CENTER - 45, CENTER + 24, CENTER - 8], fill=(15, 140, 215, 255), outline=(10, 80, 150, 255), width=2)
    # Long Dagger Beak
    draw.polygon([(CENTER + 16, CENTER - 26), (CENTER + 58, CENTER - 20), (CENTER + 16, CENTER - 16)], fill=(35, 35, 40, 255), outline=(20, 20, 25, 255), width=1)
    # Eye
    draw.ellipse([CENTER + 2, CENTER - 32, CENTER + 10, CENTER - 24], fill=(20, 20, 20, 255))
    draw.point((CENTER + 4, CENTER - 30), fill=(255, 255, 255, 255))
    # Crown feathers
    draw.polygon([(CENTER - 15, CENTER - 42), (CENTER - 24, CENTER - 50), (CENTER - 8, CENTER - 45)], fill=(15, 140, 215, 255))

def draw_owl(img):
    draw = ImageDraw.Draw(img)
    # Tree perch
    draw.line([(CENTER - 55, CENTER + 38), (CENTER + 55, CENTER + 38)], fill=(110, 70, 35, 255), width=8)
    # Body
    draw.ellipse([CENTER - 40, CENTER - 20, CENTER + 40, CENTER + 40], fill=(170, 130, 85, 255), outline=(110, 80, 45, 255), width=2)
    # Feather chest pattern
    for y, off in [(CENTER + 5, -15), (CENTER + 18, 0), (CENTER + 28, -10)]:
        draw.arc([CENTER + off - 12, y - 5, CENTER + off + 12, y + 5], start=0, end=180, fill=(100, 70, 35, 255), width=2)
        draw.arc([CENTER - off - 12, y - 5, CENTER - off + 12, y + 5], start=0, end=180, fill=(100, 70, 35, 255), width=2)
    # Head
    draw.ellipse([CENTER - 36, CENTER - 46, CENTER + 36, CENTER + 6], fill=(190, 145, 95, 255), outline=(120, 85, 50, 255), width=2)
    # Feather Ears (Tufts)
    draw.polygon([(CENTER - 30, CENTER - 40), (CENTER - 40, CENTER - 60), (CENTER - 18, CENTER - 44)], fill=(150, 105, 60, 255))
    draw.polygon([(CENTER + 30, CENTER - 40), (CENTER + 40, CENTER - 60), (CENTER + 18, CENTER - 44)], fill=(150, 105, 60, 255))
    # Facial discs
    draw.ellipse([CENTER - 30, CENTER - 35, CENTER - 2, CENTER - 5], fill=(245, 235, 220, 255))
    draw.ellipse([CENTER + 2, CENTER - 35, CENTER + 30, CENTER - 5], fill=(245, 235, 220, 255))
    # Big Golden Eyes
    draw.ellipse([CENTER - 25, CENTER - 30, CENTER - 7, CENTER - 10], fill=(255, 205, 30, 255), outline=(180, 120, 10, 255), width=2)
    draw.ellipse([CENTER - 20, CENTER - 25, CENTER - 12, CENTER - 15], fill=(20, 20, 20, 255))
    draw.point((CENTER - 18, CENTER - 23), fill=(255, 255, 255, 255))

    draw.ellipse([CENTER + 7, CENTER - 30, CENTER + 25, CENTER - 10], fill=(255, 205, 30, 255), outline=(180, 120, 10, 255), width=2)
    draw.ellipse([CENTER + 12, CENTER - 25, CENTER + 20, CENTER - 15], fill=(20, 20, 20, 255))
    draw.point((CENTER + 14, CENTER - 23), fill=(255, 255, 255, 255))
    # Beak
    draw.polygon([(CENTER - 5, CENTER - 18), (CENTER + 5, CENTER - 18), (CENTER, CENTER - 8)], fill=(220, 150, 40, 255))

def draw_deer(img):
    draw = ImageDraw.Draw(img)
    # Elegant Neck & Chest
    draw.polygon([(CENTER - 25, CENTER + 45), (CENTER + 25, CENTER + 45), (CENTER + 15, CENTER), (CENTER - 15, CENTER)], fill=(195, 130, 70, 255), outline=(130, 80, 40, 255), width=2)
    # Head
    head = [(CENTER - 20, CENTER - 25), (CENTER + 20, CENTER - 25), (CENTER + 12, CENTER + 12), (CENTER - 12, CENTER + 12)]
    draw.polygon(head, fill=(210, 145, 80, 255), outline=(140, 90, 45, 255), width=2)
    # Ears
    draw.polygon([(CENTER - 18, CENTER - 20), (CENTER - 45, CENTER - 35), (CENTER - 25, CENTER - 10)], fill=(200, 135, 75, 255), outline=(130, 80, 35, 255))
    draw.polygon([(CENTER + 18, CENTER - 20), (CENTER + 45, CENTER - 35), (CENTER + 25, CENTER - 10)], fill=(200, 135, 75, 255), outline=(130, 80, 35, 255))
    # Grand Antlers
    # Left antler
    draw.line([(CENTER - 12, CENTER - 25), (CENTER - 25, CENTER - 50)], fill=(140, 95, 55, 255), width=4)
    draw.line([(CENTER - 25, CENTER - 50), (CENTER - 42, CENTER - 58)], fill=(140, 95, 55, 255), width=3)
    draw.line([(CENTER - 25, CENTER - 50), (CENTER - 22, CENTER - 65)], fill=(140, 95, 55, 255), width=3)
    # Right antler
    draw.line([(CENTER + 12, CENTER - 25), (CENTER + 25, CENTER - 50)], fill=(140, 95, 55, 255), width=4)
    draw.line([(CENTER + 25, CENTER - 50), (CENTER + 42, CENTER - 58)], fill=(140, 95, 55, 255), width=3)
    draw.line([(CENTER + 25, CENTER - 50), (CENTER + 22, CENTER - 65)], fill=(140, 95, 55, 255), width=3)
    # Gentle Eyes
    draw.ellipse([CENTER - 16, CENTER - 15, CENTER - 8, CENTER - 5], fill=(30, 20, 20, 255))
    draw.point((CENTER - 14, CENTER - 13), fill=(255, 255, 255, 255))
    draw.ellipse([CENTER + 8, CENTER - 15, CENTER + 16, CENTER - 5], fill=(30, 20, 20, 255))
    draw.point((CENTER + 10, CENTER - 13), fill=(255, 255, 255, 255))
    # Black Nose
    draw.polygon([(CENTER - 5, CENTER + 6), (CENTER + 5, CENTER + 6), (CENTER, CENTER + 11)], fill=(40, 30, 30, 255))
    # White fawn spots
    for sx, sy in [(-8, CENTER + 25), (8, CENTER + 22), (0, CENTER + 35)]:
        draw.ellipse([CENTER + sx - 3, sy - 3, CENTER + sx + 3, sy + 3], fill=(255, 250, 240, 255))

def draw_raccoon(img):
    draw = ImageDraw.Draw(img)
    # Striped bushy tail (bottom left)
    tail = [(CENTER - 40, CENTER + 25), (CENTER - 60, CENTER + 10), (CENTER - 65, CENTER - 10), (CENTER - 45, CENTER - 5)]
    draw.polygon(tail, fill=(160, 160, 165, 255), outline=(100, 100, 105, 255), width=2)
    draw.line([(CENTER - 58, CENTER + 14), (CENTER - 45, CENTER + 10)], fill=(40, 40, 45, 255), width=4)
    draw.line([(CENTER - 62, CENTER - 2), (CENTER - 50, CENTER - 6)], fill=(40, 40, 45, 255), width=4)
    # Body
    draw.ellipse([CENTER - 35, CENTER, CENTER + 35, CENTER + 45], fill=(160, 165, 170, 255), outline=(100, 105, 110, 255), width=2)
    # Head
    draw.ellipse([CENTER - 35, CENTER - 35, CENTER + 35, CENTER + 12], fill=(180, 185, 190, 255), outline=(110, 115, 120, 255), width=2)
    # Pointy ears
    draw.polygon([(CENTER - 30, CENTER - 25), (CENTER - 35, CENTER - 48), (CENTER - 15, CENTER - 32)], fill=(140, 145, 150, 255), outline=(90, 95, 100, 255))
    draw.polygon([(CENTER + 30, CENTER - 25), (CENTER + 35, CENTER - 48), (CENTER + 15, CENTER - 32)], fill=(140, 145, 150, 255), outline=(90, 95, 100, 255))
    # Black Bandit Mask across eyes
    mask_poly = [
        (CENTER - 32, CENTER - 15),
        (CENTER - 8, CENTER - 10),
        (CENTER, CENTER - 18),
        (CENTER + 8, CENTER - 10),
        (CENTER + 32, CENTER - 15),
        (CENTER + 28, CENTER + 2),
        (CENTER, CENTER - 5),
        (CENTER - 28, CENTER + 2),
    ]
    draw.polygon(mask_poly, fill=(45, 45, 50, 255))
    # Eyes
    draw.ellipse([CENTER - 18, CENTER - 12, CENTER - 8, CENTER - 2], fill=(255, 255, 255, 255))
    draw.ellipse([CENTER - 16, CENTER - 10, CENTER - 10, CENTER - 4], fill=(20, 20, 20, 255))
    draw.ellipse([CENTER + 8, CENTER - 12, CENTER + 18, CENTER - 2], fill=(255, 255, 255, 255))
    draw.ellipse([CENTER + 10, CENTER - 10, CENTER + 16, CENTER - 4], fill=(20, 20, 20, 255))
    # White muzzle
    draw.ellipse([CENTER - 12, CENTER - 5, CENTER + 12, CENTER + 10], fill=(245, 245, 245, 255))
    draw.polygon([(CENTER - 4, CENTER - 2), (CENTER + 4, CENTER - 2), (CENTER, CENTER + 3)], fill=(20, 20, 20, 255))

def draw_hedgehog(img):
    draw = ImageDraw.Draw(img)
    # Spiky Back (Dense array of spikes)
    for ang_deg in range(130, 310, 14):
        rad = math.radians(ang_deg)
        x1 = CENTER + 38 * math.cos(rad)
        y1 = CENTER + 5 + 38 * math.sin(rad)
        x2 = CENTER + 56 * math.cos(rad)
        y2 = CENTER + 5 + 56 * math.sin(rad)
        draw.line([(x1, y1), (x2, y2)], fill=(120, 80, 50, 255), width=5)
        draw.line([(x1, y1), (x2, y2)], fill=(235, 200, 150, 255), width=2)
    # Body Dome
    draw.chord([CENTER - 45, CENTER - 35, CENTER + 45, CENTER + 45], start=140, end=360, fill=(140, 95, 60, 255), outline=(90, 60, 35, 255), width=2)
    # Cute Face & Snout
    face = [(CENTER, CENTER - 10), (CENTER + 48, CENTER + 12), (CENTER + 20, CENTER + 35), (CENTER - 10, CENTER + 30)]
    draw.polygon(face, fill=(245, 220, 195, 255), outline=(180, 140, 110, 255), width=2)
    # Little Ear
    draw.ellipse([CENTER + 8, CENTER - 5, CENTER + 20, CENTER + 8], fill=(230, 185, 165, 255), outline=(170, 120, 100, 255), width=2)
    # Sparkling black eye
    draw.ellipse([CENTER + 22, CENTER + 2, CENTER + 30, CENTER + 10], fill=(25, 20, 20, 255))
    draw.point((CENTER + 24, CENTER + 4), fill=(255, 255, 255, 255))
    # Shiny black nose
    draw.ellipse([CENTER + 44, CENTER + 8, CENTER + 52, CENTER + 16], fill=(30, 25, 25, 255))

def draw_snow_monkey(img):
    draw = ImageDraw.Draw(img)
    # Fluffy Gray Fur Head & Shoulders
    draw.ellipse([CENTER - 45, CENTER - 15, CENTER + 45, CENTER + 45], fill=(190, 185, 180, 255), outline=(130, 125, 120, 255), width=2)
    draw.ellipse([CENTER - 42, CENTER - 45, CENTER + 42, CENTER + 20], fill=(200, 195, 190, 255), outline=(135, 130, 125, 255), width=2)
    # Red Face (Rosy Monkey)
    draw.ellipse([CENTER - 26, CENTER - 32, CENTER + 26, CENTER + 12], fill=(235, 95, 90, 255), outline=(180, 60, 55, 255), width=2)
    # Intelligent Brown Eyes
    draw.ellipse([CENTER - 18, CENTER - 18, CENTER - 6, CENTER - 8], fill=(50, 30, 20, 255))
    draw.point((CENTER - 15, CENTER - 15), fill=(255, 255, 255, 255))
    draw.ellipse([CENTER + 6, CENTER - 18, CENTER + 18, CENTER - 8], fill=(50, 30, 20, 255))
    draw.point((CENTER + 9, CENTER - 15), fill=(255, 255, 255, 255))
    # Nostrils & Smile
    draw.ellipse([CENTER - 5, CENTER - 2, CENTER - 2, CENTER + 2], fill=(140, 40, 40, 255))
    draw.ellipse([CENTER + 2, CENTER - 2, CENTER + 5, CENTER + 2], fill=(140, 40, 40, 255))
    draw.arc([CENTER - 10, CENTER, CENTER + 10, CENTER + 8], start=20, end=160, fill=(140, 40, 40, 255), width=2)

def draw_swan(img):
    draw = ImageDraw.Draw(img)
    # Gentle Water Ripple
    draw.arc([CENTER - 55, CENTER + 20, CENTER + 55, CENTER + 45], start=0, end=180, fill=(200, 240, 255, 220), width=3)
    # Elegant Body
    draw.ellipse([CENTER - 45, CENTER - 2, CENTER + 35, CENTER + 36], fill=(250, 250, 255, 255), outline=(200, 210, 225, 255), width=2)
    # Wing Feathers Up
    wing = [(CENTER - 35, CENTER + 10), (CENTER - 10, CENTER - 20), (CENTER + 15, CENTER - 5), (CENTER + 10, CENTER + 20)]
    draw.polygon(wing, fill=(240, 245, 250, 255), outline=(190, 200, 215, 255), width=2)
    # Graceful S-Neck
    neck = [(CENTER + 15, CENTER + 15), (CENTER + 30, CENTER - 15), (CENTER + 20, CENTER - 45), (CENTER + 8, CENTER - 40), (CENTER + 20, CENTER - 10), (CENTER + 5, CENTER + 15)]
    draw.polygon(neck, fill=(255, 255, 255, 255), outline=(210, 215, 225, 255), width=2)
    # Head
    draw.ellipse([CENTER + 6, CENTER - 50, CENTER + 28, CENTER - 32], fill=(255, 255, 255, 255), outline=(210, 215, 225, 255), width=2)
    # Yellow & Black Beak
    draw.polygon([(CENTER + 26, CENTER - 42), (CENTER + 46, CENTER - 38), (CENTER + 26, CENTER - 34)], fill=(255, 215, 30, 255))
    draw.polygon([(CENTER + 38, CENTER - 40), (CENTER + 46, CENTER - 38), (CENTER + 38, CENTER - 36)], fill=(20, 20, 20, 255))
    # Eye
    draw.ellipse([CENTER + 18, CENTER - 44, CENTER + 24, CENTER - 38], fill=(30, 30, 30, 255))
    draw.point((CENTER + 20, CENTER - 42), fill=(255, 255, 255, 255))

def draw_badger(img):
    draw = ImageDraw.Draw(img)
    # Chunky Body
    draw.ellipse([CENTER - 45, CENTER - 10, CENTER + 45, CENTER + 45], fill=(135, 135, 140, 255), outline=(85, 85, 90, 255), width=2)
    # Head Wedge
    draw.polygon([(CENTER - 32, CENTER - 30), (CENTER + 32, CENTER - 30), (CENTER + 15, CENTER + 18), (CENTER - 15, CENTER + 18)], fill=(245, 245, 250, 255), outline=(120, 120, 125, 255), width=2)
    # Bold Black Eye Stripes (Badger stripes)
    draw.polygon([(CENTER - 25, CENTER - 30), (CENTER - 10, CENTER - 30), (CENTER - 5, CENTER + 12), (CENTER - 14, CENTER + 12)], fill=(35, 35, 40, 255))
    draw.polygon([(CENTER + 25, CENTER - 30), (CENTER + 10, CENTER - 30), (CENTER + 5, CENTER + 12), (CENTER + 14, CENTER + 12)], fill=(35, 35, 40, 255))
    # Eyes inside black stripes
    draw.ellipse([CENTER - 18, CENTER - 12, CENTER - 10, CENTER - 4], fill=(255, 255, 255, 255))
    draw.ellipse([CENTER - 16, CENTER - 10, CENTER - 12, CENTER - 6], fill=(20, 20, 20, 255))
    draw.ellipse([CENTER + 10, CENTER - 12, CENTER + 18, CENTER - 4], fill=(255, 255, 255, 255))
    draw.ellipse([CENTER + 12, CENTER - 10, CENTER + 16, CENTER - 6], fill=(20, 20, 20, 255))
    # Black Nose
    draw.ellipse([CENTER - 6, CENTER + 12, CENTER + 6, CENTER + 22], fill=(25, 25, 30, 255))

def draw_golden_eagle(img):
    draw = ImageDraw.Draw(img)
    # Broad Wings Spread
    left_wing = [(CENTER, CENTER + 15), (CENTER - 55, CENTER - 10), (CENTER - 60, CENTER - 40), (CENTER - 30, CENTER - 25)]
    draw.polygon(left_wing, fill=(110, 75, 45, 255), outline=(70, 45, 25, 255), width=2)
    right_wing = [(CENTER, CENTER + 15), (CENTER + 55, CENTER - 10), (CENTER + 60, CENTER - 40), (CENTER + 30, CENTER - 25)]
    draw.polygon(right_wing, fill=(110, 75, 45, 255), outline=(70, 45, 25, 255), width=2)
    # Strong Chest
    draw.ellipse([CENTER - 25, CENTER - 10, CENTER + 25, CENTER + 42], fill=(130, 90, 55, 255), outline=(80, 50, 30, 255), width=2)
    # Golden Crown Feathers
    draw.ellipse([CENTER - 22, CENTER - 45, CENTER + 22, CENTER - 8], fill=(215, 175, 60, 255), outline=(150, 110, 30, 255), width=2)
    # Fierce Golden Eyes
    draw.ellipse([CENTER - 16, CENTER - 32, CENTER - 6, CENTER - 22], fill=(255, 225, 40, 255), outline=(160, 120, 20, 255), width=2)
    draw.ellipse([CENTER - 12, CENTER - 29, CENTER - 7, CENTER - 24], fill=(20, 20, 20, 255))
    draw.ellipse([CENTER + 6, CENTER - 32, CENTER + 16, CENTER - 22], fill=(255, 225, 40, 255), outline=(160, 120, 20, 255), width=2)
    draw.ellipse([CENTER + 7, CENTER - 29, CENTER + 12, CENTER - 24], fill=(20, 20, 20, 255))
    # Sharp Hooked Golden Beak
    draw.polygon([(CENTER - 7, CENTER - 24), (CENTER + 7, CENTER - 24), (CENTER, CENTER - 6)], fill=(245, 190, 30, 255), outline=(170, 120, 15, 255), width=2)

def draw_flying_squirrel(img):
    draw = ImageDraw.Draw(img)
    # Gliding Patagium (Wing membrane)
    glide = [
        (CENTER - 55, CENTER - 30),
        (CENTER + 55, CENTER - 30),
        (CENTER + 45, CENTER + 30),
        (CENTER - 45, CENTER + 30),
    ]
    draw.polygon(glide, fill=(200, 150, 110, 255), outline=(130, 90, 60, 255), width=2)
    # Chubby Body
    draw.ellipse([CENTER - 28, CENTER - 20, CENTER + 28, CENTER + 32], fill=(225, 175, 130, 255), outline=(150, 105, 70, 255), width=2)
    # White belly
    draw.ellipse([CENTER - 16, CENTER - 10, CENTER + 16, CENTER + 25], fill=(250, 245, 240, 255))
    # Head & Big Cute Ears
    draw.ellipse([CENTER - 28, CENTER - 46, CENTER + 28, CENTER - 6], fill=(230, 180, 135, 255), outline=(150, 105, 70, 255), width=2)
    draw.ellipse([CENTER - 32, CENTER - 54, CENTER - 16, CENTER - 38], fill=(210, 150, 110, 255))
    draw.ellipse([CENTER + 16, CENTER - 54, CENTER + 32, CENTER - 38], fill=(210, 150, 110, 255))
    # Enormous Glossy Anime Eyes (Night eyes)
    draw.ellipse([CENTER - 24, CENTER - 36, CENTER - 6, CENTER - 16], fill=(20, 15, 25, 255))
    draw.ellipse([CENTER - 20, CENTER - 34, CENTER - 12, CENTER - 26], fill=(255, 255, 255, 255))
    draw.ellipse([CENTER - 12, CENTER - 22, CENTER - 8, CENTER - 18], fill=(255, 255, 255, 200))

    draw.ellipse([CENTER + 6, CENTER - 36, CENTER + 24, CENTER - 16], fill=(20, 15, 25, 255))
    draw.ellipse([CENTER + 10, CENTER - 34, CENTER + 18, CENTER - 26], fill=(255, 255, 255, 255))
    draw.ellipse([CENTER + 18, CENTER - 22, CENTER + 22, CENTER - 18], fill=(255, 255, 255, 200))
    # Pink Button Nose
    draw.ellipse([CENTER - 4, CENTER - 18, CENTER + 4, CENTER - 11], fill=(235, 130, 140, 255))

def draw_mystic_fox(img):
    draw = ImageDraw.Draw(img)
    # Fluffy tail with white tip (curling behind)
    tail = [(CENTER + 15, CENTER + 20), (CENTER + 55, CENTER + 10), (CENTER + 60, CENTER - 20), (CENTER + 35, CENTER - 5)]
    draw.polygon(tail, fill=(235, 115, 45, 255), outline=(160, 65, 20, 255), width=2)
    draw.polygon([(CENTER + 52, CENTER - 8), (CENTER + 60, CENTER - 20), (CENTER + 42, CENTER - 12)], fill=(255, 250, 245, 255))
    # Slender Chest & Body
    draw.ellipse([CENTER - 25, CENTER - 10, CENTER + 25, CENTER + 45], fill=(230, 110, 40, 255), outline=(160, 65, 20, 255), width=2)
    # White Bib / Chest fur
    draw.polygon([(CENTER - 14, CENTER - 5), (CENTER + 14, CENTER - 5), (CENTER, CENTER + 30)], fill=(255, 250, 245, 255))
    # Head & Sharp Triangular Ears
    draw.polygon([(CENTER - 24, CENTER - 20), (CENTER - 38, CENTER - 55), (CENTER - 10, CENTER - 30)], fill=(225, 105, 35, 255), outline=(150, 60, 15, 255), width=2)
    draw.polygon([(CENTER - 28, CENTER - 24), (CENTER - 34, CENTER - 48), (CENTER - 14, CENTER - 32)], fill=(60, 50, 50, 255)) # inner ear

    draw.polygon([(CENTER + 24, CENTER - 20), (CENTER + 38, CENTER - 55), (CENTER + 10, CENTER - 30)], fill=(225, 105, 35, 255), outline=(150, 60, 15, 255), width=2)
    draw.polygon([(CENTER + 28, CENTER - 24), (CENTER + 34, CENTER - 48), (CENTER + 14, CENTER - 32)], fill=(60, 50, 50, 255))

    # Fox Face wedge
    face = [(CENTER - 30, CENTER - 25), (CENTER + 30, CENTER - 25), (CENTER + 18, CENTER + 2), (CENTER, CENTER + 16), (CENTER - 18, CENTER + 2)]
    draw.polygon(face, fill=(235, 115, 45, 255), outline=(160, 65, 20, 255), width=2)
    # White Cheek ruffs
    draw.polygon([(CENTER - 30, CENTER - 20), (CENTER - 12, CENTER + 5), (CENTER, CENTER + 16), (CENTER - 18, CENTER + 2)], fill=(255, 250, 245, 255))
    draw.polygon([(CENTER + 30, CENTER - 20), (CENTER + 12, CENTER + 5), (CENTER, CENTER + 16), (CENTER + 18, CENTER + 2)], fill=(255, 250, 245, 255))
    # Wise Amber Eyes
    draw.ellipse([CENTER - 18, CENTER - 14, CENTER - 7, CENTER - 4], fill=(245, 175, 40, 255), outline=(150, 90, 15, 255), width=1)
    draw.ellipse([CENTER - 14, CENTER - 11, CENTER - 10, CENTER - 6], fill=(30, 20, 20, 255))
    draw.ellipse([CENTER + 7, CENTER - 14, CENTER + 18, CENTER - 4], fill=(245, 175, 40, 255), outline=(150, 90, 15, 255), width=1)
    draw.ellipse([CENTER + 10, CENTER - 11, CENTER + 14, CENTER - 6], fill=(30, 20, 20, 255))
    # Black Nose
    draw.ellipse([CENTER - 4, CENTER + 12, CENTER + 4, CENTER + 18], fill=(30, 25, 25, 255))

def draw_bear(img):
    draw = ImageDraw.Draw(img)
    # Big Bear Torso & Shoulders
    draw.ellipse([CENTER - 52, CENTER - 10, CENTER + 52, CENTER + 45], fill=(120, 80, 50, 255), outline=(70, 45, 25, 255), width=3)
    # White Crescent Moon on Chest (ツキノワ)
    draw.arc([CENTER - 28, CENTER + 10, CENTER + 28, CENTER + 36], start=20, end=160, fill=(255, 250, 235, 255), width=6)
    # Big Head
    draw.ellipse([CENTER - 42, CENTER - 45, CENTER + 42, CENTER + 12], fill=(130, 85, 55, 255), outline=(75, 50, 30, 255), width=2)
    # Round Ears
    draw.ellipse([CENTER - 48, CENTER - 55, CENTER - 22, CENTER - 30], fill=(120, 80, 50, 255), outline=(70, 45, 25, 255), width=2)
    draw.ellipse([CENTER - 42, CENTER - 48, CENTER - 28, CENTER - 36], fill=(180, 130, 95, 255))
    draw.ellipse([CENTER + 22, CENTER - 55, CENTER + 48, CENTER - 30], fill=(120, 80, 50, 255), outline=(70, 45, 25, 255), width=2)
    draw.ellipse([CENTER + 28, CENTER - 48, CENTER + 42, CENTER - 36], fill=(180, 130, 95, 255))
    # Snout
    draw.ellipse([CENTER - 20, CENTER - 16, CENTER + 20, CENTER + 10], fill=(210, 165, 125, 255), outline=(130, 90, 60, 255), width=2)
    # Big Black Nose & Smile
    draw.ellipse([CENTER - 8, CENTER - 14, CENTER + 8, CENTER - 4], fill=(30, 25, 25, 255))
    draw.arc([CENTER - 8, CENTER - 5, CENTER + 8, CENTER + 6], start=20, end=160, fill=(40, 30, 25, 255), width=2)
    # Gentle Warm Eyes
    draw.ellipse([CENTER - 22, CENTER - 26, CENTER - 12, CENTER - 16], fill=(25, 20, 20, 255))
    draw.point((CENTER - 19, CENTER - 24), fill=(255, 255, 255, 255))
    draw.ellipse([CENTER + 12, CENTER - 26, CENTER + 22, CENTER - 16], fill=(25, 20, 20, 255))
    draw.point((CENTER + 15, CENTER - 24), fill=(255, 255, 255, 255))

CREATURES_CONFIG = [
    {
        "filename": "creature_mallard_duck.png",
        "bg_inner": (140, 230, 255, 255),
        "bg_outer": (25, 95, 140, 255),
        "draw_func": draw_duck
    },
    {
        "filename": "creature_sweetfish.png",
        "bg_inner": (130, 240, 240, 255),
        "bg_outer": (20, 90, 110, 255),
        "draw_func": draw_sweetfish
    },
    {
        "filename": "creature_chipmunk.png",
        "bg_inner": (255, 215, 130, 255),
        "bg_outer": (130, 75, 25, 255),
        "draw_func": draw_chipmunk
    },
    {
        "filename": "creature_kingfisher.png",
        "bg_inner": (110, 220, 255, 255),
        "bg_outer": (20, 75, 150, 255),
        "draw_func": draw_kingfisher
    },
    {
        "filename": "creature_owl.png",
        "bg_inner": (150, 160, 240, 255),
        "bg_outer": (35, 30, 80, 255),
        "draw_func": draw_owl
    },
    {
        "filename": "creature_deer.png",
        "bg_inner": (210, 240, 160, 255),
        "bg_outer": (45, 95, 35, 255),
        "draw_func": draw_deer
    },
    {
        "filename": "creature_raccoon.png",
        "bg_inner": (255, 185, 120, 255),
        "bg_outer": (90, 50, 30, 255),
        "draw_func": draw_raccoon
    },
    {
        "filename": "creature_hedgehog.png",
        "bg_inner": (255, 205, 170, 255),
        "bg_outer": (110, 60, 45, 255),
        "draw_func": draw_hedgehog
    },
    {
        "filename": "creature_snow_monkey.png",
        "bg_inner": (245, 170, 160, 255),
        "bg_outer": (115, 45, 45, 255),
        "draw_func": draw_snow_monkey
    },
    {
        "filename": "creature_swan.png",
        "bg_inner": (170, 225, 255, 255),
        "bg_outer": (30, 80, 130, 255),
        "draw_func": draw_swan
    },
    {
        "filename": "creature_badger.png",
        "bg_inner": (215, 215, 225, 255),
        "bg_outer": (65, 65, 75, 255),
        "draw_func": draw_badger
    },
    {
        "filename": "creature_golden_eagle.png",
        "bg_inner": (255, 230, 130, 255),
        "bg_outer": (120, 75, 15, 255),
        "draw_func": draw_golden_eagle
    },
    {
        "filename": "creature_flying_squirrel.png",
        "bg_inner": (160, 150, 245, 255),
        "bg_outer": (40, 30, 85, 255),
        "draw_func": draw_flying_squirrel
    },
    {
        "filename": "creature_mystic_fox.png",
        "bg_inner": (255, 190, 100, 255),
        "bg_outer": (125, 45, 15, 255),
        "draw_func": draw_mystic_fox
    },
    {
        "filename": "creature_bear_family.png",
        "bg_inner": (245, 205, 140, 255),
        "bg_outer": (95, 55, 25, 255),
        "draw_func": draw_bear
    },
]

print("Starting generation of all 15 creatures portraits...")
for cfg in CREATURES_CONFIG:
    img = create_creature_frame(cfg["bg_inner"], cfg["bg_outer"])
    cfg["draw_func"](img)
    img = apply_creature_finish(img)
    out_path = os.path.join(OUTPUT_DIR, cfg["filename"])
    img.save(out_path, format="PNG")
    print(f"Generated: {out_path}")

print("All 15 creature portraits generated successfully!")
