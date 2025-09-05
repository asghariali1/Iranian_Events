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
Events_df=pd.read_csv(script_dir+"/final_events_df.csv")

Deaths_df=pd.read_csv(script_dir+"/final_deaths_df.csv")

#check how many nan value in month column
print("Number of NaN values in Events month column:", Events_df['month'].isna().sum())
print("Number of NaN values in Deaths month column:", Deaths_df['month'].isna().sum())
#convert the date columns from jalali to gregorian
def convert_jalali_to_gregorian(year, month, day):
    try:
        # Ensure year, month, day are integers
        year = int(year)
        if year <0:
            year= 1
        month = int(month)
        day = int(day)
        if day==0:
            day=1
        # Convert Jalali date to Gregorian date
        gregorian_date = JalaliDate(year, month, day).to_gregorian()
        return gregorian_date.strftime('%Y-%m-%d')
    except Exception as e:
        print(f"Error converting date {year}-{month}-{day}: {e}")
        return None

# Apply the conversion to the Events_df dataframe and create new columns day_gregorian month_gregorian year_gregorian
Events_df[['year_gregorian', 'month_gregorian', 'day_gregorian']] = Events_df.apply(
    lambda row: pd.Series(convert_jalali_to_gregorian(row['year'], row['month'], row['day']).split('-')), axis=1)
print("Events_df conversion done")


# Apply the conversion to the Deaths_df dataframe and create new columns day_gregorian month_gregorian year_gregorian
Deaths_df[['year_gregorian', 'month_gregorian', 'day_gregorian']] = Deaths_df.apply(
    lambda row: pd.Series(convert_jalali_to_gregorian(row['year'], row['month'], row['day']).split('-')), axis=1)

print("Deaths_df conversion done")
# Save the updated dataframes back to CSV files
#Events_df.to_csv(script_dir+"/final_events_df_gregorian.csv", index=False)

#Deaths_df.to_csv(script_dir+"/final_deaths_df_gregorian.csv", index=False)

#
#get the langlinks of a wikipedia page from its url and if the english link exists return it

def get_langlinks_from_url(url):
    wiki_wiki = wikipediaapi.Wikipedia(user_agent='Iranian Timeline asghariali9877@gmail.com', language='fa')
    page = wiki_wiki.page(url.split('/wiki/')[-1])
    if page.exists():
        langs = page.langlinks
        if langs.get('en'):
            return langs.get('en').fullurl
        else:
            return "<No English page found>"


def convert_wiki_url_to_persian(url):
    # Extract the encoded part after /wiki/
    match = re.search(r'/wiki/(.+)$', url)
    if not match:
        return url
        
    encoded_part = match.group(1)
    # Decode the URL-encoded string
    decoded_part = unquote(encoded_part)
    
    # Reconstruct the URL with the decoded part
    base_url = url[:url.find('/wiki/') + 6]  # Keep the part until /wiki/
    return base_url + decoded_part



#test the functition for firsrt 5 rows of Events_df
#for i in range(5):
    #print(convert_wiki_url_to_persian(Deaths_df['person_link'].iloc[i]))
    #print(get_langlinks_from_url(convert_wiki_url_to_persian(Deaths_df['person_link'].iloc[i])))

#add english links to the dataframe with progress bar
from tqdm import tqdm
#tqdm.pandas()  # Initialize tqdm with pandas
#Deaths_df['person_link_english'] = Deaths_df['person_link'].progress_apply(lambda x: get_langlinks_from_url(convert_wiki_url_to_persian(x)) if pd.notna(x) else x)

#save the updated dataframe back to csv file
#Deaths_df.to_csv(script_dir+"/final_deaths_df_gregorian_with_english_links.csv", index=False)

#load the updated dataframe back from csv file
Deaths_df=pd.read_csv(script_dir+"/final_deaths_English.csv")

#Translate the names to english 
#For those who have English wikipedia page link use that to get the name
def get_english_name_from_wiki_url(url):
    wiki_wiki = wikipediaapi.Wikipedia(user_agent='Iranian Timeline asghariali9877@gmail.com', language='en')
    page = wiki_wiki.page(url.split('/wiki/')[-1])
    if page.exists():
        print(f"Found English page: {page.title}")
        return page.title
    else:
        return "<No English name found>"

#A function to translate names using googletrans library

translator = Translator()
def translate_name_to_english(name):
    try:
        translation = translator.translate(name, src='fa', dest='en')
        print(f"Translated using Google Translator: {translation.text}")
        return translation.text
    except Exception as e:
        print(f"Error translating name {name}: {e}")
        return "<Translation Error>"


#add english names to the dataframe with progress bar for those who have english link
#print("Adding English names to the dataframe...")
#from tqdm import tqdm
#tqdm.pandas() 

 # Initialize tqdm with pandas
#Deaths_df['person_name_english'] = Deaths_df.apply(lambda row: get_english_name_from_wiki_url(row['person_link_english']) if pd.notna(row['person_link_english']) and row['person_link_english']!="<No English page found>" else translate_name_to_english(row['person']), axis=1)


#save the updated dataframe back to csv file
#Deaths_df.to_csv(script_dir+"/final_deaths_df_English_names.csv", index=False)





#load the updated dataframe back from csv file
Deaths_df=pd.read_csv(script_dir+"/final_deaths_df_English_names.csv")


#Create a function to translate person details to english using googletrans library
def translate_details_to_english(details):
    try:
        time.sleep(0.5)  # Add small delay to avoid rate limiting
        translation = translator.translate(details, src='fa', dest='en')
        return translation.text
    except Exception as e:
        print(f"Error translating: {e}")
        return "<Translation Error>"
#remove progress bar for now
from tqdm import tqdm
tqdm.pandas()  # Initialize tqdm with pandas
#trasnlate person details to english
# Replace the last line with this:
#Deaths_df['details_english'] = Deaths_df['details'].progress_apply(
    #lambda x: translate_details_to_english(x) if pd.notna(x) else x)


#save the updated dataframe back to csv file
#Deaths_df.to_csv(script_dir+"/final_deaths_df_English.csv", index=False)

print("All done!")


# tranlating the event df
def similar(a, b):
    # Calculate similarity ratio between two strings
    return SequenceMatcher(None, a, b).ratio()

def find_best_matching_link(title, link_data):
    best_match_url = None
    highest_score = 0
    
    for link in link_data:
        link_text = link['text']
        link_url = link['url']
        
        # Skip single-word links unless they exactly match the title
        link_words = link_text.split()
        if len(link_words) == 1 and link_text != title:
            continue
            
        # Calculate different matching scores
        similarity = similar(title, link_text)
        contained = link_text.replace(' ', '') in title.replace(' ', '')
        partial_match = any(similar(part, link_text) > 0.8 for part in title.split(' و '))
        
        # Additional check for meaningful matches
        words_in_title = set(title.split())
        words_in_link = set(link_text.split())
        word_overlap = len(words_in_title.intersection(words_in_link)) / len(words_in_link)
        
        # Combine scores - prioritize contained matches with multiple words
        score = max(
            similarity * (1.0 if len(link_words) > 1 else 0.5),  # Reduce score for single words
            1.0 if contained and len(link_words) > 1 else 0.0,   # Only allow containment for multi-word links
            0.9 if partial_match and word_overlap > 0.5 else 0.0 # Require significant word overlap
        )
        
        if score > highest_score:
            highest_score = score
            best_match_url = link_url
    
    return best_match_url if highest_score > 0.5 else None

for i in range(len(Events_df)):
    print(f"Processing row {i+1} of {len(Events_df)}")
    title = Events_df.loc[i, 'title']
    try:
        link_data = ast.literal_eval(Events_df.loc[i, 'links'])
        matching_url = find_best_matching_link(title, link_data)
        
        if matching_url:
            Events_df.loc[i, 'event_link'] = matching_url
            print(f"Found matching link for title: {title}")
    except Exception as e:
        print(f"Error processing row {i}: {e}")
        continue

# check for english page for the event links
#from tqdm import tqdm
#tqdm.pandas()  # Initialize tqdm with pandas
#Events_df['event_link_english'] = Events_df['event_link'].progress_apply(lambda x: get_langlinks_from_url(convert_wiki_url_to_persian(x)) if pd.notna(x) else x)

#treanslate the event titles to english with those with na in the event link column
def translate_event_title_to_english(title):
    try:
        time.sleep(0.5)  # Add small delay to avoid rate limiting
        translation = translator.translate(title, src='fa', dest='en')
        return translation.text
    except Exception as e:
        print(f"Error translating event title {title}: {e}")
        return "<Translation Error>"
    
from tqdm import tqdm
tqdm.pandas()  # Initialize tqdm with pandas
Events_df['event_link_english'] = Events_df['event_link'].progress_apply(lambda x: get_langlinks_from_url(convert_wiki_url_to_persian(x)) if pd.notna(x) else x)

#translate event titles to english
Events_df['title_english'] = Events_df.apply(lambda row: get_english_name_from_wiki_url(row['event_link_english']) if pd.notna(row['event_link_english']) and row['event_link_english']!="<No English page found>" else translate_event_title_to_english(row['title']), axis=1)

#save the updated dataframe back to csv file
Events_df.to_csv(script_dir+"/final_events_English2.csv", index=False)