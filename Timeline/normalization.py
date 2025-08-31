import pandas as pd
import os
import json
import numpy as np
import requests
from bs4 import BeautifulSoup
import time

script_dir = os.path.dirname(os.path.abspath(__file__))

# Read both cleaned CSV files
df = pd.read_csv(os.path.join(script_dir, "combined_data_with_word_counts.csv"))
# Normalize word_counts to a deviation from mean score
mean_word_count = df['word_counts'].mean()

df['importance_score'] = df['word_counts'].apply(lambda x: (x - mean_word_count) )

# Save the updated DataFrame with importance scores
df.to_csv(os.path.join(script_dir, "combined_data_with_importance_scores.csv"), index=False)
print("Importance scores added and data saved.")

