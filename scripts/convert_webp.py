
import os
from PIL import Image

def convert_to_webp():
    base_dir = '/Users/kuma/Documents/scripts/프로세카계산기/얼굴/converted'
    # We will save webp files in the same directory or a sub directory? 
    # Let's save in the same directory for direct usage, or maybe 'final' ? 
    # User said "converted 내 파일들을... 변환해줘". 
    # I'll output to a 'webp' subdir to avoid clutter, then user can move if needed.
    output_dir = os.path.join(base_dir, 'webp')
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    files = [f for f in os.listdir(base_dir) if f.lower().endswith('.png')]
    
    count = 0
    for filename in files:
        file_path = os.path.join(base_dir, filename)
        try:
            img = Image.open(file_path)
            
            # Resize to 250x250
            img = img.resize((250, 250), Image.Resampling.LANCZOS)
            
            # Save as WebP
            name_without_ext = os.path.splitext(filename)[0]
            save_path = os.path.join(output_dir, f"{name_without_ext}.webp")
            
            img.save(save_path, "WEBP", quality=85)
            print(f"Processed {filename} -> {save_path}")
            count += 1
            
        except Exception as e:
            print(f"Failed to process {filename}: {e}")

    print(f"Finished converting {count} images to WebP.")

if __name__ == "__main__":
    convert_to_webp()
