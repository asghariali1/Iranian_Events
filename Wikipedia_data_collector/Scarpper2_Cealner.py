import requests
import time
from bs4 import BeautifulSoup
import pandas as pd
import pickle
import os

# The current script's directory
script_dir = os.path.dirname(os.path.abspath(__file__))

data_events=pd.read_csv(script_dir+"/events.csv")
data_deaths=pd.read_csv(script_dir+"/deaths.csv")
#Convert all digits from persian to english in title column
persian_to_english_digits = str.maketrans("۰۱۲۳۴۵۶۷۸۹", "0123456789")

data_events['title'] = data_events['title'].apply(lambda x: x.translate(persian_to_english_digits) if isinstance(x, str) else x)
data_deaths['title'] = data_deaths['title'].apply(lambda x: x.translate(persian_to_english_digits) if isinstance(x, str) else x)
#Search for persian month in tittle find all digits before it and then replace the value of day column with those digits then remove those digits and the name of month from the title column
import re  
def extract_day(title):
    persian_months = [
        "فروردین", "اردیبهشت", "خرداد",
        "تیر", "مرداد", "شهریور",
        "مهر", "آبان", "آذر",
        "دی", "بهمن", "اسفند"
    ]
    for month in persian_months:
        if month in title:
            match = re.search(r'(\d+)', title.split(month)[0])
            if match:
                return match.group(1)
    return None

data_events['day'] = data_events['title'].apply(extract_day)
data_deaths['day'] = data_deaths['title'].apply(extract_day)

print(data_events.head())
print(data_deaths.head())

#Convert day to integer
data_events['day'] = pd.to_numeric(data_events['day'], errors='coerce').astype('Int64')
data_deaths['day'] = pd.to_numeric(data_deaths['day'], errors='coerce').astype('Int64')

#Remove the name of persian month and all digits before it from the title column
persian_months = [
    "فروردین", "اردیبهشت", "خرداد",
    "تیر", "مرداد", "شهریور",
    "مهر", "آبان", "آذر",
    "دی", "بهمن", "اسفند"
]
def clean_title_deaths(title):
    if not isinstance(title, str):
        return title, title
        
    title = title.replace('\u200c', ' ')  # Replace ZWNJ with space
    title = title.replace('\u200b', ' ')  # Replace ZWS with space
    title = ' '.join(title.split())  # Normalize multiple spaces
    
    for month in persian_months:
        if month in title:
            title = title.split(month)[-1].strip(" ,،-*")
    
    if 'زاد' in title:
        title = title.split('زاد')[0].strip(" ,،-*()")
    
    # Split into person and details based on first occurrence of ،
    parts = title.split('،', 1)
    person = parts[0].strip(" ,،-*")
    details = parts[1].strip(" ,،-*") if len(parts) > 1 else ""
    
    return person, details

# Modify how we process the deaths data
data_deaths[['Person', 'Details']] = pd.DataFrame(
    data_deaths['title'].apply(clean_title_deaths).tolist(), 
    columns=['Person', 'Details'], 
    index=data_deaths.index
)
def clean_title_events(title):
    title = title.replace('\u200c', ' ')  # Replace ZWNJ with space
    title = title.replace('\u200b', ' ')  # Replace ZWS with space
    title = ' '.join(title.split())  # Normalize multiple spaces
    for month in persian_months:
        if month in title:
            title = title.split(month)[-1].strip(" ,،-*")
    return title.strip(" ,،-*")

data_events['title'] = data_events['title'].apply(clean_title_events)
data_deaths['title'] = data_deaths['title'].apply(clean_title_deaths)

# Delete all [] and their content from both columns
data_deaths['Person'] = data_deaths['Person'].str.replace(r'\[.*?\]', '', regex=True).str.strip()
data_deaths['Details'] = data_deaths['Details'].str.replace(r'\[.*?\]', '', regex=True).str.strip()

#Move the person and details column to the 4th and 5th position
data_deaths = data_deaths[['year', 'month', 'day', 'Person', 'Details', 'title', 'link', 'category']]

# Drop the original title column if you don't need it anymore
data_deaths = data_deaths.drop('title', axis=1)

#Delete all [] and their content from title column
data_events['title'] = data_events['title'].str.replace(r'\[.*?\]', '', regex=True).str.strip()


#save cleaned data
data_events.to_csv(script_dir+"/cleaned_events.csv", index=False)
data_deaths.to_csv(script_dir+"/cleaned_deaths.csv", index=False)

print("Cleaned data saved to cleaned_events.csv and cleaned_deaths.csv")

