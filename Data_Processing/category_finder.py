import pandas as pd
import os
import re
import sys
from persiantools.jdatetime import JalaliDate
import wikipediaapi
from urllib.parse import unquote
import re
from googletrans import Translator
import time
from difflib import SequenceMatcher
import ast

script_dir = os.path.dirname(os.path.abspath(__file__))

# Construct the full path to the CSV file
Events_df=pd.read_csv(script_dir+"/data/final_events_English.csv")

Deaths_df=pd.read_csv(script_dir+"/data/final_deaths_English.csv")


#using BART to classify the categories of events
#from transformers import pipeline

#classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")
# Define candidate labels
candidate_labels = ["Politics", "Social", "Natural Disaster", "Art", "Science","Iran","Sports"]

# define persion keywords for labels
Politics_keywords = ['انتخابات','تاجگذاری','انقلاب','سلسله','نبرد', 'دولت', 'ریاست جمهوری', 'پارلمان', 'مجلس', 'وزیر', 'سیاست', 'حزب', 'قانون', 'دیپلماسی', 'سفارت', 'تحریم', 'انقلاب', 'جنگ', 'صلح']
Social_keywords = ['اعتراض', 'تظاهرات', 'حقوق بشر', 'آزادی', 'خشونت', 'تروریسم', 'پناهنده', 'مهاجرت', 'جمعیت', 'جمعیت‌شناسی', 'فرهنگ', 'آداب و رسوم', 'مذهب', 'جشنواره']
Natural_Disaster_keywords = ['زلزله','زمین لرزه', 'سیل', 'طوفان', 'خشکسالی', 'آتش‌سوزی', 'سونامی', 'آتشفشان', 'توفان', 'برف‌وباران', 'گردباد', 'فاجعه طبیعی']     
Art_keywords = ['فیلم', 'موسیقی', 'نقاشی', 'ادبیات', 'تئاتر', 'رقص', 'هنرهای تجسمی', 'فرهنگ عامه', 'کتاب', 'نمایشگاه', 'جشنواره فیلم', 'آلبوم موسیقی']
Science_keywords = ['اختراع', 'کشف', 'فضا', 'تلسکوپ', 'زیست‌شناسی', 'فناوری', 'رباتیک', 'هوش مصنوعی', 'پزشکی', 'دارو', 'آزمایشگاه', 'دانشمند']
Sports_keywords = ['المپیک', 'جام جهانی', 'فوتبال', 'بسکتبال', 'والیبال', 'تنیس', 'دوومیدانی', 'کشتی', 'بوکس', 'ورزشکار', 'مسابقه', 'قهرمانی']  

# Function to check for keywords in details
def check_keywords(details, keywords):
    for keyword in keywords:
        if re.search(r'\b' + re.escape(keyword) + r'\b', details):
            return True
    return False   

#check keywords in title column and if found set the corresponding label to 1
for i in range(len(Events_df)): 
    print(f"Processing row {i+1} of {len(Events_df)}")
    details = Events_df.loc[i, 'title']
    if pd.isna(details):
        continue
    # Convert details to lowercase for case-insensitive matching
    details_lower = details.lower()
    
    if check_keywords(details_lower, Politics_keywords):
        Events_df.loc[i, 'Politics'] = 1.0
    if check_keywords(details_lower, Social_keywords):
        Events_df.loc[i, 'Social'] = 1.0
    if check_keywords(details_lower, Natural_Disaster_keywords):
        Events_df.loc[i, 'Natural Disaster'] = 1.0
    if check_keywords(details_lower, Art_keywords):
        Events_df.loc[i, 'Art'] = 1.0
    if check_keywords(details_lower, Science_keywords):
        Events_df.loc[i, 'Science'] = 1.0
    if check_keywords(details_lower, Sports_keywords):
        Events_df.loc[i, 'Sports'] = 1.0


#check how many rows have at least one label assigned
labeled_rows = Events_df[(Events_df['Politics'] == 1.0) |
                         (Events_df['Social'] == 1.0) |
                         (Events_df['Natural Disaster'] == 1.0) |
                         (Events_df['Art'] == 1.0) |
                         (Events_df['Science'] == 1.0) |
                         (Events_df['Sports'] == 1.0)]
print(f"Number of labeled rows after keyword matching: {len(labeled_rows)}")
print(f"Total number of rows: {len(Events_df)}")
print(f"Percentage of labeled rows: {len(labeled_rows)/len(Events_df)*100:.2f}%")


#save the updated dataframe back to csv file
Events_df.to_csv(script_dir+"/data/final_events_English_categorized_keywords.csv", index=False)



'''
#add labels columns to the dataframe
for label in candidate_labels:
    Events_df[label] = 0.0

# Function to classify event details
def classify_event(details):
    try:
        result = classifier(details, candidate_labels, multi_label=True)
      
    except Exception as e:
        print(f"Error classifying details: {details}. Error: {e}")
        return "Unknown"
    
# find the scores of all labels and store them in events_df coresponding columns
for i in range (len(Events_df)):
        print(f"Processing row {i+1} of {len(Events_df)}")
        result = classify_event(Events_df.loc[i, 'details_english'])
        Events_df.loc[i, str(candidate_labels[0])] = result['scores'][0]
        Events_df.loc[i, str(candidate_labels[1])] = result['scores'][1]
        Events_df.loc[i, str(candidate_labels[2])] = result['scores'][2]
        Events_df.loc[i, str(candidate_labels[3])] = result['scores'][3]
        Events_df.loc[i, str(candidate_labels[4])] = result['scores'][4]
        Events_df.loc[i, str(candidate_labels[5])] = result['scores'][5]
        Events_df.loc[i, str(candidate_labels[6])] = result['scores'][6]
        if Events_df.loc[i,"Iran"] < 0.3:
            Events_df.loc[i,"Global"] = 1

# Save the updated dataframe back to csv file
Events_df.to_csv(script_dir+"/data/final_events_English_categorized.csv", index=False)
'''