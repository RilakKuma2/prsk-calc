import requests
import re
import os

# Configuration
# Assuming script is run from prsk-calc directory
SONGS_JS_PATH = 'src/utils/songs.js'
API_URL = 'https://api.rilaksekai.com/api/songs'

def fetch_song_data():
    print(f"Fetching data from {API_URL}...")
    try:
        response = requests.get(API_URL)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching data: {e}")
        return []

def create_id_map(data):
    id_map = {}
    for song in data:
        # Check if id exists
        if 'id' not in song:
            continue
            
        try:
            # Convert ID to integer to match songs.js format (e.g., "003" -> 3)
            song_id = int(song['id'])
        except ValueError:
            continue
            
        entry = {}
        # Only add if values exist
        if 'title_ko' in song and song['title_ko']:
             entry['name'] = song['title_ko']
        if 'title_hi' in song and song['title_hi']:
            entry['title_hi'] = song['title_hi']
        if 'title_hangul' in song and song['title_hangul']:
            entry['title_hangul'] = song['title_hangul']
            
        if entry:
            id_map[song_id] = entry
            
    return id_map

def update_songs_js(id_map):
    print(f"Updating {SONGS_JS_PATH}...")
    
    if not os.path.exists(SONGS_JS_PATH):
        print(f"File not found: {SONGS_JS_PATH}")
        print(f"Current working directory: {os.getcwd()}")
        return

    with open(SONGS_JS_PATH, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    new_lines = []
    # Regex to capture id
    # Matches: { id: 3, ...
    row_pattern = re.compile(r"^\s*\{\s*id:\s*(\d+)\s*,.*")
    
    updated_count = 0
    name_updated_count = 0
    
    for line in lines:
        match = row_pattern.match(line)
        if match:
            song_id = int(match.group(1))
            if song_id in id_map:
                updates = id_map[song_id]
                new_line = line
                
                # 1. Overwrite name if title_ko exists
                if 'name' in updates and updates['name']:
                    new_name = updates['name'].replace("'", "\\'")
                    # Regex to find name: '...' inside the object
                    # We look for name: followed by a quoted string. 
                    if re.search(r"name:\s*'[^']*'", new_line):
                        new_line = re.sub(r"name:\s*'[^']*'", f"name: '{new_name}'", new_line)
                        name_updated_count += 1
                
                # 2. Add title_hi / title_hangul if missing
                # Check if fields already exist to avoid duplication
                # We do NOT append if they already exist.
                
                insertion = ""
                has_hi = "title_hi:" in new_line
                has_hangul = "title_hangul:" in new_line
                
                if 'title_hi' in updates and updates['title_hi'] and not has_hi:
                    val = updates['title_hi'].replace("'", "\\'")
                    insertion += f", title_hi: '{val}'"
                
                if 'title_hangul' in updates and updates['title_hangul'] and not has_hangul:
                    val = updates['title_hangul'].replace("'", "\\'")
                    insertion += f", title_hangul: '{val}'"
                
                if insertion:
                    # Insert before the last closing brace
                    last_brace_idx = new_line.rfind('}')
                    if last_brace_idx != -1:
                        new_line = new_line[:last_brace_idx] + insertion + new_line[last_brace_idx:]
                        updated_count += 1
                
                new_lines.append(new_line)
            else:
                new_lines.append(line)
        else:
            new_lines.append(line)
            
    with open(SONGS_JS_PATH, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
        
    print(f"Updated additional fields for {updated_count} songs.")
    print(f"Overwrote names for {name_updated_count} songs.")

if __name__ == "__main__":
    data = fetch_song_data()
    if data:
        id_map = create_id_map(data)
        print(f"Mapped {len(id_map)} songs from API.")
        update_songs_js(id_map)
