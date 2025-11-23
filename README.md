# Iranian Events Timeline

An interactive web-based timeline visualization of Iranian historical events and notable deaths, sourced from Persian Wikipedia. This project collects, processes, and presents historical data in an engaging timeline format.

## 🌟 Features

- **Comprehensive Historical Data**: Events and notable deaths from Iranian history
- **Interactive Timeline**: Navigate through Persian history with an intuitive interface
- **Data Visualization**: Statistics and insights about historical events
- **Multi-language Support**: Persian and English interfaces
- **Wikipedia Integration**: Direct links to source articles
- **Importance Scoring**: Events ranked by significance based on multiple factors
- **Category Classification**: Events organized by type (political, cultural, military, etc.)

## 📁 Project Structure

```
Iranian_Events/
├── Wikipedia_data_collector/    # Scripts to scrape data from Persian Wikipedia
├── Data_Processing/             # Data cleaning and preprocessing scripts
├── Timeline/                    # Timeline generation and importance scoring
├── website2/                    # Main web interface
├── events.csv                   # Processed events data
└── deaths.csv                   # Processed deaths data
```

## 🚀 Getting Started

### Prerequisites

- Python 3.12+
- Node.js (for serving the website)
- pip (Python package manager)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/asghariali1/Iranian_Events.git
   cd Iranian_Events
   ```

2. **Set up Python virtual environment**
   ```bash
   python3 -m venv myenv
   source myenv/bin/activate  # On Windows: myenv\Scripts\activate
   ```

3. **Install Python dependencies**
   ```bash
   pip install pandas wikipediaapi requests beautifulsoup4 numpy
   ```

4. **Install Node.js dependencies**
   ```bash
   npm install
   ```

## 🎮 Usage

### Running the Website

To view the interactive timeline:

```bash
npm run dev
```

Then open your browser to `http://localhost:3000` (or the port specified by serve).

### Data Collection

To collect fresh data from Wikipedia:

```bash
cd Wikipedia_data_collector
python Datacollectionwith_API.py
```

### Data Processing

To process and clean the collected data:

```bash
cd Data_Processing
python Data_preprocessing.py
python Converting_to_English.py
python category_finder.py
```

### Generate Timeline

To create the final timeline with importance scores:

```bash
cd Timeline
python importance_score.py
python normalization.py
```

## 📊 Data Pipeline

1. **Data Collection** (`Wikipedia_data_collector/`)
   - Scrapes Persian Wikipedia for historical events and deaths
   - Uses Wikipedia API for structured data extraction
   - Collects calendar-based and year-based entries

2. **Data Preprocessing** (`Data_Processing/`)
   - Cleans and standardizes date formats
   - Converts Persian digits to English
   - Matches person names with Wikipedia links
   - Translates content to English
   - Categorizes events by type

3. **Importance Scoring** (`Timeline/`)
   - Calculates importance scores based on:
     - Wikipedia article length
     - Number of references
     - Link connectivity
   - Normalizes scores for visualization

4. **Web Interface** (`website2/`)
   - Interactive timeline display
   - Filtering and search capabilities
   - Statistics dashboard
   - Responsive design

## 🛠️ Key Scripts

- `Datacollectionwith_API.py`: Main data collection script using Wikipedia API
- `Data_preprocessing.py`: Core data cleaning and link matching
- `Converting_to_English.py`: Translates Persian content to English
- `category_finder.py`: Categorizes events into types
- `importance_score.py`: Calculates event importance metrics
- `verify_cleaning.py`: Validates data quality

## 📈 Data Format

### Events CSV Structure
- `year`, `month`, `day`: Date information
- `event`: Event description
- `link`: Wikipedia article URL
- `category`: Event type/category
- `importance_score`: Calculated significance

### Deaths CSV Structure
- `year`, `month`, `day`: Date information
- `person`: Person's name
- `description`: Brief description
- `person_link`: Wikipedia article URL

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Data sourced from Persian Wikipedia (fa.wikipedia.org)
- Built with Python, pandas, and Wikipedia API
- Web interface powered by modern JavaScript and CSS

## 📧 Contact

Project Link: [https://github.com/asghariali1/Iranian_Events](https://github.com/asghariali1/Iranian_Events)

## 🔮 Future Enhancements

- [ ] Add more historical periods
- [ ] Implement advanced filtering options
- [ ] Add user contributions system
- [ ] Create mobile app version
- [ ] Add multimedia content (images, maps)
- [ ] Implement machine learning for better categorization
- [ ] Add multilingual support for more languages