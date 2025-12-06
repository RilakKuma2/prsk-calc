
import os
from PIL import Image

def convert_images():
    base_dir = '/Users/kuma/Documents/scripts/프로세카계산기/얼굴'
    output_dir = os.path.join(base_dir, 'converted')
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    files = [f for f in os.listdir(base_dir) if f.lower().endswith(('.jpg', '.jpeg'))]
    
    # Threshold for "white". 
    # JPG compression often makes pure white (255,255,255) into (254,255,253) etc.
    # We will treat anything above 240 as white.
    THRESHOLD = 240

    count = 0
    for filename in files:
        file_path = os.path.join(base_dir, filename)
        try:
            img = Image.open(file_path)
            img = img.convert("RGBA")
            
            datas = img.getdata()
            
            newData = []
            for item in datas:
                # check if pixel is "white"
                if item[0] >= THRESHOLD and item[1] >= THRESHOLD and item[2] >= THRESHOLD:
                    newData.append((255, 255, 255, 0)) # Transparent
                else:
                    newData.append(item)
            
            img.putdata(newData)
            
            # Save as PNG
            name_without_ext = os.path.splitext(filename)[0]
            save_path = os.path.join(output_dir, f"{name_without_ext}.png")
            img.save(save_path, "PNG")
            print(f"Converted {filename} -> {save_path}")
            count += 1
            
        except Exception as e:
            print(f"Failed to process {filename}: {e}")

    print(f"Finished processing {count} images.")

if __name__ == "__main__":
    convert_images()
