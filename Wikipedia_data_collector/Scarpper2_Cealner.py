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
def clean_title(title):
    title = title.replace('\u200c', ' ')  # Replace ZWNJ with space
    title = title.replace('\u200b', ' ')  # Replace ZWS with space
    title = ' '.join(title.split())  # Normalize multiple spaces
    for month in persian_months:
        if month in title:
            return title.split(month)[-1].strip(" ,،-*")
    return title.strip(" ,،-*")

data_events['title'] = data_events['title'].apply(clean_title)
data_deaths['title'] = data_deaths['title'].apply(clean_title)


#Delete all [] and their content from title column
data_events['title'] = data_events['title'].str.replace(r'\[.*?\]', '', regex=True).str.strip()
data_deaths['title'] = data_deaths['title'].str.replace(r'\[.*?\]', '', regex=True).str.strip()


#save cleaned data
data_events.to_csv(script_dir+"/cleaned_events.csv", index=False)
data_deaths.to_csv(script_dir+"/cleaned_deaths.csv", index=False)

print("Cleaned data saved to cleaned_events.csv and cleaned_deaths.csv")