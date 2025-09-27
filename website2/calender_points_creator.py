# get the script path
import os   
script_dir = os.path.dirname(os.path.abspath(__file__))

#import the Eras csv file
import pandas as pd
eras = pd.read_csv(os.path.join(script_dir, 'assets/data/Eras.csv'))

# get the list of eras with the start and end dates
eras_list = []
for index, row in eras.iterrows():
    eras_list.append((row['Era_English'], row['Year_start'], row['Year_End']))

print(eras_list)

import datetime
def generate_daily_dates_for_year(year_input):
            # Prompt the user for a year and convert it to an integer
    year = int(year_input)
    # 1. Define the start and end dates
        # Start date: January 1st of the specified year
    start_date = datetime.date(year, 1, 1)
    end_date = datetime.date(year + 1, 1, 1)
    
    current_date = start_date
    one_day = datetime.timedelta(days=1)
    
    daily_dates = []

    # 3. Loop through all days until we hit the start of the next year
    while current_date < end_date:    
        # A simpler, more robust way to get YYYY/M/D format:
        date_string = f"{current_date.year}/{current_date.month}/{current_date.day}"
        daily_dates.append(date_string)
        # Move to the next day
        current_date += one_day
    # 4. Return the list of dates (removed verbose printing)
    return daily_dates
'''
for era in eras_list:
    era_name = era[0]
    start_year = era[1]
    end_year = era[2]
    all_dates = []
    for year in range(start_year, end_year + 1):
        daily_dates = generate_daily_dates_for_year(year)
        all_dates.extend(daily_dates)
    
    # save the dates to a csv file
    df = pd.DataFrame(all_dates, columns=['Date'])
    df.to_csv(os.path.join(script_dir, f'assets/data/{era_name}_dates.csv'), index=False)
'''

# Generate all dates for all eras
print("Generating calendar dates for all eras...")
all_dates = []
total_years = sum(era[2] - era[1] + 1 for era in eras_list)
processed_years = 0

for era in eras_list:
    era_name = era[0]
    start_year = era[1]
    end_year = era[2]
    print(f"Processing era: {era_name} ({start_year}-{end_year})")
    
    for year in range(start_year, end_year + 1):
        daily_dates = generate_daily_dates_for_year(year)
        all_dates.extend(daily_dates)
        processed_years += 1
        
        # Show progress every 50 years
        if processed_years % 50 == 0:
            progress = (processed_years / total_years) * 100
            print(f"Progress: {processed_years}/{total_years} years ({progress:.1f}%)")

print(f"\nGenerated {len(all_dates)} total dates")

# Save all the dates to CSV and JSON files
print("Saving to CSV...")
df = pd.DataFrame(all_dates, columns=['Date'])
df.to_csv(os.path.join(script_dir, 'assets/data/all_dates.csv'), index=False)

# Save as properly formatted JSON
print("Saving to JSON...")
import json

# Convert DataFrame to list of dictionaries
dates_list = df.to_dict('records')

# Save as properly formatted JSON
with open(os.path.join(script_dir, 'assets/data/all_dates.json'), 'w') as f:
    json.dump(dates_list, f, indent=2, ensure_ascii=False)

print("Calendar generation complete!")
print(f"Files saved:")
print(f"  - CSV: {os.path.join(script_dir, 'assets/data/all_dates.csv')}")
print(f"  - JSON: {os.path.join(script_dir, 'assets/data/all_dates.json')}")
print(f"Total dates generated: {len(all_dates)}")