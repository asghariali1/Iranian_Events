import pandas as pd
import os
import json
import numpy as np
import requests
from bs4 import BeautifulSoup
import time

script_dir = os.path.dirname(os.path.abspath(__file__))

# Read both cleaned CSV files
deaths_df = pd.read_csv(os.path.join(script_dir, "cleaned_deaths.csv"))
events_df = pd.read_csv(os.path.join(script_dir, "cleaned_events.csv"))

# Add a 'type' column to distinguish
deaths_df['type'] = 'Death'
events_df['type'] = 'Event'

# Concatenate both DataFrames
combined_df = pd.concat([deaths_df, events_df], ignore_index=True)
combined_df = combined_df.sort_values(by=['year', 'month', 'day'])

# Replace NaN with empty string for all columns
combined_df = combined_df.replace({np.nan: ""})

import requests
from bs4 import BeautifulSoup
import time


def count_words_in_wiki_page(url):
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')

            for script in soup(['script', 'style']):
                script.decompose()
            
            # Get text and split into words
            text = soup.get_text(separator=' ')
            # Count words
            words = len(text.split())
            return words
        return 0
    except Exception as e:
        print(f"Error processing {url}: {e}")
        return 0

# Initialize word_counts column
combined_df['word_counts'] = 0

# Process each URL with a delay to be respectful to Wikipedia servers
for idx, row in combined_df.iterrows():
    if row['link']:
        print(f"Processing {idx+1}/{len(combined_df)}: {row['link']}")
        combined_df.at[idx, 'word_counts'] = count_words_in_wiki_page(row['link'])
        time.sleep(1)  # Add 1 second delay between requests

# Save the updated DataFrame with word counts
combined_df.to_csv(os.path.join(script_dir, "combined_data_with_word_counts.csv"), index=False)
print("Word counting completed.")