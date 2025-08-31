import pandas as pd
import os
import re
import sys
# The current script's directory
script_dir = os.path.dirname(os.path.abspath(__file__))

# Construct the full path to the CSV file
calender_deaths_df=pd.read_csv(script_dir+"/Calender_deaths.csv")
calener_events_df=pd.read_csv(script_dir+"/Calender_events.csv")

year_deaths_df=pd.read_csv(script_dir+"/Year_deaths.csv")
year_events_df=pd.read_csv(script_dir+"/Year_events.csv")

#Clean and merge the deaths datasets
print(f"The calender data has {len(calender_deaths_df)} observation")
print(f"The year data has {len(year_deaths_df)} observation")
print(f"The sum of two dataset is : {len(calender_deaths_df)+len(year_deaths_df)}")

# check how many overlap do we have
# find the matching rows
matching_rows_death = pd.merge(calender_deaths_df, year_deaths_df, on=['year', 'month', 'day'], how='inner', suffixes=('_calender', '_year'))

print(f"{len(matching_rows_death)} duplicates founded")

# Function to get first two words
def get_first_two_words(title):
    if pd.isna(title):
        return ""
    words = str(title).strip().split()
    return " ".join(words[:2]) if len(words) >= 2 else " ".join(words)

# Create columns with first two words
matching_rows_death['first_two_calender'] = matching_rows_death['title_calender'].apply(get_first_two_words)
matching_rows_death['first_two_year'] = matching_rows_death['title_year'].apply(get_first_two_words)

# Filter out rows where first two words are the same
filtered_deaths = matching_rows_death[
    matching_rows_death['first_two_calender'] != matching_rows_death['first_two_year']
]


filtered_deaths = filtered_deaths.drop(['first_two_calender', 'first_two_year'], axis=1)


filtered_deaths['key'] = (filtered_deaths['year'].astype(str) + '_' + 
                         filtered_deaths['month'].astype(str) + '_' + 
                         filtered_deaths['day'].astype(str) + '_' + 
                         filtered_deaths['title_calender'].astype(str))

# Create the same key for calender_deaths_df
calender_deaths_df['key'] = (calender_deaths_df['year'].astype(str) + '_' + 
                            calender_deaths_df['month'].astype(str) + '_' + 
                            calender_deaths_df['day'].astype(str) + '_' + 
                            calender_deaths_df['title'].astype(str))

# Remove rows that match
calender_deaths_df = calender_deaths_df[~calender_deaths_df['key'].isin(filtered_deaths['key'])]

# Drop the helper key column
calender_deaths_df = calender_deaths_df.drop('key', axis=1)

print("duplicated deleted from calender dataset checking agian...")
matching_rows_death = pd.merge(calender_deaths_df, year_deaths_df, on=['year', 'month', 'day'], how='inner', suffixes=('_calender', '_year'))
if len(matching_rows_death==0):
    print(" No duplicates found quality checked.")

else:
    print("ERROR  duplicates!")
    sys.exit()

deaths_df = pd.concat([calender_deaths_df, year_deaths_df], ignore_index=True)

deaths_df.to_csv(script_dir+"/death_df_merged.csv")
print("Deaths data merged and saved!")


#Clean and merge the deaths datasets
print(f"The calender event data has {len(calener_events_df)} observation")
print(f"The year event data has {len(year_events_df)} observation")
print(f"The sum of two dataset is : {len(calener_events_df)+len(year_events_df)}")

# check how many overlap do we have
# find the matching rows
matching_rows_death = pd.merge(calener_events_df, year_events_df, on=['year', 'month', 'day'], how='inner', suffixes=('_calender', '_year'))

print(f"{len(matching_rows_death)} duplicates founded")
matching_rows_death.to_csv(script_dir+"/te.csv")
# Do a similarity check and compare sentences
filtered_deaths = filtered_deaths.drop(['first_two_calender', 'first_two_year'], axis=1)


filtered_deaths['key'] = (filtered_deaths['year'].astype(str) + '_' + 
                         filtered_deaths['month'].astype(str) + '_' + 
                         filtered_deaths['day'].astype(str) + '_' + 
                         filtered_deaths['title_calender'].astype(str))

# Create the same key for calender_deaths_df
calender_deaths_df['key'] = (calender_deaths_df['year'].astype(str) + '_' + 
                            calender_deaths_df['month'].astype(str) + '_' + 
                            calender_deaths_df['day'].astype(str) + '_' + 
                            calender_deaths_df['title'].astype(str))

# Remove rows that match
calender_deaths_df = calender_deaths_df[~calender_deaths_df['key'].isin(filtered_deaths['key'])]

# Drop the helper key column
calender_deaths_df = calender_deaths_df.drop('key', axis=1)

print("duplicated deleted from calender dataset checking agian...")
matching_rows_death = pd.merge(calender_deaths_df, year_deaths_df, on=['year', 'month', 'day'], how='inner', suffixes=('_calender', '_year'))
if len(matching_rows_death==0):
    print(" No duplicates found quality checked.")

else:
    print("ERROR  duplicates!")
    sys.exit()

deaths_df = pd.concat([calender_deaths_df, year_deaths_df], ignore_index=True)

deaths_df.to_csv(script_dir+"/death_df_merged.csv")
print("Deaths data merged and saved!")