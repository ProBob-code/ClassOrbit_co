from PIL import Image, ImageDraw

def crop_to_circle(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    
    # Create an alpha mask
    mask = Image.new("L", img.size, 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, img.size[0], img.size[1]), fill=255)
    
    # Put the mask into the alpha channel
    result = img.copy()
    result.putalpha(mask)
    
    result.save(output_path)
    print("Cropped successfully to a circle")

if __name__ == "__main__":
    crop_to_circle("public/raw_logo.png", "public/logo_transparent.png")
