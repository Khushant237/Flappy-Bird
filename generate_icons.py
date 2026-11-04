# generate_icons.py - Generate high quality 3D Flappy Bird App Icons
from PIL import Image, ImageDraw
import os, math

def create_icon(size):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    scale = size / 512.0
    center_x = size / 2
    center_y = size / 2

    # 1. Background Rounded Squircle with Vibrant Gradient
    bg_radius = int(110 * scale)
    bg_box = [int(16 * scale), int(16 * scale), int((512 - 16) * scale), int((512 - 16) * scale)]

    # Draw rounded rectangle background with gradient
    for y in range(int(bg_box[1]), int(bg_box[3])):
        progress = (y - bg_box[1]) / (bg_box[3] - bg_box[1])
        r = int(15 + progress * 15)
        g = int(25 + progress * 55)
        b = int(70 + progress * 130)
        draw.line([(bg_box[0], y), (bg_box[2], y)], fill=(r, g, b, 255))

    # Mask to rounded rectangle
    mask = Image.new("L", (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle(bg_box, radius=bg_radius, fill=255)
    
    bg_img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    bg_img.paste(img, (0, 0), mask)
    img = bg_img
    draw = ImageDraw.Draw(img)

    # Glowing subtle border
    draw.rounded_rectangle(bg_box, radius=bg_radius, outline=(0, 229, 255, 180), width=max(1, int(6 * scale)))

    # 2. Clouds in background
    cloud_color = (255, 255, 255, 60)
    draw.ellipse([int(60 * scale), int(340 * scale), int(180 * scale), int(420 * scale)], fill=cloud_color)
    draw.ellipse([int(120 * scale), int(310 * scale), int(260 * scale), int(410 * scale)], fill=cloud_color)
    draw.ellipse([int(300 * scale), int(360 * scale), int(440 * scale), int(450 * scale)], fill=cloud_color)

    # 3. Soft Drop Shadow under Bird
    shadow_box = [int(150 * scale), int(330 * scale), int(370 * scale), int(390 * scale)]
    draw.ellipse(shadow_box, fill=(0, 0, 0, 80))

    # 4. Bird Body (Egg/Oval Golden Gradient)
    body_box = [int(140 * scale), int(160 * scale), int(380 * scale), int(350 * scale)]
    # Shadow layer
    draw.ellipse([body_box[0] + int(4 * scale), body_box[1] + int(8 * scale), body_box[2] + int(4 * scale), body_box[3] + int(8 * scale)], fill=(180, 100, 0, 160))
    # Main body
    draw.ellipse(body_box, fill=(255, 202, 40, 255), outline=(230, 81, 0, 255), width=max(1, int(5 * scale)))

    # Body highlight
    hl_box = [int(180 * scale), int(175 * scale), int(320 * scale), int(230 * scale)]
    draw.ellipse(hl_box, fill=(255, 238, 88, 220))

    # Belly patch
    belly_box = [int(180 * scale), int(240 * scale), int(330 * scale), int(340 * scale)]
    draw.ellipse(belly_box, fill=(255, 253, 231, 240))

    # 5. Beak (Upper and Lower Orange Cones)
    # Upper beak
    u_beak = [(int(340 * scale), int(220 * scale)), (int(440 * scale), int(250 * scale)), (int(340 * scale), int(280 * scale))]
    draw.polygon(u_beak, fill=(255, 109, 0, 255), outline=(191, 54, 12, 255))
    # Upper beak shine
    draw.line([(int(345 * scale), int(230 * scale)), (int(415 * scale), int(250 * scale))], fill=(255, 171, 64, 255), width=max(1, int(3 * scale)))

    # Lower beak
    l_beak = [(int(335 * scale), int(275 * scale)), (int(410 * scale), int(290 * scale)), (int(335 * scale), int(310 * scale))]
    draw.polygon(l_beak, fill=(230, 81, 0, 255), outline=(191, 54, 12, 255))

    # 6. Large Expressive Eye
    eye_box = [int(270 * scale), int(170 * scale), int(350 * scale), int(250 * scale)]
    draw.ellipse(eye_box, fill=(255, 255, 255, 255), outline=(38, 50, 56, 255), width=max(1, int(4 * scale)))

    # Iris (Cyan/Blue)
    iris_box = [int(295 * scale), int(185 * scale), int(345 * scale), int(235 * scale)]
    draw.ellipse(iris_box, fill=(2, 136, 209, 255))

    # Pupil (Dark)
    pupil_box = [int(310 * scale), int(195 * scale), int(342 * scale), int(227 * scale)]
    draw.ellipse(pupil_box, fill=(15, 23, 42, 255))

    # Catchlight (Reflection)
    draw.ellipse([int(300 * scale), int(190 * scale), int(318 * scale), int(208 * scale)], fill=(255, 255, 255, 255))
    draw.ellipse([int(325 * scale), int(215 * scale), int(333 * scale), int(223 * scale)], fill=(255, 255, 255, 220))

    # 7. Flapping Wing
    wing_box = [int(130 * scale), int(220 * scale), int(240 * scale), int(310 * scale)]
    draw.ellipse(wing_box, fill=(255, 238, 88, 255), outline=(230, 81, 0, 255), width=max(1, int(4 * scale)))
    draw.arc([int(150 * scale), int(240 * scale), int(220 * scale), int(290 * scale)], start=30, end=180, fill=(230, 81, 0, 255), width=max(1, int(3 * scale)))

    # 8. Crest Feathers on top
    crest1 = [(int(190 * scale), int(170 * scale)), (int(160 * scale), int(120 * scale)), (int(210 * scale), int(160 * scale))]
    draw.polygon(crest1, fill=(255, 23, 68, 255), outline=(183, 28, 28, 255))
    crest2 = [(int(215 * scale), int(165 * scale)), (int(195 * scale), int(110 * scale)), (int(235 * scale), int(160 * scale))]
    draw.polygon(crest2, fill=(255, 82, 82, 255), outline=(183, 28, 28, 255))

    return img

densities = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
}

base_res = '/home/khushant/Flappy Bird/android/app/src/main/res'
for folder, px in densities.items():
    dir_path = os.path.join(base_res, folder)
    os.makedirs(dir_path, exist_ok=True)
    icon = create_icon(px)
    icon.save(os.path.join(dir_path, 'ic_launcher.png'), 'PNG')
    icon.save(os.path.join(dir_path, 'ic_launcher_round.png'), 'PNG')
    print(f"Generated {folder}/ic_launcher.png ({px}x{px})")

# Also 512x512 hi-res icon for store/dist
hi_res = create_icon(512)
hi_res.save('/home/khushant/Flappy Bird/android/app/src/main/ic_launcher-playstore.png', 'PNG')
print("Generated 512x512 playstore icon")
