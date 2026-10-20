import os
from PIL import Image, ImageDraw

LOGO_PATH = r"C:\Users\amang\.gemini\antigravity\brain\07d56f6b-9a29-4f6b-af05-798547704142\.user_uploaded\media_1792479565650_1dc96ebe.png"
SPLASH_SRC_PATH = r"C:\Users\amang\.gemini\antigravity\brain\07d56f6b-9a29-4f6b-af05-798547704142\ag_splash_screen_png_1792479876283.jpg"
RES_DIR = r"C:\Users\amang\Desktop\guitar-tuner\android\app\src\main\res"
PUBLIC_DIR = r"C:\Users\amang\Desktop\guitar-tuner\public"

def generate_icons():
    print("Generating Clean White Studio App Icons...")
    logo = Image.open(LOGO_PATH).convert("RGBA")
    
    # 1. Trim bounding box if there's whitespace to ensure perfect centering
    # Since background is white, find where pixels are not white
    # Or just use the logo directly if it's already tight
    # Let's inspect alpha / color
    
    # Standard Mipmap Densities
    MIPMAP_SIZES = {
        "mipmap-mdpi": (48, 108),
        "mipmap-hdpi": (72, 162),
        "mipmap-xhdpi": (96, 216),
        "mipmap-xxhdpi": (144, 324),
        "mipmap-xxxhdpi": (192, 432),
    }
    
    for folder, (square_size, fg_size) in MIPMAP_SIZES.items():
        target_dir = os.path.join(RES_DIR, folder)
        os.makedirs(target_dir, exist_ok=True)
        
        # 1. ic_launcher.png (Square / Squircle with white background)
        square_img = Image.new("RGBA", (square_size, square_size), (255, 255, 255, 255))
        # Scale logo to ~76% of canvas
        inner_w = int(square_size * 0.78)
        inner_h = int(square_size * 0.78)
        scaled_logo = logo.resize((inner_w, inner_h), Image.Resampling.LANCZOS)
        offset_x = (square_size - inner_w) // 2
        offset_y = (square_size - inner_h) // 2
        square_img.paste(scaled_logo, (offset_x, offset_y), scaled_logo)
        square_img.save(os.path.join(target_dir, "ic_launcher.png"), "PNG")
        
        # 2. ic_launcher_round.png (Circular with white background)
        round_img = Image.new("RGBA", (square_size, square_size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(round_img)
        draw.ellipse([(0, 0), (square_size - 1, square_size - 1)], fill=(255, 255, 255, 255))
        # Inner logo inside circle ~70%
        round_w = int(square_size * 0.72)
        round_h = int(square_size * 0.72)
        scaled_round_logo = logo.resize((round_w, round_h), Image.Resampling.LANCZOS)
        r_offset_x = (square_size - round_w) // 2
        r_offset_y = (square_size - round_h) // 2
        round_img.paste(scaled_round_logo, (r_offset_x, r_offset_y), scaled_round_logo)
        round_img.save(os.path.join(target_dir, "ic_launcher_round.png"), "PNG")
        
        # 3. ic_launcher_foreground.png (Transparent background, centered in 108dp canvas)
        # Android adaptive icon viewport is the inner 66% (72dp out of 108dp)
        fg_img = Image.new("RGBA", (fg_size, fg_size), (0, 0, 0, 0))
        fg_logo_size = int(fg_size * 0.58)
        scaled_fg_logo = logo.resize((fg_logo_size, fg_logo_size), Image.Resampling.LANCZOS)
        fg_offset_x = (fg_size - fg_logo_size) // 2
        fg_offset_y = (fg_size - fg_logo_size) // 2
        fg_img.paste(scaled_fg_logo, (fg_offset_x, fg_offset_y), scaled_fg_logo)
        fg_img.save(os.path.join(target_dir, "ic_launcher_foreground.png"), "PNG")
        
    # Public web icons
    # icon-192.png
    web_192 = Image.new("RGBA", (192, 192), (255, 255, 255, 255))
    s192 = logo.resize((150, 150), Image.Resampling.LANCZOS)
    web_192.paste(s192, (21, 21), s192)
    web_192.save(os.path.join(PUBLIC_DIR, "icon-192.png"), "PNG")
    
    # icon-512.png
    web_512 = Image.new("RGBA", (512, 512), (255, 255, 255, 255))
    s512 = logo.resize((400, 400), Image.Resampling.LANCZOS)
    web_512.paste(s512, (56, 56), s512)
    web_512.save(os.path.join(PUBLIC_DIR, "icon-512.png"), "PNG")
    print("App Icons generated successfully!")

def generate_splash():
    print("Generating Clean White Splash Screens...")
    src_splash = Image.open(SPLASH_SRC_PATH).convert("RGB")
    
    # Portrait sizes (width, height)
    PORTRAIT_SIZES = {
        "drawable": (1280, 1920),
        "drawable-port-mdpi": (320, 480),
        "drawable-port-hdpi": (480, 800),
        "drawable-port-xhdpi": (720, 1280),
        "drawable-port-xxhdpi": (960, 1600),
        "drawable-port-xxxhdpi": (1280, 1920),
    }
    
    for folder, (target_w, target_h) in PORTRAIT_SIZES.items():
        target_dir = os.path.join(RES_DIR, folder)
        os.makedirs(target_dir, exist_ok=True)
        out_img = Image.new("RGB", (target_w, target_h), (255, 255, 255))
        
        # Scale source maintaining aspect ratio to fit inside canvas with padding
        scale = min(target_w / src_splash.width, target_h / src_splash.height)
        new_w = int(src_splash.width * scale)
        new_h = int(src_splash.height * scale)
        scaled_splash = src_splash.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        pos_x = (target_w - new_w) // 2
        pos_y = (target_h - new_h) // 2
        out_img.paste(scaled_splash, (pos_x, pos_y))
        out_img.save(os.path.join(target_dir, "splash.png"), "PNG")
        
    # Landscape sizes (width, height)
    LAND_SIZES = {
        "drawable-land-mdpi": (480, 320),
        "drawable-land-hdpi": (800, 480),
        "drawable-land-xhdpi": (1280, 720),
        "drawable-land-xxhdpi": (1600, 960),
        "drawable-land-xxxhdpi": (1920, 1280),
    }
    for folder, (target_w, target_h) in LAND_SIZES.items():
        target_dir = os.path.join(RES_DIR, folder)
        os.makedirs(target_dir, exist_ok=True)
        out_img = Image.new("RGB", (target_w, target_h), (255, 255, 255))
        
        # Scale source to fit height
        scale = (target_h * 0.95) / src_splash.height
        new_w = int(src_splash.width * scale)
        new_h = int(src_splash.height * scale)
        scaled_splash = src_splash.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        pos_x = (target_w - new_w) // 2
        pos_y = (target_h - new_h) // 2
        out_img.paste(scaled_splash, (pos_x, pos_y))
        out_img.save(os.path.join(target_dir, "splash.png"), "PNG")
    
    print("Splash screens generated successfully!")

if __name__ == "__main__":
    generate_icons()
    generate_splash()
