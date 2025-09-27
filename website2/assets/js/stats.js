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
            const response = await fetch('assets/js/df.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.data = await response.json();
            
            // Validate and clean data
            if (!Array.isArray(this.data)) {
                throw new Error('Invalid data format: expected array');
            }
            
            // Filter out invalid entries
            this.data = this.data.filter(event => event && typeof event === 'object');
            
            console.log(`Loaded ${this.data.length} historical events`);
        } catch (error) {
            console.error('Failed to load data:', error);
            throw error;
        }
    }

    calculateOverviewStats() {
        try {
            const totalEvents = this.data.length;
            const eras = new Set(this.data.map(event => event && event.era_english).filter(Boolean));
            const deaths = this.data.filter(event => event && event.type === 'death').length;
            
            const years = this.data
                .map(event => event && (event.year_gregorian || event.year))
                .filter(year => year && !isNaN(year) && isFinite(year));
            
            let yearSpan = 0;
            if (years.length > 0) {
                const minYear = Math.min(...years);
                const maxYear = Math.max(...years);
                yearSpan = maxYear - minYear;
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
        } catch (error) {
            console.error('Error calculating overview stats:', error);
        }
    }

    createCharts() {
        this.createEraDistributionChart();
        this.createTimelineChart();
        this.createEventTypesChart();
        this.createEraTimelineChart();
        this.createMonthlyChart();
        this.createCategoryChart();
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
            const year = event.year_gregorian || event.year;
            if (year) {
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
        
        const deaths = this.data.filter(event => event.type === 'death').length;
        const otherEvents = this.data.length - deaths;

        this.charts.eventTypes = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Deaths', 'Other Events'],
                datasets: [{
                    data: [deaths, otherEvents],
                    backgroundColor: ['#FF4444', '#4444FF'],
                    borderWidth: 2,
                    borderColor: 'rgba(255, 255, 255, 0.8)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: 'white',
                            padding: 20,
                            font: { size: 14 }
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
                const year = event && (event.year_gregorian || event.year);
                const month = event && (event.month_gregorian || event.month) || 1;
                const day = event && (event.day_gregorian || event.day) || 1;
                return year && !isNaN(year) && year >= 1900 && year <= 2025 && 
                       month >= 1 && month <= 12 &&
                       day >= 1 && day <= 31;
            });

            // Group events by date (daily basis)
            const dailyFrequency = {};
            
            validEvents.forEach(event => {
                const year = event.year_gregorian || event.year;
                const month = (event.month_gregorian || event.month || 1);
                const day = (event.day_gregorian || event.day || 1);
                
                // Create date string and JavaScript Date object
                const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
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
            const month = (event.month_gregorian || event.month);
            if (month && month >= 1 && month <= 12) {
                monthlyCount[month - 1]++;
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
        
        // Count events by category fields
        const categories = {
            'Politics': 0,
            'Social': 0,
            'Natural Disaster': 0,
            'Science': 0,
            'Art': 0,
            'Sports': 0,
            'Deaths': 0,
            'Other': 0
        };

        this.data.forEach(event => {
            let categorized = false;
            
            if (event.type === 'death') {
                categories['Deaths']++;
                categorized = true;
            }
            
            ['Politics', 'Social', 'Natural Disaster', 'Science', 'Art', 'Sports'].forEach(cat => {
                if (event[cat] && typeof event[cat] === 'string' && event[cat].trim()) {
                    categories[cat]++;
                    categorized = true;
                }
            });
            
            if (!categorized) {
                categories['Other']++;
            }
        });

        const filteredCategories = Object.entries(categories)
            .filter(([,count]) => count > 0)
            .sort(([,a], [,b]) => b - a);

        this.charts.category = new Chart(ctx, {
            type: 'polarArea',
            data: {
                labels: filteredCategories.map(([cat]) => cat),
                datasets: [{
                    data: filteredCategories.map(([,count]) => count),
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                    ].slice(0, filteredCategories.length),
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
                            padding: 10,
                            font: { size: 12 }
                        }
                    }
                },
                scales: {
                    r: {
                        ticks: { color: 'white' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        angleLines: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                }
            }
        });
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
            if (event.type === 'death') {
                eraStats[era].deaths++;
            } else {
                eraStats[era].events++;
            }
            
            const year = event.year_gregorian || event.year;
            if (year) {
                eraStats[era].years.push(year);
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
        
        // Get a sample of notable events (with images, spread across eras)
        const notableEvents = this.data
            .filter(event => event.image && (event.title_english || event.title))
            .sort((a, b) => Math.random() - 0.5) // Randomize
            .slice(0, 20); // Take first 20

        tbody.innerHTML = notableEvents.map(event => {
            const year = event.year_gregorian || event.year || 'Unknown';
            const title = event.title_english || event.title || 'Unknown Event';
            const era = event.era_english || 'Unknown';
            const type = event.type || 'Event';
            const eraClass = this.getEraClass(era);
            
            return `
                <tr class="${eraClass}">
                    <td><strong>${year}</strong></td>
                    <td>${title.substring(0, 50)}${title.length > 50 ? '...' : ''}</td>
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