import json
import os
import re
from datetime import datetime
import requests

JIIKU_URL = "https://raw.githubusercontent.com/Jiiku831/Jiiku831.github.io/refs/heads/main/data/sekarun_current.json"
SEKARUN_JS_URL = "https://raw.githubusercontent.com/Jiiku831/Jiiku831.github.io/refs/heads/main/data/sekarun.js"

LOCAL_SAVE_DIR = "./data"
LOCAL_FILE_PATH = os.path.join(LOCAL_SAVE_DIR, "ranking.json")

def process_ranking_data():
    print("Processing data...")
    
    try:
        response = requests.get(JIIKU_URL)
        response.raise_for_status()
        full_data = response.json()
        
        jiiku_data = full_data.get('lines', {})
        target_ranks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 100, 200, 300, 400, 500, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 10000]
        
        result_lines = []
        current_timestamp = 0
        end_timestamp = 0
        
        for rank in target_ranks:
            rank_str = str(rank)
            if rank_str in jiiku_data:
                entries = jiiku_data[rank_str]['entries']
                
                curr_score = 0
                pred_score = 0
                
                last_r = None
                last_p = None
                
                for entry in entries:
                    ts = entry['timestamp']
                    ep = entry['ep']
                    etype = entry['entry_type']
                    
                    if etype == 'r':
                        last_r = entry
                    else:
                        last_p = entry
                
                if last_r:
                    curr_score = last_r['ep']
                    if last_r['timestamp'] > current_timestamp:
                        current_timestamp = last_r['timestamp']
                
                if last_p:
                    pred_score = last_p['ep']
                    if last_p['timestamp'] > end_timestamp:
                        end_timestamp = last_p['timestamp']
                
                result_lines.append({
                    "rank": rank,
                    "current": curr_score,
                    "predicted": pred_score
                })
        
        output_data = {
            "updatedAt": int(current_timestamp * 1000) if current_timestamp > 0 else 0,
            "endsAt": int(end_timestamp * 1000) if end_timestamp > 0 else 0,
            "data": sorted(result_lines, key=lambda x: x['rank'])
        }

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
                            
                            check_time = current_timestamp if current_timestamp > 0 else datetime.now().timestamp()
                            started_events = [e for e in events_info.values() if e.get('start', float('inf')) <= check_time]
                            
                            if started_events:
                                target_event = sorted(started_events, key=lambda x: x['start'])[-1]
                                output_data["event_info"] = {
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
            print(f"Error processing events: {e}")
        
        return output_data

    except Exception as e:
        print(f"Error: {e}")
        return None


def main():
    print("Script started.")
    
    data = process_ranking_data() # No config needed

    if data is None:
        return

    try:
         os.makedirs(LOCAL_SAVE_DIR, exist_ok=True)
         with open(LOCAL_FILE_PATH, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
         print(f"Saved to {LOCAL_FILE_PATH}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()