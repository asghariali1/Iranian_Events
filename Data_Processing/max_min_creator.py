# get the directory of the script
import os
import pandas as pd
import json
from collections import defaultdict

script_dir = os.path.dirname(os.path.abspath(__file__))

# load the data
data = pd.read_csv(script_dir + "/data/merged_df.csv")
print("Data loaded successfully. Shape:", data.shape)
print(data.head())

# import the eras csv file
eras_df = pd.read_csv(script_dir + "/data/eras.csv")
print("\nEras data:")
print(eras_df)

# Create a dictionary to store min/max events for each decade in each era
decade_events = defaultdict(lambda: defaultdict(dict))

# Process each era
for index, era_row in eras_df.iterrows():
    era_english = era_row['Era_English']
    era_persian = era_row['Era_Persian']
    start_year = era_row['Year_Start']
    end_year = era_row['Year_End']
    
    print(f"\nProcessing era: {era_english} ({start_year}-{end_year})")
    
    # Filter data for this era using Persian era name
    era_data = data[data['era_english'] == era_persian].copy()
    
    if era_data.empty:
        print(f"No data found for era: {era_english}")
        continue
    
    # Convert year to numeric, handling any non-numeric values
    era_data['year_numeric'] = pd.to_numeric(era_data['year_gregorian'], errors='coerce')
    era_data = era_data.dropna(subset=['year_numeric'])
    
    # Sort by year
    era_data = era_data.sort_values('year_numeric')
    
    # Group by decades
    era_data['era'] = (era_data['year_numeric'] // 10) * 10
    
    # Find min and max for each decade
    for decade, decade_data in era_data.groupby('decade'):
        decade_key = f"{int(decade)}s"
        
        # Get the earliest event (min)
        min_event = decade_data.iloc[0]
        
        # Get the latest event (max)
        max_event = decade_data.iloc[-1]
        
        # Helper function to handle NaN values
        def clean_value(value):
            if pd.isna(value):
                return ''
            return str(value) if value is not None else ''
        
        decade_events[era_english][decade_key] = {
            'min': {
                'year': int(min_event['year_numeric']),
                'date': clean_value(min_event.get('date', '')),
                'title': clean_value(min_event.get('title', '')),
                'title_english': clean_value(min_event.get('title_english', '')),
                'type': clean_value(min_event.get('type', '')),
                'details': clean_value(min_event.get('details', '')),
                'details_english': clean_value(min_event.get('details_english', '')),
                'link': clean_value(min_event.get('link', '')),
                'link_english': clean_value(min_event.get('link_english', ''))
            },
            'max': {
                'year': int(max_event['year_numeric']),
                'date': clean_value(max_event.get('date', '')),
                'title': clean_value(max_event.get('title', '')),
                'title_english': clean_value(max_event.get('title_english', '')),
                'type': clean_value(max_event.get('type', '')),
                'details': clean_value(max_event.get('details', '')),
                'details_english': clean_value(max_event.get('details_english', '')),
                'link': clean_value(max_event.get('link', '')),
                'link_english': clean_value(max_event.get('link_english', ''))
            }
        }
        
        print(f"  Decade {decade_key}: {len(decade_data)} events, from {int(min_event['year_numeric'])} to {int(max_event['year_numeric'])}")

# Convert defaultdict to regular dict for JSON serialization
result = {era: dict(decades) for era, decades in decade_events.items()}

# Save to JSON file
output_file = script_dir + "/data/era_decade_min_max.json"
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print(f"\nResults saved to: {output_file}")
print(f"Total eras processed: {len(result)}")

# Print summary
for era, decades in result.items():
    print(f"\n{era}: {len(decades)} decades")
    for decade, events in decades.items():
        print(f"  {decade}: {events['min']['year']} - {events['max']['year']}")
