#!/usr/bin/env python3
"""
Verification script to check the results of json_cleaner.py
"""

import json
import os
from collections import Counter

def verify_json_cleaning():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Load the processed file
    with open(os.path.join(script_dir, 'data', 'merged_df.json'), 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"Total records in processed file: {len(data)}")
    
    # Check year ranges
    years = []
    invalid_years = []
    
    for record in data:
        year = record.get('year', 0)
        try:
            year_int = int(year)
            years.append(year_int)
            
            # Check if year is outside our desired range
            if year_int < 600 or year_int > 2026:
                invalid_years.append(year_int)
                
        except (ValueError, TypeError):
            invalid_years.append(year)
    
    print(f"Year range: {min(years)} - {max(years)}")
    print(f"Records with invalid years: {len(invalid_years)}")
    
    if invalid_years:
        print(f"Invalid years found: {invalid_years[:10]}{'...' if len(invalid_years) > 10 else ''}")
    
    # Check for the 2026 record
    records_2026 = [r for r in data if r.get('year') == 2026]
    print(f"Records with year 2026: {len(records_2026)}")
    
    if records_2026:
        print("2026 record details:")
        for key, value in records_2026[0].items():
            print(f"  {key}: {value}")
    
    # Year distribution
    year_counts = Counter(years)
    print(f"\nMost common years:")
    for year, count in year_counts.most_common(10):
        print(f"  {year}: {count} records")
    
    print(f"\nRecords by era:")
    era_counts = Counter([r.get('era_english', 'Unknown') for r in data])
    for era, count in era_counts.most_common():
        print(f"  {era}: {count} records")

if __name__ == "__main__":
    verify_json_cleaning()