#!/usr/bin/env python3
"""
Script to clean merged_df.json by:
1. Removing records with years < 600 or > 2025
2. Adding a new observation for year 2026
"""

import json
import os
from pathlib import Path

def main():
    # Get script directory
    script_dir = Path(__file__).parent
    
    # Define file paths
    input_file = script_dir / 'data' / 'merged_df.json'
    output_file = script_dir / 'data' / 'merged_df.json'  # Overwrite the original file
    backup_file = script_dir / 'data' / 'merged_df_backup.json'  # Create backup
    
    print(f"Processing file: {input_file}")
    
    # Check if input file exists
    if not input_file.exists():
        print(f"Error: Input file {input_file} does not exist!")
        return
    
    try:
        # Load the JSON data
        print("Loading JSON data...")
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print(f"Original data count: {len(data)}")
        
        # Create backup before processing
        print("Creating backup...")
        with open(backup_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        # Filter data: keep only years between 600 and 2025 (inclusive)
        filtered_data = []
        removed_count = 0
        
        print("Filtering data...")
        for record in data:
            year = record.get('year', 0)
            
            # Handle different year types (int, str, None)
            try:
                if isinstance(year, str):
                    year = int(year)
                elif year is None:
                    year = 0
                else:
                    year = int(year)
            except (ValueError, TypeError):
                year = 0
                print(f"Warning: Invalid year value: {record.get('year', 'None')}")
            
            # Keep records with years between 600 and 2025
            if 600 <= year <= 2025:
                filtered_data.append(record)
            else:
                removed_count += 1
                if removed_count <= 10:  # Show first 10 removed records
                    print(f"Removed record with year: {record.get('year', 'None')}")
        
        print(f"Removed {removed_count} records with years outside 600-2025 range")
        print(f"Remaining records: {len(filtered_data)}")
        
        # Add the new observation for 2026
        new_observation = {
            "year": 2026,
            "month": "1",
            "day": "1",
            "title": "ناشناس",
            "links": "",
            "year_gregorian": 2026,
            "month_gregorian": "01",
            "day_gregorian": "01",
            "link": "",
            "link_english": "",
            "title_english": "Unknown",
            "Politics": "",
            "Social": "",
            "Natural Disaster": "",
            "Science": "",
            "Art": "",
            "Sports": "",
            "type": "event",
            "details": "",
            "details_english": "UNKNOWN",
            "era_persian": "نیاز به نامگذاری",
            "era_english": "New Folder",
            "date_gregorian": "2026-01-01",
            "date": "فروردین 01, 1405",
            "image": ""
        }
        
        # Add the new observation to the end
        filtered_data.append(new_observation)
        print("Added new observation for year 2026")
        
        # Save the cleaned data
        print("Saving cleaned data...")
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(filtered_data, f, ensure_ascii=False, indent=2)
        
        print(f"\nProcessing complete!")
        print(f"Final record count: {len(filtered_data)}")
        print(f"Records removed: {removed_count}")
        print(f"Records added: 1")
        print(f"Output saved to: {output_file}")
        print(f"Backup created at: {backup_file}")
        
        # Show some statistics
        years = []
        for record in filtered_data:
            try:
                year = int(record.get('year', 0))
                if year > 0:
                    years.append(year)
            except (ValueError, TypeError):
                pass
        
        if years:
            print(f"\nYear range in cleaned data: {min(years)} - {max(years)}")
        
    except FileNotFoundError:
        print(f"Error: File {input_file} not found!")
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON format - {e}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
