
import pandas as pd
import os
import requests

script_dir = os.path.dirname(os.path.abspath(__file__))

#import json files and rename the era_persian to era_english and era_english to era_persian

with open(script_dir + "/assets/js/df.json", 'r', encoding='utf-8') as f:
    Events_data = pd.read_json(f)

'''Events_data = Events_data.rename(columns={
    'era_persian': 'era_english',
    'era_english': 'era_persian'
})'''

#correct the spelling mistakes in the era_persian column
Events_data['era_persian'] = Events_data['era_persian'].replace({
    'ساسانییان': 'ساسانیان',
})
#save the dataframe to a json file
Events_data.to_json(script_dir + "/assets/js/df_corrected.json", force_ascii=False, orient='records', indent=4)
