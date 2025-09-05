import wikipediaapi
import pandas as pd
import os
import re

script_dir = os.path.dirname(os.path.abspath(__file__)) 
link_files = pd.read_csv(os.path.join(script_dir, 'calender_with_url.csv'))

final_events_df = pd.DataFrame()
final_deaths_df = pd.DataFrame()
events_data = []
deaths_data = []
    
    # Initialize variables
current_month = None
persian_months = {
        'فروردین': 1, 'اردیبهشت': 2, 'خرداد': 3,
        'تیر': 4, 'مرداد': 5, 'شهریور': 6,
        'مهر': 7, 'آبان': 8, 'آذر': 9,
        'دی': 10, 'بهمن': 11, 'اسفند': 12
    }

# Get the wikiperdia full text of a page with url 
def get_wikipedia_page_content(url):
    wiki_wiki = wikipediaapi.Wikipedia(user_agent= "Iranian Timeline asghariali9877@gmail.com", language=   'fa')
    page_title = url.split("/wiki/")[-1]
    page = wiki_wiki.page(page_title)
    if page.exists():
        return {
            'text': page.text,
            'links': {title: link.fullurl for title, link in page.links.items() if link.exists()}
        }
    return None

final_events_df = pd.DataFrame()
final_deaths_df = pd.DataFrame()

#year = link_files.iloc[0]['Year']
#print(year)

url = link_files.iloc[0]['Wiki_URL']
print(url)
page_content = get_wikipedia_page_content(url)['text']


#save event section to a text file
with open(f"{script_dir}/_events_section.txt", "w", encoding="utf-8") as f:    
    f.write(page_content.group(1).strip())




content = page_content
events_section = re.search(r'رویداد ها\n(.*?)زادروزها', content, re.DOTALL)
if events_section==None:
        events_section = re.search(r'رویدادها\n(.*?)زادروزها', content, re.DOTALL)
        if events_section==None:
            events_section = re.search(r'رویدادهای داخلی\n(.*?)زادروزها', content, re.DOTALL)
            if events_section==None:
                events_section = re.search(r'رویدادها\n(.*?)درگذشتگان', content, re.DOTALL)
                if events_section==None:
                    events_section = re.search(r'رویدادها\n(.*?)پدیده‌های', content, re.DOTALL)
                    if events_section==None:
                        print("No events section found!!")
if events_section:
        current_month = None
        for line in events_section.group(1).split('\n'):
            line = line.strip()
            # Skip empty lines
            if not line:
                continue
                
            # Check if line is a month name
            if line in persian_months:
                current_month = persian_months[line]
                continue
            
            # Handle lines with dash/hyphen
            if '–' in line or '-' in line:
                # First remove month name if it appears in the line
                for month in persian_months:
                    line = line.replace(f' {month}', '')
                
                parts = re.split('–|-', line, 1)
                if len(parts) == 2:
                    day = parts[0].strip()
                    title = parts[1].strip()
                    if day.isdigit():
                        events_data.append({
                            'day': int(day),
                            'month': current_month,
                            'title': title
                        })
                    else:
                        # If split happened but day is not digit, treat whole line as title
                        events_data.append({
                            'day': 0,
                            'month': current_month,
                            'title': line
                        })
            # Handle lines without dash but with content
            elif line and current_month and not line in persian_months:
                events_data.append({
                    'day': 0,
                    'month': current_month,
                    'title': line
                })

print(events_section)

#save events data to a csv file
events_df = pd.DataFrame(events_data)
events_df['year'] = year
final_events_df = pd.concat([final_events_df, events_df], ignore_index=True)
final_events_df.to_csv(os.path.join(script_dir, 'eeeeevents_data.csv'), index=False)    