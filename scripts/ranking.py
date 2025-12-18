import json
import os
import re
from datetime import datetime
import requests

# === URLs ===
JIIKU_URL = "https://raw.githubusercontent.com/Jiiku831/Jiiku831.github.io/refs/heads/main/data/sekarun_current.json"
SEKARUN_JS_URL = "https://raw.githubusercontent.com/Jiiku831/Jiiku831.github.io/refs/heads/main/data/sekarun.js"

# === Output Path ===
# Save to ../public/ranking.json relative to this script
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "../public")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "ranking.json")

def process_ranking_data():
    print("Fetching and processing data...")
    
    try:
        # 1. Fetch Event Info
        event_info = None
        try:
            with requests.get(SEKARUN_JS_URL, stream=True) as r:
                r.raise_for_status()
                partial_content = ""
                for chunk in r.iter_content(chunk_size=8192):
                    partial_content += chunk.decode('utf-8', errors='ignore')
                    if "};" in partial_content:
                        match = re.search(r'events\s*=\s*(\{.*?\});', partial_content, re.DOTALL)
                        if match:
                            events_info = json.loads(match.group(1))
                            # Check active event
                            now_ts = datetime.now().timestamp()
                            started_events = [e for e in events_info.values() if e.get('start', float('inf')) <= now_ts]
                            
                            if started_events:
                                target_event = sorted(started_events, key=lambda x: x['start'])[-1]
                                event_info = {
                                    "id": next((k for k, v in events_info.items() if v == target_event), None),
                                    "event_type": target_event.get("event_type"),
                                    "name": target_event.get("name"),
                                    "start": target_event.get("start"),
                                    "end": target_event.get("end"),
                                    "len": target_event.get("len")
                                }
                            break 
                    if len(partial_content) > 1024 * 1024: 
                        break
        except Exception as e:
            print(f"[Error] Failed to fetch event info: {e}")

        if not event_info:
            print("[Error] Could not find active event.")
            return None

        # 2. Fetch Ranking Data
        response = requests.get(JIIKU_URL)
        response.raise_for_status()
        full_data = response.json()
        
        jiiku_data = full_data.get('lines', {})
        target_ranks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 100, 200, 300, 400, 500, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 10000]
        
        graph_data = [] # For graph (series)
        table_data = [] # For table (current/predicted summary)

        for rank in target_ranks:
            rank_str = str(rank)
            if rank_str in jiiku_data:
                entries = jiiku_data[rank_str]['entries']
                
                # Sort by timestamp
                entries.sort(key=lambda x: x['timestamp'])
                
                # Logic for GRAPH (All points)
                points = []
                for entry in entries:
                    points.append({
                        "ts": entry['timestamp'],
                        "ep": entry['ep'],
                        "type": entry.get('entry_type', 'r'),
                        "l": entry.get('ep_lb'), # Lower bound
                        "u": entry.get('ep_ub')  # Upper bound
                    })
                
                graph_data.append({
                    "rank": rank,
                    "points": points
                })

                # Logic for TABLE (Summary: Current Real & Last Predicted)
                curr_score = 0
                pred_score = 0
                
                last_r = None
                last_p = None

                for entry in entries:
                    etype = entry.get('entry_type')
                    if etype == 'r':
                        last_r = entry
                    else:
                         last_p = entry
                
                if last_r:
                    curr_score = last_r['ep']
                
                if last_p:
                    pred_score = last_p['ep']

                table_data.append({
                    "rank": rank,
                    "current": curr_score,
                    "predicted": pred_score
                })
        
        output_data = {
            "updatedAt": int(datetime.now().timestamp() * 1000),
            "endsAt": event_info.get("end", 0) * 1000,
            "event_info": event_info,
            "data": table_data,
            "ranks": graph_data
        }
        
        return output_data

    except Exception as e:
        print(f"Error processing data: {e}")
        return None

def main():
    print("Starting ranking data update...")
    
    data = process_ranking_data()

    if data is None:
        print("Failed to generate data.")
        return

    try:
        if not os.path.exists(OUTPUT_DIR):
            os.makedirs(OUTPUT_DIR)
            
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"✅ Success! Ranking data saved to: {OUTPUT_FILE}")

    except Exception as e:
        print(f"Error saving file: {e}")

if __name__ == "__main__":
    main()