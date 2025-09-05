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
from transformers import pipeline

classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")
# Define candidate labels
candidate_labels = ["Politics", "Social", "Natural Disaster", "Art", "Science","Iran","Sports"]

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