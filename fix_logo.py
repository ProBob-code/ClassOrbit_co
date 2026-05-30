from PIL import Image, ImageDraw

def process_logo(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    
    # Crop to a square based on the height
    width, height = img.size
    size = min(width, height)
    
    left = (width - size) // 2
    top = (height - size) // 2
    right = left + size
    bottom = top + size
    
    img_cropped = img.crop((left, top, right, bottom))
    
    # Create circular mask
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    # The logo circle might not touch the absolute edges, but let's assume it does
    draw.ellipse((0, 0, size, size), fill=255)
    
    result = img_cropped.copy()
    result.putalpha(mask)
    
    result.save(output_path)
    print("Fixed logo successfully")

if __name__ == "__main__":
    process_logo("public/raw_logo.png", "public/logo_transparent.png")
