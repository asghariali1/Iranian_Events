import os
import json

#get the directory of the current script
current_dir = os.path.dirname(os.path.abspath(__file__))

#import all json files in the current directory
for filename in os.listdir(current_dir):
    if filename.endswith('.json'):
        filepath = os.path.join(current_dir, filename)
        with open(filepath, 'r', encoding='utf-8') as file:
            data = file.read()
            #replace all occurrences of NaN with null
            data = data.replace('NaN', 'null')
        
        # Parse JSON and remove duplicates based on id field
        try:
            json_data = json.loads(data)
            
            # Check if data is a list
            if isinstance(json_data, list):
                seen_ids = set()
                unique_data = []
                duplicates_removed = 0
                
                for item in json_data:
                    if isinstance(item, dict) and 'id' in item:
                        if item['id'] not in seen_ids:
                            seen_ids.add(item['id'])
                            unique_data.append(item)
                        else:
                            duplicates_removed += 1
                    else:
                        unique_data.append(item)
                
                if duplicates_removed > 0:
                    print(f"Removed {duplicates_removed} duplicate(s) from {filename}")
                    json_data = unique_data
            
            # Write back the cleaned data
            with open(filepath, 'w', encoding='utf-8') as file:
                json.dump(json_data, file, ensure_ascii=False, indent=4)
                
        except json.JSONDecodeError as e:
            print(f"Error parsing {filename}: {e}")
            # If JSON parsing fails, just write the NaN-replaced data
            with open(filepath, 'w', encoding='utf-8') as file:
                file.write(data)

print("Replaced NaN with null and removed duplicates in all JSON files.")

# merger of all json files into a single json file
merged_data = {}
for filename in os.listdir(current_dir):
    if filename.endswith('.json') and filename != 'merged_data.json':
        filepath = os.path.join(current_dir, filename)
        with open(filepath, 'r', encoding='utf-8') as file:
            data = json.load(file)
            merged_data[filename] = data

# Remove duplicates across all categories in merged_data based on id field
seen_ids = set()
total_duplicates_removed = 0

for category, items in merged_data.items():
    if isinstance(items, list):
        unique_items = []
        for item in items:
            if isinstance(item, dict) and 'id' in item:
                if item['id'] not in seen_ids:
                    seen_ids.add(item['id'])
                    unique_items.append(item)
                else:
                    total_duplicates_removed += 1
            else:
                unique_items.append(item)
        merged_data[category] = unique_items

if total_duplicates_removed > 0:
    print(f"Removed {total_duplicates_removed} duplicate(s) across all categories in merged_data")

with open(os.path.join(current_dir, 'merged_data.json'), 'w', encoding='utf-8') as file:
    json.dump(merged_data, file, ensure_ascii=False, indent=4)