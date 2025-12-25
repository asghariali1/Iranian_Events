import os
import pandas as pd
# The current script's directory
script_dir = os.path.dirname(os.path.abspath(__file__))

df=pd.read_csv(os.path.join(script_dir, "./final data/cleaned_data.csv"))

#drop all rows with death in the category column
df = df[df['category'] != 'death']

# Isolate the 'title' column
titles_df = df[['title']].copy()



# add id column
titles_df.insert(0, 'id', range(1, 1 + len(titles_df)))

#drop the category column if it exists
if 'category' in titles_df.columns:
    titles_df = titles_df.drop(columns=['category'])

#add category column with empty values
titles_df['category'] = ''


# create bathces of 200 rows and save each batch to a separate CSV file
batch_size = 200
num_batches = (len(titles_df) + batch_size - 1) // batch_size  
for i in range(num_batches):
    batch_df = titles_df[i*batch_size:(i+1)*batch_size]
    batch_df.to_csv(os.path.join(script_dir, f"./final data/batches/isolated_titles_batch_{i+1}.csv"), index=False, encoding='utf-8-sig')
    print(f"Batch {i+1} saved to isolated_titles_batch_{i+1}.csv")

