import os
import pandas as pd
# The current script's directory
script_dir = os.path.dirname(os.path.abspath(__file__))

#import the main df 
file_path = os.path.join(script_dir, "./raw data/df.csv")

#Categories to seperate
categories = ['Crime/Safety', 'Economy', 'Health', 'Natural Disaster', 'Politics', 'Social', 'Sports/Entertainment', 'Technology/Science', 'Death']

# Read the main dataframe
data = pd.read_csv(file_path)

#remove all rows with date after 2025 in date_gegregorian column
data = data[pd.to_datetime(data['date_gregorian'], errors='coerce') <= pd.to_datetime('2025-12-31', errors='coerce')]


#create empty lists for each category to collect rows
category_rows = {category: [] for category in categories}
# Iterate through the main dataframe and collect rows for respective categories

for i in range(len(data)):
    # check if each category value is 1 in the row
    for category in categories:
        if category in data.columns and data.at[i, category] == 1:
            category_rows[category].append(data.iloc[i])

# Create dataframes from collected rows
category_dfs = {category: pd.DataFrame(rows) for category, rows in category_rows.items()}
# Save each category dataframe to a separate CSV file
for category, df in category_dfs.items():
    output_file_path = os.path.join(script_dir, f"./final data/{category.replace('/', '_')}_data.csv")
    df.to_csv(output_file_path, index=False, encoding='utf-8-sig')
    print(f"Saved {len(df)} rows to {output_file_path}")
