import pandas as pd
import os
script_dir = os.path.dirname(os.path.abspath(__file__))

def create_persian_calendar_df():
    years = range(1300, 1404) 
    data = []
    for year in years:
                data.append({
                    'Year' : year
                })
    
    return pd.DataFrame(data)

persian_calendar_df = create_persian_calendar_df()

persian_calendar_df["Wiki_URL"]= ""


persian_numbers = {
    1: "۱", 2: "۲", 3: "۳", 4: "۴", 5: "۵",
    6: "۶", 7: "۷", 8: "۸", 9: "۹", 0: "۰",}
print(persian_calendar_df.head())


def convert_to_persian_number(number):
    persian_str = ''
    for digit in str(number):
        persian_str += persian_numbers[int(digit)]
    return persian_str

base_url = "https://fa.wikipedia.org/wiki/"
ending = "_(خورشیدی)"

# Create URLs with Persian numbers
for i in range(len(persian_calendar_df)):
    year = persian_calendar_df.loc[i, 'Year']
    persian_year = convert_to_persian_number(year)
    persian_calendar_df.loc[i, 'Wiki_URL'] = base_url + persian_year + ending

# Save the data
persian_calendar_df.to_csv(script_dir+"/years_with_url.csv", index=False)
print("Years with URLs saved to years_with_url.csv")