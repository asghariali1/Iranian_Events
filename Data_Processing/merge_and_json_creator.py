import pandas as pd
import os
import requests
#import csv files
script_dir = os.path.dirname(os.path.abspath(__file__))

# Construct the full path to the CSV file
Events_df=pd.read_csv(script_dir+"/data/final_events_English_categorized_keywords.csv")

Deaths_df=pd.read_csv(script_dir+"/data/final_deaths_English.csv")

#merge the two dataframes and add a new column called type and set its value to event for Events_df and death for Deaths_df
Events_df['type'] = 'event'
Deaths_df['type'] = 'death'


#Era column for the timeline
#import eras csv file  
Eras_df=pd.read_csv(script_dir+"/data/eras.csv")
# add era column to merged_df and set its value to the corresponding era in Eras_df based on the date column
def get_era(date):
    for index, row in Eras_df.iterrows():
        if row['Year_Start'] <= date <= row['Year_End']:
            return row['Era_Persian'], row['Era_English']
    return '', ''




# Concatenate the two dataframes
merged_df = pd.concat([Events_df, Deaths_df], ignore_index=True)

#sort the merged dataframe by year, month, day columns
merged_df = merged_df.sort_values(by=['year', 'month', 'day']).reset_index(drop=True)

merged_df[['era_persian', 'era_english']] = merged_df['year_gregorian'].apply(
    lambda date: pd.Series(get_era(date))
)

#add a zero before month and day if they are less than 10
merged_df['month'] = merged_df['month'].apply(lambda x: f"{int(x):02}" if pd.notnull(x) else "01")
merged_df['day'] = merged_df['day'].apply(lambda x: f"{int(x):02}" if pd.notnull(x) else "01")

#do the same for georgorian date columns
merged_df['month_gregorian'] = merged_df['month_gregorian'].apply(lambda x: f"{int(x):02}" if pd.notnull(x) else "01")
merged_df['day_gregorian'] = merged_df['day_gregorian'].apply(lambda x: f"{int(x):02}" if pd.notnull(x) else "01")

#convert year month day columns to a date column to month name day, year format
merged_df['date_gregorian'] = pd.to_datetime(merged_df[['year_gregorian', 'month_gregorian', 'day_gregorian']].astype(str).agg('-'.join, axis=1), format='%Y-%m-%d', errors='coerce').dt.strftime('%B %d, %Y')


#convert year month day columns to a date column to month name day, year format for jalali date
#define jalali month names in persian
jalali_months = {
    '01': 'فروردین',
    '02': 'اردیبهشت',
    '03': 'خرداد',
    '04': 'تیر',
    '05': 'مرداد',
    '06': 'شهریور',
    '07': 'مهر',
    '08': 'آبان',
    '09': 'آذر',
    '10': 'دی',
    '11': 'بهمن',
    '12': 'اسفند'
}
#function to convert month number to month name in persian
def convert_month(month):
    return jalali_months.get(month, month)
#apply the function to month column
merged_df['month_name'] = merged_df['month'].apply(convert_month)
#combine month_name, day, year columns to a single date column in the format of month name day, year
merged_df['date'] = merged_df['month_name'] + ' '+ merged_df['day'] + ', ' + merged_df['year'].astype(str)
#drop month_name column
merged_df = merged_df.drop(columns=['month_name'])




#drop the column link 
merged_df = merged_df.drop(columns=['link'])
#rename event_link to link
merged_df = merged_df.rename(columns={'event_link': 'link'})
#move the values of person_link column to link column if type is death and drop person_link column
merged_df.loc[merged_df['type'] == 'death', 'link'] = merged_df.loc[merged_df['type'] == 'death', 'person_link']
merged_df = merged_df.drop(columns=['person_link'])

#rename eveny_link_english to link_english
merged_df = merged_df.rename(columns={'event_link_english': 'link_english'})
#move the values of person_link_english column to link_english column if type is death and drop person_link_english column
merged_df.loc[merged_df['type'] == 'death', 'link_english'] = merged_df.loc[merged_df['type'] == 'death', 'person_link_english']
merged_df = merged_df.drop(columns=['person_link_english'])


#move every value of person column to title column if type is death
merged_df.loc[merged_df['type'] == 'death', 'title'] = merged_df.loc[merged_df['type'] == 'death', 'person']
#drop person column
merged_df = merged_df.drop(columns=['person'])

#move everu value of person_english column to title_english column if type is death
merged_df.loc[merged_df['type'] == 'death', 'title_english'] = merged_df.loc[merged_df['type'] == 'death', 'person_name_english'] 
#drop person_english column
merged_df = merged_df.drop(columns=['person_name_english'])


# Save the merged dataframe to a new CSV file
merged_df.to_csv(script_dir+"/data/merged_df.csv", index=False)
print(f"Merged dataframe has {len(merged_df)} rows.")

#replace all nan values with empty string
merged_df = merged_df.fillna('')   

#drop all observation with year_gregorian less than 600
merged_df = merged_df[merged_df['year_gregorian'] >= 600]

#remove all observation with year_gregorian bigger than 2025
merged_df = merged_df[merged_df['year_gregorian'] <= 2025]

#add a single observation with year_gregorian 2026, month_gregorian 1, day_gregorian 1, date_gregorian January 01, 2026, year 1405, month 1, day 1, date  فروردین 01, 1405, era_persian جمهوری اسلامی, era_english Islamic Republic, type event, title New Era Event, title_english New Era Event, details This is a placeholder event for the new era., details_english This is a placeholder event for the new era., link '', link_english '', keywords '', keywords_english ''
year	2026
month	"1"
day	"1"
title	"ناشناس"
links	""
year_gregorian	2026
month_gregorian	"01"
day_gregorian	"01"
link	""
link_english	""
title_english	"Unknown"
Politics	""
Social	""
Natural Disaster	""
Science	""
Art	""
Sports	""
type	"event"
details	""
details_english	"UNKNOWN"
era_persian	"نیاز به نامگذاری"
era_english	"New Folder"
date_gregorian	"2026-01-01"
date	"فروردین 01, 1405"
image	""

#a function to get a url of a wikipedia tumbnail image from a wikipedia page link
def get_wikipedia_thumbnail(url):
    if url == '':
        return ''
    try:
        if 'fa.wikipedia.org' in url:
            title = url.split('/wiki/')[1]
            api_url = f'https://fa.wikipedia.org/w/api.php?action=query&titles={title}&prop=pageimages&format=json&pithumbsize=500'
        elif 'en.wikipedia.org' in url:
            title = url.split('/wiki/')[1]
            api_url = f'https://en.wikipedia.org/w/api.php?action=query&titles={title}&prop=pageimages&format=json&pithumbsize=500'
        else:
            return ''
        
        # Add a User-Agent header to the request
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(api_url, headers=headers)
        response.raise_for_status()  # Raise an HTTPError for bad responses (4xx and 5xx)
        
        data = response.json()
        pages = data['query']['pages']
        for page_id in pages:
            page = pages[page_id]
            if 'thumbnail' in page:
                return page['thumbnail']['source']
        return ''
    except Exception as e:
        print(f"Error fetching thumbnail for URL {url}: {e}")
        return ''
    
#apply the function to link column and create a new column called image with a progress bar
from tqdm import tqdm  
tqdm.pandas()
merged_df['image'] = merged_df['link'].progress_apply(get_wikipedia_thumbnail)



# Convert the merged dataframe to a JSON file with records orientation and add comma between each record
merged_df.to_json(script_dir+"/data/merged_df.json", orient='records', force_ascii=False, lines=False)
print("JSON file created.")