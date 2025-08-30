import requests
import time
from bs4 import BeautifulSoup
import pandas as pd
import pickle
import os

# The current script's directory
script_dir = os.path.dirname(os.path.abspath(__file__))

# Construct the full path to the CSV file
file_path = os.path.join(script_dir, "calender_with_url.csv")

# Load the time window
calendar = pd.read_csv(file_path)
events_dict = {}
deaths_dict = {}

print("Time window loaded")

# Define headers to mimic a web browser
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
}

for i in range(0, 366):
    url = calendar["Wiki_URL"][i]
    month = calendar["Month"][i]
    day = calendar["Day"][i]

    print(f"Fetching URL: {url}")
    start_time = time.time()
    
    try:
        # Add headers and a timeout to the request
        response = requests.get(url, headers=headers, timeout=10)

        # Check for successful response status
        if response.status_code == 200:
            print(f"Page fetched successfully in {time.time() - start_time} seconds")
        else:
            print(f"Unable to download the page. Status code: {response.status_code}")
            continue

    except requests.exceptions.RequestException as e:
        # Catch any request-related errors (e.g., timeout, connection error)
        print(f"An error occurred while fetching {url}: {e}")
        continue

    soup = BeautifulSoup(response.text, 'html.parser')

    # Initialize nested dictionaries if they don't exist
    if month not in events_dict:
        events_dict[month] = {}
    if day not in events_dict[month]:
        events_dict[month][day] = []

    if month not in deaths_dict:
        deaths_dict[month] = {}
    if day not in deaths_dict[month]:
        deaths_dict[month][day] = []

    # Find the events
    h2_events = soup.find('h2', id='رویدادها')
    if h2_events:
        parent_div = h2_events.parent
        next_ul = parent_div.find_next_sibling('ul')
        if next_ul:
            events = next_ul.find_all('li')
            for event in events:
                links = event.find_all('a')
                if len(links) >= 2:
                    year = links[0].get_text(strip=True)
                    title = links[1].get_text(strip=True)
                    link = links[1].get('href') if links[1].get('href') else ''
                    # Convert relative URLs to absolute URLs
                    if link.startswith('/'):
                        link = 'https://fa.wikipedia.org' + link
                    events_dict[month][day].append({
                        'year': year,
                        'title': title,
                        'link': link
                    })

    print("Done with events")

    # Find the deaths
    h2_deaths = soup.find('h2', id='درگذشت‌ها')
    if h2_deaths:
        parent_div = h2_deaths.parent
        next_ul = parent_div.find_next_sibling('ul')
        if next_ul:
            deaths = next_ul.find_all('li')
            for death in deaths:
                death_links = death.find_all('a')
                if len(death_links) >= 2:
                    year = death_links[0].get_text(strip=True)
                    title = death_links[1].get_text(strip=True)
                    link = death_links[1].get('href') if death_links[1].get('href') else ''
                    # Convert relative URLs to absolute URLs
                    if link.startswith('/'):
                        link = 'https://fa.wikipedia.org' + link
                    deaths_dict[month][day].append({
                        'year': year,
                        'title': title,
                        'link': link
                    })
    print("Done with the deaths")


# with open('events.pkl', 'wb') as f:
#     pickle.dump(events_dict, f)

# with open('deaths.pkl', 'wb') as f:
#     pickle.dump(deaths_dict, f)

def convert_dict_to_dataframe(data_dict):
    rows = []
    for month, days_dict in data_dict.items():
        for day, observations in days_dict.items():
            if isinstance(observations, dict):
                observations = [observations]
            elif not isinstance(observations, list):
                continue
            for obs in observations:
                if isinstance(obs, dict) and 'title' in obs and 'year' in obs:
                    rows.append({
                        'title': obs['title'],
                        'year': obs['year'],
                        'month': month,
                        'day': day,
                        'link': obs.get('link', '')  # Add link to DataFrame
                        })

        return pd.DataFrame(rows)

event_df = convert_dict_to_dataframe(events_dict)
death_df = convert_dict_to_dataframe(deaths_dict)

# Save the events DataFrame to a CSV file
event_df.to_csv(script_dir+'/events.csv', index=False, encoding='utf-8-sig')
print("Events data saved to events.csv")

# Save the deaths DataFrame to a CSV file
death_df.to_csv(script_dir+'/deaths.csv', index=False, encoding='utf-8-sig')
print("Deaths data saved to deaths.csv")