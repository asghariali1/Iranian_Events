import os
import pandas as pd
# The current script's directory
script_dir = os.path.dirname(os.path.abspath(__file__))

#import all batch files and merge them into a single dataframe
batch_files = [f for f in os.listdir(os.path.join(script_dir, "./final data/batches/gemini_results/")) if f.endswith(".csv")]
merged_df = pd.DataFrame()
for file in batch_files:
    batch_df = pd.read_csv(os.path.join(script_dir, "./final data/batches/gemini_results/", file))
    merged_df = pd.concat([merged_df, batch_df], ignore_index=True)

# import the main df with titles
main_df = pd.read_csv(os.path.join(script_dir, "./final data/cleaned_data.csv"))

# merge the two dataframes on the 'title' column
final_df = pd.merge(main_df, merged_df, on='title', how='left')

# Use category_y (detailed categories) if available, otherwise use category_x
final_df['category'] = final_df.apply(
    lambda row: row['category_y'] if pd.notna(row['category_y']) else row['category_x'], 
    axis=1
)

# drop the extra category columns
final_df = final_df.drop(columns=['category_x', 'category_y'])

# Create one-hot encoded columns for each category
# First, get all unique categories
all_categories = set()
for cat_str in final_df['category'].dropna():
    if isinstance(cat_str, str):
        categories = [c.strip() for c in cat_str.split(',')]
        all_categories.update(categories)

# Sort categories for consistent column ordering
all_categories = sorted(all_categories)

# Create a binary column for each category
for category in all_categories:
    final_df[category] = final_df['category'].apply(
        lambda x: 1 if isinstance(x, str) and category in [c.strip() for c in x.split(',')]
        else 0
    )

print(f"Created one-hot encoded columns for {len(all_categories)} categories: {all_categories}")

#move id column to the first position
id_col = final_df.pop('id')
final_df.insert(0, 'id', id_col)

# rename death column to Death
if 'death' in final_df.columns:
    final_df = final_df.rename(columns={'death': 'Death'})

#drop event and category columns
final_df = final_df.drop(columns=['event', 'category'])

#if each row has not id assing id to it
for i in range(len(final_df)):
    if pd.isna(final_df.at[i, 'id']):
        final_df.at[i, 'id'] = len(final_df) + i

# save the final merged dataframe to a new csv file
final_df.to_csv(os.path.join(script_dir, "./final data/final_merged_data.csv"), index=False, encoding='utf-8-sig')
print("Final merged data saved to final_merged_data.csv")
