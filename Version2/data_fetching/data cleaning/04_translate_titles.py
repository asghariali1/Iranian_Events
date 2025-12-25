import os
import pandas as pd
from deep_translator import GoogleTranslator
from concurrent.futures import ThreadPoolExecutor, as_completed
import time

# Get the current script directory
script_dir = os.path.dirname(os.path.abspath(__file__))

# Import the cleaned data
file_path = os.path.join(script_dir, "./final data/final_merged_data.csv")
data = pd.read_csv(file_path)

# Delete all values in title_english column to re-translate them
data['title_english'] = ''

# Initialize the translator
translator = GoogleTranslator(source='fa', target='en')

def translate_text(text):
    """Translate a single text with retry logic"""
    max_retries = 3
    for attempt in range(max_retries):
        try:
            return translator.translate(text)
        except Exception as e:
            if attempt == max_retries - 1:
                print(f"Failed to translate after {max_retries} attempts: {text[:50]}... Error: {e}")
                return text
            time.sleep(0.5)  # Small delay before retry
    return text

def translate_batch(batch_data):
    """Translate a batch of rows"""
    results = []
    for idx, row in batch_data.iterrows():
        if pd.notna(row.get('title_english')) and str(row.get('title_english')).strip():
            results.append((idx, row['title_english']))
        else:
            translated = translate_text(row['title'])
            results.append((idx, translated))
    return results

# Split data into batches for parallel processing
batch_size = 50  # Adjust based on your needs
batches = [data.iloc[i:i + batch_size] for i in range(0, len(data), batch_size)]

print(f"Translating {len(data)} rows in {len(batches)} batches using parallel processing...")

# Use ThreadPoolExecutor for parallel translation
max_workers = 10  # Number of parallel threads
translated_count = 0

with ThreadPoolExecutor(max_workers=max_workers) as executor:
    # Submit all batches
    future_to_batch = {executor.submit(translate_batch, batch): i for i, batch in enumerate(batches)}
    
    # Process completed batches
    for future in as_completed(future_to_batch):
        batch_num = future_to_batch[future]
        try:
            results = future.result()
            for idx, translation in results:
                data.at[idx, 'title_english'] = translation
                translated_count += 1
            print(f"Completed batch {batch_num + 1}/{len(batches)} ({translated_count}/{len(data)} rows)")
        except Exception as e:
            print(f"Error processing batch {batch_num}: {e}")

# Save the translated data
output_file_path = os.path.join(script_dir, "./final data/final_data_translated.csv")
data.to_csv(output_file_path, index=False, encoding='utf-8-sig')

print(f"\nTranslation completed! Translated {translated_count} rows. Saved to: {output_file_path}")
