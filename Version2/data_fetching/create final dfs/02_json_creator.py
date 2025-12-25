import os
import pandas as pd
import json
# The current script's directory
script_dir = os.path.dirname(os.path.abspath(__file__))

#import all csv files in final data folder and create a json file for each
csv_files = [f for f in os.listdir(os.path.join(script_dir, "./final data/")) if f.endswith(".csv")]
for file in csv_files:
    df = pd.read_csv(os.path.join(script_dir, "./final data/", file))
    json_data = df.to_dict(orient='records')
    json_file_name = file.replace('.csv', '.json')
    with open(os.path.join(script_dir, "./final data/jsons", json_file_name), 'w', encoding='utf-8') as json_file:
        json.dump(json_data, json_file, ensure_ascii=False, indent=4)
    print(f"Created JSON file: {json_file_name} with {len(json_data)} records")

#merge all csv files into a single dataframe and create a final json file
merged_df = pd.DataFrame()
for file in csv_files:
    df = pd.read_csv(os.path.join(script_dir, "./final data/", file))
    merged_df = pd.concat([merged_df, df], ignore_index=True)
final_json_data = merged_df.to_dict(orient='records')
with open(os.path.join(script_dir, "./final data/jsons/final_data.json"), 'w', encoding='utf-8') as final_json_file:
    json.dump(final_json_data, final_json_file, ensure_ascii=False, indent=4)
print(f"Created final JSON file: final_data.json with {len(final_json_data)} records")