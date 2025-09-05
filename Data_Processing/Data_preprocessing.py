import pandas as pd
import os
import re
import sys
from difflib import SequenceMatcher

def similar(a, b):
    # Calculate similarity ratio between two strings
    return SequenceMatcher(None, a, b).ratio()

def find_best_matching_url(person_name, link_list):
    best_match = None
    highest_similarity = 0
    
    # Convert string representation of list to actual list if needed
    if isinstance(link_list, str):
        # Use eval() carefully, only if you trust your data
        link_list = eval(link_list)
    
    for item in link_list:
        similarity = similar(person_name, item['text'])
        if similarity > highest_similarity:
            highest_similarity = similarity
            best_match = item['url']
    
    # You can adjust this threshold based on your needs
    if highest_similarity > 0.8:
        return best_match
    return None
# The current script's directory
script_dir = os.path.dirname(os.path.abspath(__file__))

# Construct the full path to the CSV file
calender_deaths_df=pd.read_csv(script_dir+"/data/calender_deaths.csv")
calender_events_df=pd.read_csv(script_dir+"/data/calender_events.csv")

year_deaths_df=pd.read_csv(script_dir+"/data/year_calender_deaths.csv")
year_events_df=pd.read_csv(script_dir+"/data/year_calender_events.csv")


#move the date columns to the front
def move_date_columns_to_front(df):
    date_columns = ['year', 'month', 'day']
    other_columns = [col for col in df.columns if col not in date_columns]
    new_order = date_columns + other_columns
    return df[new_order]

calender_deaths_df = move_date_columns_to_front(calender_deaths_df)
calender_events_df = move_date_columns_to_front(calender_events_df)
year_deaths_df = move_date_columns_to_front(year_deaths_df)
year_events_df = move_date_columns_to_front(year_events_df)


#convert calender_deaths_df year column digits from persian to english
def convert_persian_digits_to_english(text):
    persian_digits = '۰۱۲۳۴۵۶۷۸۹'
    english_digits = '0123456789'
    translation_table = str.maketrans(persian_digits, english_digits)
    return text.translate(translation_table)    

#remove every non digit character from year column
def remove_non_digit_characters(text):
    return re.sub(r'\D', '', text)


#drop rows with empty year column
calender_deaths_df = calender_deaths_df[calender_deaths_df['year'] != ''].reset_index(drop=True)

#apply the function to year column  
#calender_deaths_df['year'] = calender_deaths_df['year'].astype(str).apply(remove_non_digit_characters).astype("int64")

calender_deaths_df['year'] = calender_deaths_df['year'].astype(str).apply(convert_persian_digits_to_english)
#print the 104th row of the dataframe
print(calender_deaths_df.iloc[104])
#see head of the dataframe
print(calender_deaths_df.head())

calender_deaths_df['person_link'] = None

# Find matching URLs for each person
for i in range(len(calender_deaths_df)):

    print(f"Processing row {i+1} of {len(calender_deaths_df)}")
    person_name = calender_deaths_df.loc[i, 'person']
    link_data = calender_deaths_df.loc[i, 'link']
    
    matching_url = find_best_matching_url(person_name, link_data)

    calender_deaths_df.loc[i, 'person_link'] = matching_url
    
for i in range(len(year_deaths_df)):
    print(f"Processing row {i+1} of {len(year_deaths_df)}")
    person_name = year_deaths_df.loc[i, 'person']
    link_data = year_deaths_df.loc[i, 'link']
    
    matching_url = find_best_matching_url(person_name, link_data)
    year_deaths_df.loc[i, 'person_link'] = matching_url


print(f"calender_deaths_df has {len(calender_deaths_df)} rows after processing. and year_deaths_df has {len(year_deaths_df)} rows after processing. sum is {len(calender_deaths_df)+len(year_deaths_df)}")

#find the duplicates based on the person_link column
duplicates = calender_deaths_df[calender_deaths_df.duplicated(subset=['person_link'], keep=False)]
print(f"Found {len(duplicates)} duplicate rows based on person_link in calender_deaths_df.")

#merge two dataframe and prevent duplicates based on person_link column
combined_deaths_df = pd.concat([calender_deaths_df, year_deaths_df]).drop_duplicates(subset=['person_link'], keep='first').reset_index(drop=True)
print(f"combined_deaths_df has {len(combined_deaths_df)} rows after merging and removing duplicates based on person_link.") 
#sort the combined dataframe based on year, month, day columns
combined_deaths_df = combined_deaths_df.sort_values(by=['year', 'month', 'day']).reset_index(drop=True) 

# Save the updated DataFrame to a new CSV file
combined_deaths_df.to_csv(script_dir+"/final_deaths_df.csv", index=False)




#repeat the same for events dataframes
#delete the first row of calender events_df
calender_events_df = calender_events_df.drop(index=0).reset_index(drop=True)

#find the duplicate in each row with same month day and year and similarity ratio of title more than 0.8
#group by year month day and then find the duplicates based on title similarity
duplicates_events = []
counter=0
grouped = calender_events_df.groupby(['year', 'month', 'day'])
for name, group in grouped:
    titles = group['title'].tolist()
    indices = group.index.tolist()
    for i in range(len(titles)):
        for j in range(i + 1, len(titles)):
            if similar(titles[i], titles[j]) > 0.8:
                duplicates_events.append(group.iloc[[i, j]])
                counter=counter+1

print(f"Found {counter} pairs of duplicate rows based on year, month, day, and title similarity > 0.8 in calender_events_df.")    

#remove the duplicates from calender_events_df
if duplicates_events:
    duplicates_events_df = pd.concat(duplicates_events).drop_duplicates().reset_index(drop=True)
    calender_events_df = calender_events_df.drop(duplicates_events_df.index).reset_index(drop=True)
    print(f"calender_events_df has {len(calender_events_df)} rows after removing duplicates based on title similarity.") 
else:
    print("No duplicate events found based on title similarity.")

print(f"now calender_events_df has {len(calender_events_df)} rows after removing duplicates based on title similarity. the sum of two dataframes is {len(calender_events_df)+len(year_events_df)}")

#merge two dataframe
combined_events_df = pd.concat([calender_events_df, year_events_df]).drop_duplicates(subset=['title', 'year', 'month', 'day'], keep='first').reset_index(drop=True)
print(f"combined_events_df has {len(combined_events_df)} rows after merging and removing duplicates based on title, year, month, day.")
#sort the combined dataframe based on year, month, day columns
combined_events_df = combined_events_df.sort_values(by=['year', 'month', 'day']).reset_index(drop=True) 
# Save the updated DataFrame to a new CSV file
combined_events_df.to_csv(script_dir+"/final_events_df.csv", index=False)   
print(f"final_events_df has {len(combined_events_df)} rows after processing. and final_deaths_df has {len(combined_deaths_df)} rows after processing. sum is {len(combined_events_df)+len(combined_deaths_df)}")