import pandas as pd
import os
import json
import numpy as np

script_dir = os.path.dirname(os.path.abspath(__file__))



# Concatenate both DataFrames
combined_df = pd.read_csv(os.path.join(script_dir, "combined_data_with_importance_scores.csv"))
combined_df = combined_df.sort_values(by=['year', 'month', 'day'])

# Replace NaN with empty string for all columns
combined_df = combined_df.replace({np.nan: ""})


# Build the list of dicts in the desired format
output_list = []
for _, row in combined_df.iterrows():
    output_list.append({
        "date": f'{row["year"]:04d}-{row["month"]:02d}-{row["day"]:02d}',
        "title": row.get("title", row.get("name", "")),
        "description": row.get("description", row.get("bio", "")),
        "category": row.get("category", row["type"]),
        "link": row.get("link", ""),
        "importance_score": row.get("importance_score", 0)

    })

# Save as JSON file
with open(os.path.join(script_dir, "combined_data.json"), "w", encoding="utf-8") as f:
    json.dump(output_list, f, ensure_ascii=False, indent=4)

print("Combined JSON file created: combined_data.json")