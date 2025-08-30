
import pandas as pd
import os
import re
# The current script's directory
script_dir = os.path.dirname(os.path.abspath(__file__))

# Construct the full path to the CSV file
deaths_df=pd.read_csv(script_dir+"/deaths.csv")
events_df=pd.read_csv(script_dir+"/events.csv")

# Remove anything except Persian digits and spaces, then remove spaces, then translate Persian digits to English
deaths_df['year'] = deaths_df['year'].astype(str).apply(lambda x: re.sub(r'[^\u06F0-\u06F9 ]', '', x))
deaths_df['year'] = deaths_df['year'].str.replace(' ', '', regex=False)
deaths_df['year'] = deaths_df['year'].str.translate(str.maketrans('۰۱۲۳۴۵۶۷۸۹', '0123456789'))
deaths_df = deaths_df[deaths_df['year'] != '']  # Remove empty years
deaths_df['year'] = deaths_df['year'].astype(int)


events_df['year'] = events_df['year'].astype(str).apply(lambda x: re.sub(r'[^\u06F0-\u06F9 ]', '', x))
events_df['year'] = events_df['year'].str.replace(' ', '', regex=False)
events_df['year'] = events_df['year'].str.translate(str.maketrans('۰۱۲۳۴۵۶۷۸۹', '0123456789'))
events_df = events_df[events_df['year'] != '']  # Remove empty years
events_df['year'] = events_df['year'].astype(int)

events_df = events_df.iloc[1:]

# Add empty columns for description and category to both dataframes
events_df['description'] = ''
events_df['category'] = "Event"
deaths_df['description'] = ''
deaths_df['category'] = "Death"

print("Data cleaning completed.")

print(deaths_df.head())

print(events_df.head())


# Save cleaned data
deaths_df.to_csv(script_dir+"/cleaned_deaths.csv", index=False)
events_df.to_csv(script_dir+"/cleaned_events.csv", index=False)
print("Cleaned data saved.")