import wikipediaapi
import pandas as pd
import os
import re
from concurrent.futures import ThreadPoolExecutor
from functools import lru_cache

# The current script's directory
script_dir = os.path.dirname(os.path.abspath(__file__)) 
link_files = pd.read_csv(os.path.join(script_dir, 'years_with_url.csv'))
#link_files= link_files.iloc[0:2,:]
print(len(link_files)  )
final_events_df = pd.DataFrame()
final_deaths_df = pd.DataFrame()

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
    current_month = None
    persian_months = {
        'فروردین': 1, 'اردیبهشت': 2, 'خرداد': 3,
        'تیر': 4, 'مرداد': 5, 'شهریور': 6,
        'مهر': 7, 'آبان': 8, 'آذر': 9,
        'دی': 10, 'بهمن': 11, 'اسفند': 12,
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
        current_month = None
        for line in events_section.group(1).split('\n'):
            event_links = []
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
                    for link, url in links_dict.items():
                        if link in title:  # Check if link text appears in event title
                            event_links.append({'text': link, 'url': url})
                    if day.isdigit():
                        events_data.append({
                            'day': int(day),
                            'month': current_month,
                            'title': title,
                            'links': event_links
                        })
                    else:
                        # If split happened but day is not digit, treat whole line as title
                        events_data.append({
                            'day': 0,
                            'month': current_month,
                            'title': line,
                            'links': event_links
                        })
            # Handle lines without dash but with content
            elif line and current_month and not line in persian_months:
                for link, url in links_dict.items():
                    if link in line:  # Check if link text appears in event title
                        event_links.append({'text': link, 'url': url})
                events_data.append({
                    'day': 0,
                    'month': current_month,
                    'title': line,
                    'links': event_links
                })


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
                    day_month = parts[0].strip().split(' ')
                    if len(day_month) == 2 and day_month[0].isdigit():
                        day = int(day_month[0])
                        month = persian_months.get(day_month[1], None)
                        
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
                            'day': day,
                            'month': month,
                            'person': person,
                            'details': details,
                            'person_links': person_links,
                        })

    # Create DataFrames
    events_df = pd.DataFrame(events_data)
    deaths_df = pd.DataFrame(deaths_data)
    
    return events_df, deaths_df


def process_year(row):
    year = row['Year']
    url = row['Wiki_URL']
    print(f"Processing year: {year}")
    page_content = get_wikipedia_page_content(url)
    if page_content:
        events_df, deaths_df = parse_wikipedia_content(page_content)
        events_df['year'] = year
        deaths_df['year'] = year
        return events_df, deaths_df
    return None

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    link_files = pd.read_csv(os.path.join(script_dir, 'years_with_url.csv'))
    
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

    # Optimize multiple events processing using vectorized operations
    day_month_mask = final_events_df['title'].str.match(r'^\d+\s+[آ-ی]+$')
    day_month_rows = final_events_df[day_month_mask]
    for idx in day_month_rows.index:
        day = int(final_events_df.loc[idx, 'title'].split()[0])
        if idx + 1 < len(final_events_df):
            final_events_df.loc[idx+1:idx+2, 'day'] = day

    # Drop day-month rows more efficiently
    final_events_df = final_events_df[~day_month_mask].reset_index(drop=True)

    # Save results
    final_events_df.to_csv(os.path.join(script_dir, 'events.csv'), 
                          index=False, encoding='utf-8-sig')
    final_deaths_df.to_csv(os.path.join(script_dir, 'deaths.csv'), 
                          index=False, encoding='utf-8-sig')

if __name__ == '__main__':
    main()
