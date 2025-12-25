import wikipediaapi
import pandas as pd
import os
import re
from concurrent.futures import ThreadPoolExecutor
from functools import lru_cache

# Get the wikiperdia full text of a page with url 
@lru_cache(maxsize=1000)
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


def parse_wikipedia_content(page):
    # Read the content
    content = page['text']
    links_dict = page['links']

    # Initialize lists for events and deaths
    events_data = []
    deaths_data = []
    
    # Initialize variables
    persian_months = {
        'فروردین': 1, 'اردیبهشت': 2, 'خرداد': 3,
        'تیر': 4, 'مرداد': 5, 'شهریور': 6,
        'مهر': 7, 'آبان': 8, 'آذر': 9,
        'دی': 10, 'بهمن': 11, 'اسفند': 12
    }

    # Parse events section
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
        current_year = None
        for line in events_section.group(1).split('\n'):
            event_links = []
            if line:
                current_year = line.split()[0]
            #print(f"Current year: {current_year}")###########################
            line = line.strip()
            # Skip empty lines
            if not line:
                continue
            # Handle lines with dash/hyphen
            if '–' in line or '-' in line:
                # First remove year
                line = line.replace(f' {current_year}', '')
                parts = re.split('–|-', line, 1)
                print(len(parts)   )
                if len(parts) == 2:
                    title = parts[1].strip()
                    #print(f"Title: {title}")###########################
                    for link, url in links_dict.items():
                        if link in title:  # Check if link text appears in event title
                            event_links.append({'text': link, 'url': url})
                    if current_year.isdigit():
                        events_data.append({
                            'years': int(current_year),
                            'title': title,
                            'links': event_links
                        })
            # Handle lines without dash but with content
            """elif line and current_month and not line in persian_months:
                for link, url in links_dict.items():
                    if link in line:  # Check if link text appears in event title
                        event_links.append({'text': link, 'url': url})
                events_data.append({
                    'day': 0,
                    'month': current_month,
                    'title': line,
                    'links': event_links
                })"""


    # Parse deaths section
    deaths_section = re.search(r'درگذشت‌ها\n(.*)', content, re.DOTALL)
    if deaths_section==None:
        deaths_section = re.search(r'درگذشتگان\n(.*?)', content, re.DOTALL)
        if deaths_section==None:
            deaths_section = re.search(r'درگذشت‌ها\n(.*?)', content, re.DOTALL)
            if deaths_section==None:
                deaths_section = re.search(r'مرگ‌ها\n(.*)', content, re.DOTALL)
                if deaths_section==None:
                    print("No deaths section found!!")
    if deaths_section:
        for line in deaths_section.group(1).split('\n'):
            person_links = []
            if '–' in line or '-' in line:
                parts = re.split('–|-', line, 1)
                if len(parts) == 2:
                    year = parts[0]
                        # Split person and details
                    person_details = parts[1].strip().split('،', 1)
                    if person_details==[]:
                        person_details = parts[1].strip().split(':', 1)
                    person = person_details[0].strip()
                    details = person_details[1].strip() if len(person_details) > 1 else ""
                    for title, url in links_dict.items():
                        if title in person:
                            person_links.append({'text': title, 'url': url})
                    deaths_data.append({
                            'year': year,
                            'person': person,
                            'details': details,
                            'person_links': person_links,
                        })

    # Create DataFrames
    events_df = pd.DataFrame(events_data)
    deaths_df = pd.DataFrame(deaths_data)
    
    return events_df, deaths_df


def process_year(row):
    day = row['Day']
    month = row['Month']
    url = row['Wiki_URL']
    print(f"Processing day: {day} of month {month}")
    page_content = get_wikipedia_page_content(url)
    if page_content:
        events_df, deaths_df = parse_wikipedia_content(page_content)
        events_df['day'] = day
        deaths_df['day'] = day
        events_df['month'] = month
        deaths_df['month'] = month
        return events_df, deaths_df
    return None

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    link_files = pd.read_csv(os.path.join(script_dir, 'calender_with_url.csv'))
    #link_files= link_files.iloc[0:1,:]
    
    # Process years in parallel
    events_list = []
    deaths_list = []
    
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(process_year, row) for _, row in link_files.iterrows()]
        for future in futures:
            result = future.result()
            if result:
                events_df, deaths_df = result
                events_list.append(events_df)
                deaths_list.append(deaths_df)

    # Combine results
    final_events_df = pd.concat(events_list, ignore_index=True)
    final_deaths_df = pd.concat(deaths_list, ignore_index=True)

    # Save results
    final_events_df.to_csv(os.path.join(script_dir, 'calender_events.csv'), 
                          index=False, encoding='utf-8-sig')
    final_deaths_df.to_csv(os.path.join(script_dir, 'calender_deaths.csv'), 
                          index=False, encoding='utf-8-sig')

if __name__ == '__main__':
    main()
