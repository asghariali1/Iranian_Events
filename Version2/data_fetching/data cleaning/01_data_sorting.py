import os
#  get the current script directory
script_dir = os.path.dirname(os.path.abspath(__file__))

import pandas as pd

#import the initial data
file_path = os.path.join(script_dir, "./final data/merged_df.csv")
data = pd.read_csv(file_path)

# set the starting year treshold
starting_year_threshold = 1200

# filter the data based on the starting year threshold
filtered_data = data[data['year'] >= starting_year_threshold].copy()

# Create a string representation of the Jalali date (YYYY-MM-DD format)
filtered_data['date_jalali'] = (
    filtered_data['year'].astype(str) + '-' + 
    filtered_data['month'].astype(str).str.zfill(2) + '-' + 
    filtered_data['day'].astype(str).str.zfill(2)
)

# merge date columns to create a full date in gregorian calendar
# Only convert Gregorian dates to datetime objects
try:
    filtered_data['date_gregorian'] = pd.to_datetime(
        filtered_data[['year_gregorian', 'month_gregorian', 'day_gregorian']],
        errors='coerce'  # Convert invalid dates to NaT (Not a Time)
    )
except:
    # Fallback: create string representation if datetime conversion fails
    filtered_data['date_gregorian'] = (
        filtered_data['year_gregorian'].astype(str) + '-' + 
        filtered_data['month_gregorian'].astype(str).str.zfill(2) + '-' + 
        filtered_data['day_gregorian'].astype(str).str.zfill(2)
    )

#rename links column to persian_wiki_links
filtered_data = filtered_data.rename(columns={'link': 'persian_wiki_links'})

#rename link_english column to english_wiki_links
filtered_data = filtered_data.rename(columns={'link_english': 'english_wiki_links'})

#rename type column to category
filtered_data = filtered_data.rename(columns={'type': 'category'})

# columns to keep
columns_to_keep = ['date_jalali','date_gregorian','title','title_english','category','persian_wiki_links','english_wiki_links','details','era_persian','era_english']

# create a new dataframe with the selected columns
cleaned_data = filtered_data[columns_to_keep]

# save the cleaned data to a new CSV file
output_file_path = os.path.join(script_dir, "./final data/cleaned_data.csv")
cleaned_data.to_csv(output_file_path, index=False, encoding='utf-8-sig')