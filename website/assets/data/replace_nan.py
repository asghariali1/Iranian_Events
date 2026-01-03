import os

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
        with open(filepath, 'w', encoding='utf-8') as file:
            file.write(data)

print("Replaced NaN with null in all JSON files.")

# merger of all json files into a single json file
import json
merged_data = {}
for filename in os.listdir(current_dir):
    if filename.endswith('.json'):
        filepath = os.path.join(current_dir, filename)
        with open(filepath, 'r', encoding='utf-8') as file:
            data = json.load(file)
            merged_data[filename] = data
with open(os.path.join(current_dir, 'merged_data.json'), 'w', encoding='utf-8') as file:
    json.dump(merged_data, file, ensure_ascii=False, indent=4)