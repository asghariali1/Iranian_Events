// Statistics Dashboard JavaScript
class IranianHistoryStats {
    constructor() {
        this.data = [];
        this.charts = {};
        this.eraColors = {
            'Sasanian': '#FF4500',
            'Islamic Era': '#228B22', 
            'Safavid': '#1E90FF',
            'Afsharian': '#FF6347',
            'Zandian': '#9932CC',
            'Qajar': '#DC143C',
            'Pahlavi': '#FFD700',
            'Islamic Republic': '#006400'
        };
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.calculateOverviewStats();
            this.createCharts();
            this.populateTables();
        } catch (error) {
            console.error('Error initializing stats:', error);
            this.showError('Failed to load statistical data');
        }
    }

    async loadData() {
        try {
            // Load data from multiple category JSON files
            const categoryFiles = [
                { file: 'Politics_data.json', category: 'Politics' },
                { file: 'Economy_data.json', category: 'Economy' },
                { file: 'Social_data.json', category: 'Social' },
                { file: 'Technology_Science_data.json', category: 'Technology_Science' },
                { file: 'Health_data.json', category: 'Health' },
                { file: 'Crime_Safety_data.json', category: 'Crime_Safety' },
                { file: 'Sports_Entertainment_data.json', category: 'Sports_Entertainment' },
                { file: 'Death_data.json', category: 'Death' },
                { file: 'Natural Disaster_data.json', category: 'Natural_Disaster' }
            ];
            
            const allEvents = [];
            
            // Fetch all category files in parallel
            const fetchPromises = categoryFiles.map(async ({ file, category }) => {
                try {
                    const response = await fetch(`assets/data/${file}`);
                    if (!response.ok) {
                        console.warn(`Failed to load ${file}: ${response.status}`);
                        return [];
                    }
                    const events = await response.json();
                    // Add category to each event if not present
                    return events.map(event => ({
                        ...event,
                        category: event.category || category
                    }));
                } catch (error) {
                    console.warn(`Error loading ${file}:`, error);
                    return [];
                }
            });
            
            const results = await Promise.all(fetchPromises);
            results.forEach(events => allEvents.push(...events));
            
            // Deduplicate events by ID (events can appear in multiple category files)
            const uniqueEvents = new Map();
            allEvents.forEach(event => {
                if (event && typeof event === 'object' && event.id) {
                    uniqueEvents.set(event.id, event);
                }
            });
            
            this.data = Array.from(uniqueEvents.values());
            
            // Validate and clean data
            if (!Array.isArray(this.data)) {
                throw new Error('Invalid data format: expected array');
            }
            
            // Filter out invalid entries
            this.data = this.data.filter(event => event && typeof event === 'object');
            
            console.log(`Loaded ${this.data.length} unique historical events from ${categoryFiles.length} category files (${allEvents.length} total entries before deduplication)`);
        } catch (error) {
            console.error('Failed to load data:', error);
            throw error;
        }
    }

    calculateOverviewStats() {
        try {
            const totalEvents = this.data.length;
            const eras = new Set(this.data.map(event => event && event.era_english).filter(Boolean));
            
            // Count deaths - check both Death field and category
            const deaths = this.data.filter(event => {
                if (!event) return false;
                // Check if Death field is 1 (could be int or float)
                return event.Death === 1 || event.Death === 1.0 || event.category === 'Death';
            }).length;
            
            console.log(`Debug: Total events: ${totalEvents}, Deaths found: ${deaths}`);
            console.log(`Sample death flags:`, this.data.slice(0, 5).map(e => ({ id: e.id, Death: e.Death, category: e.category })));
            
            const years = this.data
                .map(event => {
                    if (!event || !event.date_gregorian) return null;
                    try {
                        const year = parseInt(event.date_gregorian.split('-')[0]);
                        return !isNaN(year) && isFinite(year) ? year : null;
                    } catch (e) {
                        return null;
                    }
                })
                .filter(year => year !== null);
            
            let yearSpan = 0;
            if (years.length > 0) {
                const minYear = Math.min(...years);
                const maxYear = Math.max(...years);
                yearSpan = maxYear - minYear;
                console.log(`Year range: ${minYear} - ${maxYear}, span: ${yearSpan}`);
            }

            // Update overview cards with safe values
            const totalEventsEl = document.getElementById('totalEvents');
            const totalErasEl = document.getElementById('totalEras');
            const totalDeathsEl = document.getElementById('totalDeaths');
            const yearSpanEl = document.getElementById('yearSpan');

            if (totalEventsEl) totalEventsEl.textContent = totalEvents.toLocaleString();
            if (totalErasEl) totalErasEl.textContent = eras.size.toString();
            if (totalDeathsEl) totalDeathsEl.textContent = deaths.toLocaleString();
            if (yearSpanEl) yearSpanEl.textContent = `${yearSpan} years`;
            
            // Update category counts
            this.updateCategoryCounts();
        } catch (error) {
            console.error('Error calculating overview stats:', error);
        }
    }

    updateCategoryCounts() {
        const categories = {
            Politics: 0,
            Social: 0,
            Economy: 0,
            Health: 0,
            'Natural Disaster': 0,
            'Technology/Science': 0,
            'Sports/Entertainment': 0,
            'Crime/Safety': 0
        };

        this.data.forEach(event => {
            if (event.Politics === 1) categories.Politics++;
            if (event.Social === 1) categories.Social++;
            if (event.Economy === 1) categories.Economy++;
            if (event.Health === 1) categories.Health++;
            if (event['Natural Disaster'] === 1) categories['Natural Disaster']++;
            if (event['Technology/Science'] === 1) categories['Technology/Science']++;
            if (event['Sports/Entertainment'] === 1) categories['Sports/Entertainment']++;
            if (event['Crime/Safety'] === 1) categories['Crime/Safety']++;
        });

        // Update DOM elements
        const elements = {
            politicsCount: categories.Politics,
            socialCount: categories.Social,
            economyCount: categories.Economy,
            healthCount: categories.Health,
            naturalDisasterCount: categories['Natural Disaster'],
            technologyCount: categories['Technology/Science'],
            sportsCount: categories['Sports/Entertainment'],
            crimeCount: categories['Crime/Safety']
        };

        Object.entries(elements).forEach(([id, count]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = count.toLocaleString();
        });

        console.log('Category counts:', categories);
    }

    createCharts() {
        this.createEraDistributionChart();
        this.createTimelineChart();
        this.createEventTypesChart();
        this.createEraTimelineChart();
        this.createMonthlyChart();
        this.createCategoryChart();
        this.createCategoryTrendsChart();
    }

    createEraDistributionChart() {
        try {
            const ctx = document.getElementById('eraDistributionChart').getContext('2d');
            
            // Count events by era with safe data handling
            const eraCount = {};
            this.data.forEach(event => {
                if (event && typeof event === 'object') {
                    const era = event.era_english || 'Unknown';
                    eraCount[era] = (eraCount[era] || 0) + 1;
                }
            });

            const sortedEras = Object.entries(eraCount)
                .sort(([,a], [,b]) => b - a);

            this.charts.eraDistribution = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: sortedEras.map(([era]) => era),
                    datasets: [{
                        data: sortedEras.map(([,count]) => count),
                        backgroundColor: sortedEras.map(([era]) => this.eraColors[era] || '#666'),
                        borderWidth: 2,
                        borderColor: 'rgba(255, 255, 255, 0.8)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                color: 'white',
                                padding: 15,
                                font: { size: 12 }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: (context) => {
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((context.raw / total) * 100).toFixed(1);
                                    return `${context.label}: ${context.raw.toLocaleString()} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error creating era distribution chart:', error);
        }
    }

    createTimelineChart() {
        try {
            const ctx = document.getElementById('timelineChart').getContext('2d');
        
        // Group events by century
        const centuryCount = {};
        this.data.forEach(event => {
            if (!event || !event.date_gregorian) return;
            const year = parseInt(event.date_gregorian.split('-')[0]);
            if (year && !isNaN(year)) {
                const century = Math.floor(year / 100) * 100;
                const centuryLabel = year > 0 ? `${century}s CE` : `${Math.abs(century)}s BCE`;
                centuryCount[centuryLabel] = (centuryCount[centuryLabel] || 0) + 1;
            }
        });

        const sortedCenturies = Object.entries(centuryCount)
            .sort(([a], [b]) => {
                const aYear = parseInt(a.replace(/[^\d-]/g, ''));
                const bYear = parseInt(b.replace(/[^\d-]/g, ''));
                return aYear - bYear;
            });

        this.charts.timeline = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sortedCenturies.map(([century]) => century),
                datasets: [{
                    label: 'Events',
                    data: sortedCenturies.map(([,count]) => count),
                    backgroundColor: 'rgba(54, 162, 235, 0.8)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: 'white' }
                    }
                },
                scales: {
                    x: {
                        ticks: { 
                            color: 'white',
                            maxRotation: 45
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        ticks: { color: 'white' },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
        } catch (error) {
            console.error('Error creating timeline chart:', error);
        }
    }

    createEventTypesChart() {
        const ctx = document.getElementById('eventTypesChart').getContext('2d');
        
        // Count events by category fields
        const categories = {
            'Politics': 0,
            'Social': 0,
            'Economy': 0,
            'Health': 0,
            'Natural Disaster': 0,
            'Technology/Science': 0,
            'Sports/Entertainment': 0,
            'Crime/Safety': 0,
            'Deaths': 0
        };

        this.data.forEach(event => {
            if (event.Politics === 1) categories['Politics']++;
            if (event.Social === 1) categories['Social']++;
            if (event.Economy === 1) categories['Economy']++;
            if (event.Health === 1) categories['Health']++;
            if (event['Natural Disaster'] === 1) categories['Natural Disaster']++;
            if (event['Technology/Science'] === 1) categories['Technology/Science']++;
            if (event['Sports/Entertainment'] === 1) categories['Sports/Entertainment']++;
            if (event['Crime/Safety'] === 1) categories['Crime/Safety']++;
            if (event.Death === 1 || event.Death === 1.0 || event.category === 'Death') categories['Deaths']++;
        });

        const sortedCategories = Object.entries(categories)
            .filter(([,count]) => count > 0)
            .sort(([,a], [,b]) => b - a);

        this.charts.eventTypes = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: sortedCategories.map(([cat]) => cat),
                datasets: [{
                    data: sortedCategories.map(([,count]) => count),
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF',
                        '#FF9F40',
                        '#C9CBCF',
                        '#8E44AD',
                        '#FF4444'
                    ],
                    borderWidth: 2,
                    borderColor: 'rgba(255, 255, 255, 0.8)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: 'white',
                            padding: 15,
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.raw / total) * 100).toFixed(1);
                                return `${context.label}: ${context.raw.toLocaleString()} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    createEraTimelineChart() {
        try {
            const ctx = document.getElementById('eraTimelineChart').getContext('2d');
            
            // Filter events from 1900 to 2025 with valid dates
            const validEvents = this.data.filter(event => {
                if (!event || !event.date_gregorian) return false;
                
                try {
                    const dateParts = event.date_gregorian.split('-');
                    const year = parseInt(dateParts[0]);
                    const month = parseInt(dateParts[1]);
                    const day = parseInt(dateParts[2]);
                    
                    return !isNaN(year) && year >= 1900 && year <= 2025 && 
                           month >= 1 && month <= 12 &&
                           day >= 1 && day <= 31;
                } catch (e) {
                    return false;
                }
            });

            // Group events by date (daily basis)
            const dailyFrequency = {};
            
            validEvents.forEach(event => {
                const dateParts = event.date_gregorian.split('-');
                const year = parseInt(dateParts[0]);
                const month = parseInt(dateParts[1]);
                const day = parseInt(dateParts[2]);
                
                // Create date string and JavaScript Date object
                const dateStr = event.date_gregorian;
                const dateObj = new Date(year, month - 1, day);
                
                if (!dailyFrequency[dateStr]) {
                    dailyFrequency[dateStr] = {
                        date: dateObj,
                        dateStr: dateStr,
                        count: 0,
                        events: []
                    };
                }
                
                dailyFrequency[dateStr].count++;
                dailyFrequency[dateStr].events.push(event);
            });

            // Sort dates chronologically and prepare data
            const sortedDates = Object.values(dailyFrequency)
                .sort((a, b) => a.date - b.date);

            // Create time series data for line chart
            const chartData = sortedDates.map(dateData => ({
                x: dateData.date,
                y: dateData.count,
                dateStr: dateData.dateStr,
                events: dateData.events
            }));

            // Calculate moving average for smoother trend line
            const movingAverageWindow = 30; // 30-day moving average
            const movingAverageData = [];
            
            for (let i = 0; i < chartData.length; i++) {
                const start = Math.max(0, i - Math.floor(movingAverageWindow / 2));
                const end = Math.min(chartData.length, i + Math.floor(movingAverageWindow / 2) + 1);
                const window = chartData.slice(start, end);
                const average = window.reduce((sum, point) => sum + point.y, 0) / window.length;
                
                movingAverageData.push({
                    x: chartData[i].x,
                    y: average
                });
            }

            this.charts.eraTimeline = new Chart(ctx, {
                type: 'line',
                data: {
                    datasets: [{
                        label: 'Daily Event Frequency',
                        data: chartData,
                        borderColor: 'rgba(75, 192, 192, 0.8)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        pointBackgroundColor: 'rgba(75, 192, 192, 1)',
                        pointBorderColor: 'rgba(255, 255, 255, 0.8)',
                        pointRadius: 3,
                        pointHoverRadius: 6,
                        borderWidth: 2,
                        fill: false,
                        tension: 0.1
                    }, {
                        label: '30-Day Moving Average',
                        data: movingAverageData,
                        borderColor: 'rgba(255, 99, 132, 0.8)',
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        pointRadius: 0,
                        pointHoverRadius: 0,
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'nearest',
                        axis: 'x',
                        intersect: false
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                color: 'white',
                                padding: 20,
                                font: { size: 12 }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                title: (context) => {
                                    const dataPoint = context[0].raw;
                                    if (dataPoint && dataPoint.dateStr) {
                                        return new Date(dataPoint.dateStr).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        });
                                    }
                                    return '';
                                },
                                label: (context) => {
                                    if (context.datasetIndex === 0) {
                                        const dataPoint = context.raw;
                                        return `Events: ${dataPoint.y}`;
                                    } else {
                                        return `30-Day Average: ${context.parsed.y.toFixed(1)}`;
                                    }
                                },
                                afterLabel: (context) => {
                                    if (context.datasetIndex === 0) {
                                        const dataPoint = context.raw;
                                        if (dataPoint.events && dataPoint.events.length > 0) {
                                            const samples = dataPoint.events.slice(0, 3).map(event => 
                                                `• ${(event.title_english || event.title || 'Unknown').substring(0, 50)}...`
                                            );
                                            return ['', 'Events:', ...samples];
                                        }
                                    }
                                    return '';
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            type: 'time',
                            min: new Date(1900, 0, 1),
                            max: new Date(2025, 11, 31),
                            time: {
                                unit: 'year',
                                stepSize: 5,
                                displayFormats: {
                                    year: 'yyyy'
                                },
                                tooltipFormat: 'MMM dd, yyyy'
                            },
                            title: {
                                display: true,
                                text: 'Date (1900-2025)',
                                color: 'white',
                                font: { size: 14, weight: 'bold' }
                            },
                            ticks: { 
                                color: 'white',
                                maxRotation: 45,
                                font: { size: 11 },
                                maxTicksLimit: 25
                            },
                            grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Number of Events per Day',
                                color: 'white',
                                font: { size: 14, weight: 'bold' }
                            },
                            ticks: { 
                                color: 'white',
                                callback: function(value) {
                                    return Math.round(value);
                                }
                            },
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            beginAtZero: true
                        }
                    },
                    animation: {
                        duration: 1500,
                        easing: 'easeInOutQuart'
                    }
                }
            });
        } catch (error) {
            console.error('Error creating daily frequency timeline chart:', error);
        }
    }

    createMonthlyChart() {
        const ctx = document.getElementById('monthlyChart').getContext('2d');
        
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        const monthlyCount = new Array(12).fill(0);
        this.data.forEach(event => {
            if (!event || !event.date_gregorian) return;
            try {
                const month = parseInt(event.date_gregorian.split('-')[1]);
                if (month && month >= 1 && month <= 12) {
                    monthlyCount[month - 1]++;
                }
            } catch (e) {
                // Skip invalid dates
            }
        });

        this.charts.monthly = new Chart(ctx, {
            type: 'line',
            data: {
                labels: monthNames,
                datasets: [{
                    label: 'Events',
                    data: monthlyCount,
                    borderColor: '#FFD700',
                    backgroundColor: 'rgba(255, 215, 0, 0.2)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: 'white' }
                    }
                },
                scales: {
                    x: {
                        ticks: { 
                            color: 'white',
                            maxRotation: 45
                        },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    y: {
                        ticks: { color: 'white' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                }
            }
        });
    }

    createCategoryChart() {
        const ctx = document.getElementById('categoryChart').getContext('2d');
        
        // Count events by category fields (these are binary flags in new data)
        const categories = {
            'Politics': 0,
            'Social': 0,
            'Economy': 0,
            'Health': 0,
            'Natural Disaster': 0,
            'Technology/Science': 0,
            'Sports/Entertainment': 0,
            'Crime/Safety': 0,
            'Deaths': 0
        };

        this.data.forEach(event => {
            if (event.Politics === 1) categories['Politics']++;
            if (event.Social === 1) categories['Social']++;
            if (event.Economy === 1) categories['Economy']++;
            if (event.Health === 1) categories['Health']++;
            if (event['Natural Disaster'] === 1) categories['Natural Disaster']++;
            if (event['Technology/Science'] === 1) categories['Technology/Science']++;
            if (event['Sports/Entertainment'] === 1) categories['Sports/Entertainment']++;
            if (event['Crime/Safety'] === 1) categories['Crime/Safety']++;
            if (event.Death === 1 || event.Death === 1.0 || event.category === 'Death') categories['Deaths']++;
        });

        const sortedCategories = Object.entries(categories)
            .filter(([,count]) => count > 0)
            .sort(([,a], [,b]) => b - a);

        this.charts.category = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sortedCategories.map(([cat]) => cat),
                datasets: [{
                    label: 'Number of Events',
                    data: sortedCategories.map(([,count]) => count),
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(255, 206, 86, 0.8)',
                        'rgba(75, 192, 192, 0.8)',
                        'rgba(153, 102, 255, 0.8)',
                        'rgba(255, 159, 64, 0.8)',
                        'rgba(199, 199, 199, 0.8)',
                        'rgba(83, 102, 255, 0.8)',
                        'rgba(142, 68, 173, 0.8)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)',
                        'rgba(199, 199, 199, 1)',
                        'rgba(83, 102, 255, 1)',
                        'rgba(142, 68, 173, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const total = sortedCategories.reduce((sum, [,count]) => sum + count, 0);
                                const percentage = ((context.raw / total) * 100).toFixed(1);
                                return `${context.raw.toLocaleString()} events (${percentage}%)`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { 
                            color: 'white',
                            maxRotation: 45,
                            minRotation: 45
                        },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { 
                            color: 'white',
                            callback: function(value) {
                                return value.toLocaleString();
                            }
                        },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                }
            }
        });
    }

    createCategoryTrendsChart() {
        try {
            const ctx = document.getElementById('categoryTrendsChart').getContext('2d');
            
            // Get year range from data
            const years = this.data
                .map(event => {
                    if (!event || !event.date_gregorian) return null;
                    try {
                        const year = parseInt(event.date_gregorian.split('-')[0]);
                        return !isNaN(year) && isFinite(year) ? year : null;
                    } catch (e) {
                        return null;
                    }
                })
                .filter(year => year !== null);
            
            if (years.length === 0) {
                console.warn('No valid years found for category trends chart');
                return;
            }
            
            const minYear = Math.min(...years);
            const maxYear = Math.max(...years);
            
            // Create year bins (every 5 years for better readability)
            const yearBins = [];
            for (let year = Math.floor(minYear / 5) * 5; year <= maxYear; year += 5) {
                yearBins.push(year);
            }
            
            // Count events by category and year bin
            const categoryData = {
                'Politics': new Array(yearBins.length).fill(0),
                'Social': new Array(yearBins.length).fill(0),
                'Economy': new Array(yearBins.length).fill(0),
                'Health': new Array(yearBins.length).fill(0),
                'Natural Disaster': new Array(yearBins.length).fill(0),
                'Technology/Science': new Array(yearBins.length).fill(0),
                'Sports/Entertainment': new Array(yearBins.length).fill(0),
                'Crime/Safety': new Array(yearBins.length).fill(0),
                'Deaths': new Array(yearBins.length).fill(0)
            };
            
            this.data.forEach(event => {
                if (!event || !event.date_gregorian) return;
                
                try {
                    const year = parseInt(event.date_gregorian.split('-')[0]);
                    if (isNaN(year)) return;
                    
                    // Find the appropriate year bin
                    const binIndex = Math.floor((year - yearBins[0]) / 5);
                    if (binIndex >= 0 && binIndex < yearBins.length) {
                        if (event.Politics === 1) categoryData['Politics'][binIndex]++;
                        if (event.Social === 1) categoryData['Social'][binIndex]++;
                        if (event.Economy === 1) categoryData['Economy'][binIndex]++;
                        if (event.Health === 1) categoryData['Health'][binIndex]++;
                        if (event['Natural Disaster'] === 1) categoryData['Natural Disaster'][binIndex]++;
                        if (event['Technology/Science'] === 1) categoryData['Technology/Science'][binIndex]++;
                        if (event['Sports/Entertainment'] === 1) categoryData['Sports/Entertainment'][binIndex]++;
                        if (event['Crime/Safety'] === 1) categoryData['Crime/Safety'][binIndex]++;
                        if (event.Death === 1 || event.Death === 1.0 || event.category === 'Death') {
                            categoryData['Deaths'][binIndex]++;
                        }
                    }
                } catch (e) {
                    // Skip invalid entries
                }
            });
            
            // Create datasets for each category
            const colors = [
                { bg: 'rgba(255, 99, 132, 0.6)', border: 'rgba(255, 99, 132, 1)' },
                { bg: 'rgba(54, 162, 235, 0.6)', border: 'rgba(54, 162, 235, 1)' },
                { bg: 'rgba(255, 206, 86, 0.6)', border: 'rgba(255, 206, 86, 1)' },
                { bg: 'rgba(75, 192, 192, 0.6)', border: 'rgba(75, 192, 192, 1)' },
                { bg: 'rgba(153, 102, 255, 0.6)', border: 'rgba(153, 102, 255, 1)' },
                { bg: 'rgba(255, 159, 64, 0.6)', border: 'rgba(255, 159, 64, 1)' },
                { bg: 'rgba(199, 199, 199, 0.6)', border: 'rgba(199, 199, 199, 1)' },
                { bg: 'rgba(83, 102, 255, 0.6)', border: 'rgba(83, 102, 255, 1)' },
                { bg: 'rgba(255, 68, 68, 0.6)', border: 'rgba(255, 68, 68, 1)' }
            ];
            
            const datasets = Object.entries(categoryData).map(([category, data], index) => ({
                label: category,
                data: data,
                borderColor: colors[index].border,
                backgroundColor: colors[index].bg,
                borderWidth: 2,
                fill: false,
                tension: 0.3,
                pointRadius: 3,
                pointHoverRadius: 6
            }));
            
            this.charts.categoryTrends = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: yearBins.map(year => year.toString()),
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                color: 'white',
                                padding: 15,
                                font: { size: 11 },
                                usePointStyle: true
                            }
                        },
                        tooltip: {
                            callbacks: {
                                title: (context) => {
                                    const year = parseInt(context[0].label);
                                    return `${year}-${year + 4}`;
                                },
                                label: (context) => {
                                    return `${context.dataset.label}: ${context.parsed.y.toLocaleString()} events`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Year',
                                color: 'white',
                                font: { size: 14, weight: 'bold' }
                            },
                            ticks: { 
                                color: 'white',
                                maxRotation: 45,
                                minRotation: 0,
                                autoSkip: true,
                                maxTicksLimit: 20
                            },
                            grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Number of Events',
                                color: 'white',
                                font: { size: 14, weight: 'bold' }
                            },
                            beginAtZero: true,
                            ticks: { 
                                color: 'white',
                                callback: function(value) {
                                    return value.toLocaleString();
                                }
                            },
                            grid: { color: 'rgba(255, 255, 255, 0.1)' }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error creating category trends chart:', error);
        }
    }

    populateTables() {
        this.populateEraStatsTable();
        this.populateTopEventsTable();
    }

    populateEraStatsTable() {
        const tbody = document.querySelector('#eraStatsTable tbody');
        
        // Calculate era statistics
        const eraStats = {};
        this.data.forEach(event => {
            const era = event.era_english || 'Unknown';
            if (!eraStats[era]) {
                eraStats[era] = {
                    total: 0,
                    deaths: 0,
                    events: 0,
                    years: []
                };
            }
            
            eraStats[era].total++;
            if (event.Death === 1) {
                eraStats[era].deaths++;
            } else {
                eraStats[era].events++;
            }
            
            if (event.date_gregorian) {
                try {
                    const year = parseInt(event.date_gregorian.split('-')[0]);
                    if (!isNaN(year)) {
                        eraStats[era].years.push(year);
                    }
                } catch (e) {
                    // Skip invalid dates
                }
            }
        });

        const totalEvents = this.data.length;
        const sortedEras = Object.entries(eraStats)
            .sort(([,a], [,b]) => b.total - a.total);

        tbody.innerHTML = sortedEras.map(([era, stats]) => {
            const years = stats.years.length > 0 ? 
                `${Math.min(...stats.years)} - ${Math.max(...stats.years)}` : 
                'Unknown';
            const percentage = ((stats.total / totalEvents) * 100).toFixed(1);
            const eraClass = this.getEraClass(era);
            
            return `
                <tr class="${eraClass}">
                    <td><strong>${era}</strong></td>
                    <td>${years}</td>
                    <td>${stats.total.toLocaleString()}</td>
                    <td>${stats.deaths.toLocaleString()}</td>
                    <td>${stats.events.toLocaleString()}</td>
                    <td>${percentage}%</td>
                </tr>
            `;
        }).join('');
    }

    populateTopEventsTable() {
        const tbody = document.querySelector('#topEventsTable tbody');
        
        // Get a sample of notable events (spread across eras and categories)
        const notableEvents = this.data
            .filter(event => event.title_english || event.title)
            .sort((a, b) => Math.random() - 0.5) // Randomize
            .slice(0, 20); // Take first 20

        tbody.innerHTML = notableEvents.map(event => {
            let year = 'Unknown';
            if (event.date_gregorian) {
                try {
                    year = event.date_gregorian.split('-')[0];
                } catch (e) {
                    year = 'Unknown';
                }
            }
            
            const title = event.title_english || event.title || 'Unknown Event';
            const era = event.era_english || 'Unknown';
            const type = event.Death === 1 ? 'Death' : 'Event';
            const eraClass = this.getEraClass(era);
            
            return `
                <tr class="${eraClass}">
                    <td><strong>${year}</strong></td>
                    <td>${title.substring(0, 80)}${title.length > 80 ? '...' : ''}</td>
                    <td>${era}</td>
                    <td>${type}</td>
                </tr>
            `;
        }).join('');
    }

    getEraClass(era) {
        const classMap = {
            'Sasanian': 'era-sasanian',
            'Islamic Era': 'era-islamic-era',
            'Safavid': 'era-safavid',
            'Afsharian': 'era-afsharian',
            'Zandian': 'era-zandian',
            'Qajar': 'era-qajar',
            'Pahlavi': 'era-pahlavi',
            'Islamic Republic': 'era-islamic-republic'
        };
        return classMap[era] || '';
    }

    showError(message) {
        const container = document.querySelector('.charts-section');
        container.innerHTML = `
            <div class="error-message" style="text-align: center; padding: 50px; color: #ff6b6b;">
                <h3>⚠️ Error Loading Data</h3>
                <p>${message}</p>
                <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #4a90e2; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Retry
                </button>
            </div>
        `;
    }
}

// Initialize the statistics dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new IranianHistoryStats();
});