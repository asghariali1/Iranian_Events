class IranHistoryTimeline {
    constructor() {
        this.currentSlide = 0;
        this.isAutoplay = true;
        this.autoplayInterval = null;
        this.events = [];
        this.filteredEvents = [];
        this.currentLanguage = 'english';
        this.timelineScale = 1;
        this.minDate = null;
        this.maxDate = null;
        
        // Hierarchical timeline properties
        this.currentLevel = 'era'; // 'era', 'event'
        this.currentEra = null;
        this.hierarchicalData = {};
        this.navigationHistory = [];
        
        // Timeline filter properties
        this.activeFilters = new Set(['events', 'deaths']); // Multi-select filters
        
        // Era date ranges from eras.csv
        this.eraDateRanges = {
            'Qajar': { start: 1796, end: 1925 },
            'Pahlavi': { start: 1926, end: 1979 },
            'Islamic Republic': { start: 1979, end: 2025 },
        };
        
        // Zoom level for timeline
        this.zoomLevel = 1; // 1 to 5
        
        this.init();
    }

    async init() {
        try {
            // Ensure header and timeline-nav are visible on initial load
            const header = document.querySelector('.timeline-header');
            const timelineNav = document.querySelector('.timeline-nav');
            if (header) header.classList.remove('hidden');
            if (timelineNav) timelineNav.classList.remove('hidden');
            
            this.events = await this.getallEvents();
            if (this.events.length === 0) {
                console.error('No events loaded');
                return;
            }
            
            console.log('Loaded events:', this.events.length);
            console.log('First event era:', this.events[0]?.era_english);
            
            this.calculateDateRange();
            this.buildHierarchicalData();
            this.filteredEvents = [...this.events];
            this.showTimelineLevel('era');
            this.setupEventListeners();
            
            // Show first slide with era colors
            if (this.filteredEvents.length > 0) {
                setTimeout(() => {
                    this.showSlide(0, false);
                    // Initialize timeline visualization after era elements are created
                    setTimeout(() => {
                        this.initializeTimelineVisualization();
                    }, 200);
                }, 100);
            }
            
            this.startAutoplay();
        } catch (error) {
            console.error('Error initializing timeline:', error);
        }
    }

    async getallEvents() {
        try {
            const response = await fetch('assets/data/merged_data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! in loading the crime data status: ${response.status}`);
            }
            const data = await response.json();
            // Flatten all arrays from all keys into a single array
            const events = Object.values(data).flat();
            // Convert dates to Date objects for proper calculation
            return events.map(event => ({
                ...event,
                dateObject: this.createDateObject(event)
            })).sort((a, b) => a.dateObject - b.dateObject);
        } catch (error) {
            console.error('Failed to load all events:', error);
            return [];
        }
    }
createDateObject(event) {
    const [year, month, day] = event.date_gregorian.split('-').map(Number);
    if (year < 1) {
        return new Date(Math.abs(year), month - 1, day);
    }
    return new Date(year, month - 1, day);
}

////////////////////load all events from diferent json files for different categories
    async getcrimeEvents() {
        try {
            const response = await fetch('assets/data/Crime_Safety_data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! in loading the crime data status: ${response.status}`);
            }
            const data = await response.json();
            // Flatten all arrays from all keys into a single array
            const events = Object.values(data).flat();
            // Convert dates to Date objects for proper calculation
            return events.map(event => ({
                ...event,
                dateObject: this.createDateObject(event)
            })).sort((a, b) => a.dateObject - b.dateObject);
        } catch (error) {
            console.error('Failed to load crime events:', error);
            return [];
        }
    }
createDateObject(event) {
    const [year, month, day] = event.date_gregorian.split('-').map(Number);
    if (year < 1) {
        return new Date(Math.abs(year), month - 1, day);
    }
    return new Date(year, month - 1, day);
}

    async getDeathEvents() {
        try {
            const response = await fetch('assets/data/Death_data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! in loading the death data status: ${response.status}`);
            }
            const data = await response.json();
            // Flatten all arrays from all keys into a single array
            const events = Object.values(data).flat();
            // Convert dates to Date objects for proper calculation
            return events.map(event => ({
                ...event,
                dateObject: this.createDateObject(event)
            })).sort((a, b) => a.dateObject - b.dateObject);
        } catch (error) {
            console.error('Failed to load death events:', error);
            return [];
        }
    }
createDateObject(event) {
    const [year, month, day] = event.date_gregorian.split('-').map(Number);
    if (year < 1) {
        return new Date(Math.abs(year), month - 1, day);
    }
    return new Date(year, month - 1, day);
}

    async getEconomyEvents() {
        try {
            const response = await fetch('assets/data/Economy_data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! in loading the economy data status: ${response.status}`);
            }
            const data = await response.json();
            // Flatten all arrays from all keys into a single array
            const events = Object.values(data).flat();
            // Convert dates to Date objects for proper calculation
            return events.map(event => ({
                ...event,
                dateObject: this.createDateObject(event)
            })).sort((a, b) => a.dateObject - b.dateObject);
        } catch (error) {
            console.error('Failed to load economy events:', error);
            return [];
        }
    }
createDateObject(event) {
    const [year, month, day] = event.date_gregorian.split('-').map(Number);
    if (year < 1) {
        return new Date(Math.abs(year), month - 1, day);
    }
    return new Date(year, month - 1, day);
}

    async getHealthEvents() {
        try {
            const response = await fetch('assets/data/Health_data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! in loading the health data status: ${response.status}`);
            }
            const data = await response.json();
            // Flatten all arrays from all keys into a single array
            const events = Object.values(data).flat();
            // Convert dates to Date objects for proper calculation
            return events.map(event => ({
                ...event,
                dateObject: this.createDateObject(event)
            })).sort((a, b) => a.dateObject - b.dateObject);
        } catch (error) {
            console.error('Failed to load health events:', error);
            return [];
        }
    }
createDateObject(event) {
    const [year, month, day] = event.date_gregorian.split('-').map(Number);
    if (year < 1) {
        return new Date(Math.abs(year), month - 1, day);
    }
    return new Date(year, month - 1, day);
}

    async getNaturalDisasterEvents() {
        try {
            const response = await fetch('assets/data/Natural_Disaster_data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! in loading the natural disaster data status: ${response.status}`);
            }
            const data = await response.json();
            // Flatten all arrays from all keys into a single array
            const events = Object.values(data).flat();
            // Convert dates to Date objects for proper calculation
            return events.map(event => ({
                ...event,
                dateObject: this.createDateObject(event)
            })).sort((a, b) => a.dateObject - b.dateObject);
        } catch (error) {
            console.error('Failed to load natural disaster events:', error);
            return [];
        }
    }
createDateObject(event) {
    const [year, month, day] = event.date_gregorian.split('-').map(Number);
    if (year < 1) {
        return new Date(Math.abs(year), month - 1, day);
    }
    return new Date(year, month - 1, day);
}

    async getPoliticsEvents() {
        try {
            const response = await fetch('assets/data/Politics_data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! in loading the politics data status: ${response.status}`);
            }
            const data = await response.json();
            // Flatten all arrays from all keys into a single array
            const events = Object.values(data).flat();
            // Convert dates to Date objects for proper calculation
            return events.map(event => ({
                ...event,
                dateObject: this.createDateObject(event)
            })).sort((a, b) => a.dateObject - b.dateObject);
        } catch (error) {
            console.error('Failed to load politics events:', error);
            return [];
        }
    }
createDateObject(event) {
    const [year, month, day] = event.date_gregorian.split('-').map(Number);
    if (year < 1) {
        return new Date(Math.abs(year), month - 1, day);
    }
    return new Date(year, month - 1, day);
}

    async getSocialEvents() {
        try {
            const response = await fetch('assets/data/Social_data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! in loading the social data status: ${response.status}`);
            }
            const data = await response.json();
            // Flatten all arrays from all keys into a single array
            const events = Object.values(data).flat();
            // Convert dates to Date objects for proper calculation
            return events.map(event => ({
                ...event,
                dateObject: this.createDateObject(event)
            })).sort((a, b) => a.dateObject - b.dateObject);
        } catch (error) {
            console.error('Failed to load social events:', error);
            return [];
        }
    }
createDateObject(event) {
    const [year, month, day] = event.date_gregorian.split('-').map(Number);
    if (year < 1) {
        return new Date(Math.abs(year), month - 1, day);
    }
    return new Date(year, month - 1, day);
}

    async getSportsEntertainmentEvents() {
        try {
            const response = await fetch('assets/data/Sports_Entertainment_data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! in loading the sports and entertainment data status: ${response.status}`);
            }
            const data = await response.json();
            // Flatten all arrays from all keys into a single array
            const events = Object.values(data).flat();
            // Convert dates to Date objects for proper calculation
            return events.map(event => ({
                ...event,
                dateObject: this.createDateObject(event)
            })).sort((a, b) => a.dateObject - b.dateObject);
        } catch (error) {
            console.error('Failed to load sports and entertainment events:', error);
            return [];
        }
    }
createDateObject(event) {
    const [year, month, day] = event.date_gregorian.split('-').map(Number);
    if (year < 1) {
        return new Date(Math.abs(year), month - 1, day);
    }
    return new Date(year, month - 1, day);
}

    async getTechnologyScienceEvents() {
        try {
            const response = await fetch('assets/data/Technology_Science_data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! in loading the technology and science data status: ${response.status}`);
            }
            const data = await response.json();
            // Flatten all arrays from all keys into a single array
            const events = Object.values(data).flat();
            // Convert dates to Date objects for proper calculation
            return events.map(event => ({
                ...event,
                dateObject: this.createDateObject(event)
            })).sort((a, b) => a.dateObject - b.dateObject);
        } catch (error) {
            console.error('Failed to load technology and science events:', error);
            return [];
        }
    }
createDateObject(event) {
    const [year, month, day] = event.date_gregorian.split('-').map(Number);
    if (year < 1) {
        return new Date(Math.abs(year), month - 1, day);
    }
    return new Date(year, month - 1, day);
}

////////End of loading all events from different json files for different categories

    calculateDateRange() {
        if (this.events.length === 0) return;
        
        this.minDate = Math.min(...this.events.map(e => e.dateObject.getTime()));
        this.maxDate = Math.max(...this.events.map(e => e.dateObject.getTime()));
        
        // Calculate scale based on timeline container width
        const timelineContainer = document.getElementById('timelineTrack');
        
        // Use a larger base width to ensure timeline is fully expanded
        const baseWidth = Math.max(
            timelineContainer ? timelineContainer.offsetWidth : 1000,
            this.events.length * 150, // Minimum 150px per event
            3000 // Minimum 3000px total width
        );
        
        const totalTimeSpan = this.maxDate - this.minDate;
        
        // Scale: pixels per millisecond
        this.timelineScale = (baseWidth - 200) / totalTimeSpan; // Reserve 200px for margins
    }

    calculatePosition(event) {
        if (!this.minDate) return 0;
        const timeDiff = event.dateObject.getTime() - this.minDate;
        return timeDiff * this.timelineScale + 100; // 100px margin from left
    }


    buildHierarchicalData() {
        this.hierarchicalData = {};
        
        this.events.forEach(event => {
            const era = event.era_english;
            
            // Build hierarchy: era -> events
            if (!this.hierarchicalData[era]) {
                this.hierarchicalData[era] = {
                    name: era,
                    type: 'era',
                    events: []
                };
            }
            
            // Add event to era
            this.hierarchicalData[era].events.push(event);
        });
        
       // console.log('Hierarchical data built:', this.hierarchicalData);
    }

    showTimelineLevel(level, context = null) {
        this.currentLevel = level;
        
        const timelineNav = document.querySelector('.timeline-nav');
        const timelineVisualization = document.getElementById('timelineVisualization');
        const backButton = document.querySelector('.back-button');
        const header = document.querySelector('.timeline-header');
        
        switch (level) {
            case 'era':
                this.showEraLevel();
                // Clear timeline visualization for hierarchical view
                this.clearTimelineVisualization();
                // Show timeline-nav and header, collapse timeline visualization
                if (timelineNav) timelineNav.classList.remove('hidden');
                if (header) header.classList.remove('hidden');
                if (timelineVisualization) timelineVisualization.classList.remove('expanded');
                // Hide back button
                if (backButton) backButton.classList.remove('visible');
                break;
            case 'event':
                this.showEventLevel(context);
                // Filter events for this era
                this.filterEventsForEra(context);
                // Hide timeline-nav and header, expand timeline visualization
                if (timelineNav) timelineNav.classList.add('hidden');
                if (header) header.classList.add('hidden');
                if (timelineVisualization) timelineVisualization.classList.add('expanded');
                // Show back button
                if (backButton) backButton.classList.add('visible');
                // Generate category timelines
                this.generateCategoryTimelines();
                break;
        }
        
        this.updateBreadcrumb();
        this.updateFilterVisibility();
    }

    clearTimelineVisualization() {
        const deathsBar = document.getElementById('deathsTimelineBar');
        const eventsBar = document.getElementById('eventsTimelineBar');
        const deathsScale = document.getElementById('deathsTimelineScale');
        const eventsScale = document.getElementById('eventsTimelineScale');
        const mainTrack = document.getElementById('timelineTrack');
        
        if (deathsBar) deathsBar.innerHTML = '';
        if (eventsBar) eventsBar.innerHTML = '';
        if (deathsScale) deathsScale.innerHTML = '';
        if (eventsScale) eventsScale.innerHTML = '';
        
        // Clear category timeline bars
        const categoryIds = ['categoryBarCrime', 'categoryBarEconomy', 'categoryBarHealth', 
                            'categoryBarNaturalDisaster', 'categoryBarPolitics', 'categoryBarSocial',
                            'categoryBarSports', 'categoryBarTechnology', 'categoryBarDeath'];
        categoryIds.forEach(id => {
            const bar = document.getElementById(id);
            if (bar) bar.innerHTML = '';
        });
        
        // Clear main timeline track year markers and points
        if (mainTrack) {
            const yearMarkers = mainTrack.querySelectorAll('.timeline-year-marker, .timeline-minor-tick');
            yearMarkers.forEach(marker => marker.remove());
            
            const timelinePoints = mainTrack.querySelectorAll('.timeline-point');
            timelinePoints.forEach(point => point.remove());
        }
        
        // Reset filtered events to empty for hierarchical views
        this.filteredEvents = [];
        
        // Reset counters
        this.updateTimelineCounts();
    }

    generateCategoryTimelines() {
        // Define categories mapping
        const categories = [
            { key: 'Crime/Safety', id: 'categoryBarCrime', class: 'crime' },
            { key: 'Economy', id: 'categoryBarEconomy', class: 'economy' },
            { key: 'Health', id: 'categoryBarHealth', class: 'health' },
            { key: 'Natural Disaster', id: 'categoryBarNaturalDisaster', class: 'natural-disaster' },
            { key: 'Politics', id: 'categoryBarPolitics', class: 'politics' },
            { key: 'Social', id: 'categoryBarSocial', class: 'social' },
            { key: 'Sports/Entertainment', id: 'categoryBarSports', class: 'sports' },
            { key: 'Technology/Science', id: 'categoryBarTechnology', class: 'technology' },
            { key: 'Death', id: 'categoryBarDeath', class: 'death' }
        ];

        // Get the time range from filtered events
        if (this.filteredEvents.length === 0) return;

        const extractYear = e => {
            if (e.date_gregorian) {
                const y = parseInt(e.date_gregorian.split('-')[0], 10);
                return isNaN(y) ? 0 : y;
            }
            return 0;
        };

        const extractDate = e => {
            if (e.date_gregorian) {
                return new Date(e.date_gregorian);
            }
            return null;
        };

        const years = this.filteredEvents.map(extractYear).filter(y => y > 0);
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);
        const totalRange = maxYear - minYear || 1; // Prevent division by zero

        // Calculate total days for more precise positioning
        const minDate = new Date(minYear, 0, 1);
        const maxDate = new Date(maxYear, 11, 31);
        const totalDays = (maxDate - minDate) / (1000 * 60 * 60 * 24);

        // Update timeline scale with detailed year and month markers
        const timelineScale = document.getElementById('timelineScale');
        if (timelineScale) {
            timelineScale.innerHTML = '';
            
            // Create a container for the scale
            const scaleContainer = document.createElement('div');
            scaleContainer.className = 'timeline-scale-container';
            
            // Generate year and month markers
            for (let year = minYear; year <= maxYear; year++) {
                // Year marker
                const yearDate = new Date(year, 0, 1);
                const yearDays = (yearDate - minDate) / (1000 * 60 * 60 * 24);
                const yearPosition = (yearDays / totalDays) * 100;
                
                const yearLabel = document.createElement('div');
                yearLabel.className = 'timeline-scale-label year';
                yearLabel.textContent = year;
                yearLabel.style.left = `${yearPosition}%`;
                yearLabel.style.top = '0px';
                scaleContainer.appendChild(yearLabel);
            }
            
            timelineScale.appendChild(scaleContainer);
        }

        // Process each category
        categories.forEach(category => {
            const categoryBar = document.getElementById(category.id);
            if (!categoryBar) return;

            // Clear existing points
            categoryBar.innerHTML = '';

            // Filter events for this category
            let categoryEvents = this.filteredEvents.filter(event => {
                // Check if the category field equals 1
                if (event[category.key] === 1) return true;
                // Fallback for different data structures
                if (event.category === category.key) return true;
                return false;
            });

            // Create individual timeline points for each event
            const eventsByDate = {};
            categoryEvents.forEach(event => {
                const dateStr = event.date_gregorian;
                if (!eventsByDate[dateStr]) {
                    eventsByDate[dateStr] = [];
                }
                eventsByDate[dateStr].push(event);
            });

            // Create timeline points
            Object.entries(eventsByDate).forEach(([dateStr, eventsOnDate]) => {
                const eventDate = new Date(dateStr);
                const daysDiff = (eventDate - minDate) / (1000 * 60 * 60 * 24);
                const position = (daysDiff / totalDays) * 100;

                // Create a point for each event on this date
                eventsOnDate.forEach((event, indexOnDate) => {
                    const point = document.createElement('div');
                    point.className = `category-timeline-point ${category.class}`;
                    
                    // Add offset class to stack events downward
                    if (indexOnDate > 0) {
                        point.classList.add(`offset-${indexOnDate % 10}`);
                    }
                    
                    point.style.left = `${position}%`;
                    
                    // Store event reference for highlighting
                    point.__eventData = event;
                    
                    const dot = document.createElement('div');
                    dot.className = 'category-timeline-dot';
                    point.appendChild(dot);

                    // Add click handler
                    point.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const eventIndex = this.filteredEvents.indexOf(event);
                        if (eventIndex !== -1) {
                            this.showSlide(eventIndex);
                        }
                    });

                    // Add hover tooltip
                    point.title = `${event.title_english || event.title} (${dateStr})`;

                    categoryBar.appendChild(point);
                });
            });
        });

        // Synchronize scrolling across all category bars
        this.synchronizeCategoryScrolling();
        
        // Add click handlers for category expansion
        this.setupCategoryExpansion();
        
        // Initialize zoom
        this.updateZoom();
    }

    showEventPopup(events, dateStr, x, y) {
        // Remove any existing popup
        const existingPopup = document.querySelector('.event-popup');
        if (existingPopup) {
            existingPopup.remove();
        }
        
        // Create popup
        const popup = document.createElement('div');
        popup.className = 'event-popup visible';
        
        // Header
        const header = document.createElement('div');
        header.className = 'event-popup-header';
        header.textContent = `${events.length} events on ${dateStr}`;
        popup.appendChild(header);
        
        // Close button
        const closeBtn = document.createElement('div');
        closeBtn.className = 'event-popup-close';
        closeBtn.textContent = '×';
        closeBtn.onclick = () => popup.remove();
        popup.appendChild(closeBtn);
        
        // Event items
        events.forEach(event => {
            const item = document.createElement('div');
            item.className = 'event-popup-item';
            item.textContent = event.title_english || event.title;
            item.onclick = () => {
                const eventIndex = this.filteredEvents.indexOf(event);
                if (eventIndex !== -1) {
                    this.showSlide(eventIndex);
                }
                popup.remove();
            };
            popup.appendChild(item);
        });
        
        // Position popup
        document.body.appendChild(popup);
        
        // Adjust position to keep popup on screen
        const rect = popup.getBoundingClientRect();
        let left = x;
        let top = y + 10;
        
        if (left + rect.width > window.innerWidth) {
            left = window.innerWidth - rect.width - 20;
        }
        if (top + rect.height > window.innerHeight) {
            top = y - rect.height - 10;
        }
        
        popup.style.left = `${left}px`;
        popup.style.top = `${top}px`;
        
        // Close on click outside
        setTimeout(() => {
            document.addEventListener('click', function closePopup(e) {
                if (!popup.contains(e.target)) {
                    popup.remove();
                    document.removeEventListener('click', closePopup);
                }
            });
        }, 100);
    }

    zoomIn() {
        console.log('Zoom in called, current level:', this.zoomLevel);
        if (this.zoomLevel < 5) {
            this.zoomLevel++;
            this.updateZoom();
        }
    }

    zoomOut() {
        console.log('Zoom out called, current level:', this.zoomLevel);
        if (this.zoomLevel > 1) {
            this.zoomLevel--;
            this.updateZoom();
        }
    }

    updateZoom() {
        console.log('Updating zoom to level:', this.zoomLevel);
        const categoryBars = document.querySelectorAll('.category-bar');
        const scaleContainer = document.querySelector('.timeline-scale-container');
        const zoomLevelDisplay = document.getElementById('zoomLevel');
        
        console.log('Found category bars:', categoryBars.length);
        console.log('Found scale container:', !!scaleContainer);
        
        // Remove all zoom classes
        categoryBars.forEach(bar => {
            bar.classList.remove('zoom-1', 'zoom-2', 'zoom-3', 'zoom-4', 'zoom-5');
            bar.classList.add(`zoom-${this.zoomLevel}`);
        });
        
        if (scaleContainer) {
            scaleContainer.classList.remove('zoom-1', 'zoom-2', 'zoom-3', 'zoom-4', 'zoom-5');
            scaleContainer.classList.add(`zoom-${this.zoomLevel}`);
        }
        
        if (zoomLevelDisplay) {
            const zoomPercent = this.zoomLevel === 1 ? '1x' : 
                               this.zoomLevel === 2 ? '1.5x' :
                               this.zoomLevel === 3 ? '2x' :
                               this.zoomLevel === 4 ? '3x' : '4x';
            zoomLevelDisplay.textContent = zoomPercent;
        }
    }

    setupCategoryExpansion() {
        const categoryTimelines = document.querySelectorAll('.category-timeline');
        
        categoryTimelines.forEach(timeline => {
            timeline.addEventListener('click', (e) => {
                // Don't toggle if clicking on a timeline point
                if (e.target.closest('.category-timeline-point')) {
                    return;
                }
                
                // Toggle full-screen state
                const wasFullScreen = timeline.classList.contains('full-screen');
                
                if (wasFullScreen) {
                    // Exit full-screen - show all categories
                    categoryTimelines.forEach(t => {
                        t.classList.remove('full-screen', 'hidden');
                    });
                } else {
                    // Enter full-screen - hide others
                    categoryTimelines.forEach(t => {
                        if (t === timeline) {
                            t.classList.add('full-screen');
                            t.classList.remove('hidden');
                        } else {
                            t.classList.add('hidden');
                            t.classList.remove('full-screen');
                        }
                    });
                }
            });
        });
    }

    synchronizeCategoryScrolling() {
        const timelineScale = document.getElementById('timelineScale');
        const categoryContainers = document.querySelectorAll('.category-bar-container');
        
        if (!timelineScale || categoryContainers.length === 0) return;
        
        let isScrolling = false;
        
        // Synchronize timeline scale with category bars
        timelineScale.addEventListener('scroll', () => {
            if (isScrolling) return;
            isScrolling = true;
            
            const scrollLeft = timelineScale.scrollLeft;
            categoryContainers.forEach(container => {
                container.scrollLeft = scrollLeft;
            });
            
            setTimeout(() => { isScrolling = false; }, 50);
        });
        
        // Synchronize category bars with each other and timeline scale
        categoryContainers.forEach((container, index) => {
            container.addEventListener('scroll', () => {
                if (isScrolling) return;
                isScrolling = true;
                
                const scrollLeft = container.scrollLeft;
                timelineScale.scrollLeft = scrollLeft;
                categoryContainers.forEach((otherContainer, otherIndex) => {
                    if (otherIndex !== index) {
                        otherContainer.scrollLeft = scrollLeft;
                    }
                });
                
                setTimeout(() => { isScrolling = false; }, 50);
            });
        });
    }

    filterEventsForEra(era) {
        this.filteredEvents = this.events.filter(event => {
            const eventEra = event.era_english || event.era_persian || event.era || '';
            return eventEra === era;
        });
    }



    showEraLevel() {
        this.currentEra = null;
        this.navigationHistory = [];
        
        const track = document.getElementById('timelineTrack');
        if (!track) return;
        
        // Clear existing content
        track.innerHTML = '';
        
        // Create era items
        const eras = Object.keys(this.hierarchicalData);
        eras.forEach((era, index) => {
            const eraData = this.hierarchicalData[era];
            const position = (index * 200) + 100; // Spread eras evenly

            // Extract years from date_gregorian
            const years = eraData.events.map(e => {
                if (e.date_gregorian) {
                    const y = parseInt(e.date_gregorian.split('-')[0], 10);
                    return isNaN(y) ? 0 : y;
                }
                return 0;
            }).filter(y => y !== 0);
            const firstYear = years.length > 0 ? Math.min(...years) : '';
            const lastYear = years.length > 0 ? Math.max(...years) : '';

            const eraElement = this.createHierarchicalTimelineItem({
                name: era,
                type: 'era',
                count: eraData.events.length,
                firstYear,
                lastYear
            }, position, () => {
                this.navigationHistory.push({level: 'era'});
                this.currentEra = era;
                this.showTimelineLevel('event', era);
            });

            track.appendChild(eraElement);
        });
        
        // Show first era's events in content panel
        if (eras.length > 0) {
            const firstEra = this.hierarchicalData[eras[0]];
            if (firstEra.events.length > 0) {
                this.updateSlideContent(firstEra.events[0]);
            }
        }
        
        // Initialize timeline visualization
        this.initializeTimelineVisualization();
    }

    initializeTimelineVisualization() {
        const timelineScale = document.getElementById('timelineScale');
        const timelineZoomArea = document.getElementById('timelineZoomArea');
        
        if (!timelineScale || !timelineZoomArea) return;
        
        // Clear existing scale labels
        timelineScale.innerHTML = '';
        
        // Create scale labels based on historical periods
        const timelineStart = 1900;
        const timelineEnd = 2020;
        const timelineRange = timelineEnd - timelineStart;
        const timelineYears = [1900, 1920, 1940, 1960, 1980, 2000, 2020];
        
        timelineYears.forEach(year => {
            const label = document.createElement('div');
            label.className = 'timeline-scale-label';
            label.textContent = year;
            
            // Position label proportionally
            const position = ((year - timelineStart) / timelineRange) * 100;
            label.style.left = `${position}%`;
            
            timelineScale.appendChild(label);
        });
        
        // Add era click handlers with timeline zoom
        this.addEraClickHandlers();
    }

    addEraClickHandlers() {
        const eraElements = document.querySelectorAll('.timeline-era');
        const timelineZoomArea = document.getElementById('timelineZoomArea');
        
        if (!timelineZoomArea) return;
        
        eraElements.forEach((eraElement, index) => {
            // Removed hover effect to prevent all eras changing appearance
            
            eraElement.addEventListener('mouseleave', () => {
                if (!eraElement.classList.contains('selected')) {
                    this.hideTimelineZoom();
                }
            });
            
            // Add click handler with zoom
            const originalClickHandler = eraElement.onclick;
            eraElement.onclick = (e) => {
                // Remove previous selections
                document.querySelectorAll('.timeline-era').forEach(el => el.classList.remove('selected'));
                
                // Mark this era as selected
                eraElement.classList.add('selected');
                
                // Show zoom for this era
                this.showTimelineZoom(eraElement, true);
                
                // Execute original click handler
                if (originalClickHandler) {
                    originalClickHandler.call(eraElement, e);
                }
            };
        });
    }

    showTimelineZoom(eraElement, isSelected = false) {
        const timelineZoomArea = document.getElementById('timelineZoomArea');
        if (!timelineZoomArea) return;
        
        // Get era information
        const eraName = eraElement.querySelector('.timeline-era-label')?.textContent;
        const eraData = this.hierarchicalData[eraName];
        
        if (!eraData) return;
        
        // Calculate era time span
        const eraEvents = eraData.events;
        const firstYear = Math.min(...eraEvents.map(e => e.year_gregorian || e.year || 0));
        const lastYear = Math.max(...eraEvents.map(e => e.year_gregorian || e.year || 0));
        
        // Calculate position and width on timeline (600 CE to 2025 CE = 1425 years)
        const timelineStart = 1900;
        const timelineEnd = 2025;
        const timelineRange = timelineEnd - timelineStart;
        
        const eraStart = Math.max(firstYear, timelineStart);
        const eraEnd = Math.min(lastYear, timelineEnd);
        
        const leftPercent = ((eraStart - timelineStart) / timelineRange) * 100;
        const widthPercent = ((eraEnd - eraStart) / timelineRange) * 100;
        
        // Apply zoom area styling
        timelineZoomArea.style.left = leftPercent + '%';
        timelineZoomArea.style.width = Math.max(widthPercent, 5) + '%'; // Minimum 5% width
        
        // Add era-specific class
        timelineZoomArea.className = 'timeline-zoom-area active';
        const eraClass = this.getEraClassFromName(eraName);
        if (eraClass) {
            timelineZoomArea.classList.add(eraClass);
        }
        
        // Update timeline scale to show era range
        this.updateTimelineScale(eraStart, eraEnd, isSelected);
    }

    hideTimelineZoom() {
        const timelineZoomArea = document.getElementById('timelineZoomArea');
        if (timelineZoomArea) {
            timelineZoomArea.classList.remove('active');
        }
        
        // Reset to default scale
        this.updateTimelineScale();
    }

    updateTimelineScale(focusStart = null, focusEnd = null, isZoomed = false) {
        const timelineScale = document.getElementById('timelineScale');
        if (!timelineScale) return;
        
        timelineScale.innerHTML = '';
        
        let scaleYears;
        const timelineStart = 1900;
        const timelineEnd = 2020;
        const timelineRange = timelineEnd - timelineStart;
        
        if (isZoomed && focusStart && focusEnd) {
            // Create detailed scale for the focused era
            const range = focusEnd - focusStart;
            const step = range > 500 ? 100 : range > 200 ? 50 : range > 100 ? 25 : 10;
            
            scaleYears = [];
            for (let year = Math.floor(focusStart / step) * step; year <= focusEnd; year += step) {
                if (year >= focusStart - step && year <= focusEnd + step) {
                    scaleYears.push(year);
                }
            }
        } else {
            // Default overview scale
            scaleYears = [1900, 1920, 1940, 1960, 1980, 2000, 2020];
        }
        
        scaleYears.forEach(year => {
            const label = document.createElement('div');
            label.className = 'timeline-scale-label';
            label.textContent = year;
            
            // Position label proportionally
            const position = ((year - timelineStart) / timelineRange) * 100;
            label.style.left = `${position}%`;
            
            if (focusStart && focusEnd && year >= focusStart && year <= focusEnd) {
                label.style.background = 'rgba(255, 255, 255, 0.3)';
                label.style.fontWeight = 'bold';
            }
            
            timelineScale.appendChild(label);
        });
    }

    getEraClassFromName(eraName) {
        const eraMapping = {
            'Qajar': 'era-qajar',
            'Pahlavi': 'era-pahlavi',
            'Islamic Republic': 'era-islamic-republic',
        };
        
        return eraMapping[eraName] || 'era-unknown';
    }

    showEventLevel(era) {
        this.currentEra = era;
        
        const track = document.getElementById('timelineTrack');
        if (!track) return;
        
        track.innerHTML = '';
        
        const events = this.hierarchicalData[era].events;
        this.filteredEvents = events;
        
        // Use original timeline generation for events
        this.generateTimelinePoints();
        
        // Show first event
        if (events.length > 0) {
            this.showSlide(0, false);
        }
    }

    createHierarchicalTimelineItem(data, position, clickHandler) {
        const item = document.createElement('div');
        item.className = `timeline-${data.type}`;
        
        // Add era-specific class for coloring
        if (data.type === 'era') {
            const eraClass = getEraClass(data.name);
            item.classList.add(eraClass);
        }
        
        item.style.left = `${position}px`;
        item.onclick = clickHandler;
        
        item.innerHTML = `
            <div class="timeline-${data.type}-indicator"></div>
            <div class="timeline-${data.type}-label">${data.name}</div>
            <div class="timeline-${data.type}-count">${data.count} events</div>
            <div class="timeline-${data.type}-range">${data.firstYear} - ${data.lastYear}</div>
        `;
        
        return item;
    }

    updateBreadcrumb() {
        const breadcrumbContainer = document.getElementById('breadcrumb');
        const levelIndicator = document.getElementById('levelIndicator');
        if (!breadcrumbContainer) return;
        
        let breadcrumbHTML = '<span class="breadcrumb-item" onclick="showTimelineLevel(\'era\')">Eras</span>';
        let levelText = 'Era Level';
        
        if (this.currentEra) {
            breadcrumbHTML += ` > <span class="breadcrumb-item active">${this.currentEra}</span>`;
            levelText = 'Event Level';
        }
        
        breadcrumbContainer.innerHTML = breadcrumbHTML;
        
        if (levelIndicator) {
            levelIndicator.textContent = levelText;
        }
    }

    navigateBack() {
        if (this.navigationHistory.length === 0) {
            this.showTimelineLevel('era');
            return;
        }
        
        const lastState = this.navigationHistory.pop();
        
        switch (lastState.level) {
            case 'era':
                this.showTimelineLevel('era');
                break;
        }
    }

    generateEraBrackets() {
        // This method is now replaced by hierarchical navigation
        // Only called when showing individual events
        const track = document.getElementById('timelineTrack');
        if (!track) return;

        // Remove existing era brackets
        const existingBrackets = track.querySelectorAll('.era-bracket');
        existingBrackets.forEach(bracket => bracket.remove());

        // Group events by era
        const eraGroups = {};
        this.filteredEvents.forEach(event => {
            const era = event.era_english || event.era_persian || event.era || 'Unknown';
            if (!eraGroups[era]) {
                eraGroups[era] = [];
            }
            eraGroups[era].push(event);
        });

        // Create brackets for each era
        Object.entries(eraGroups).forEach(([era, events]) => {
            if (events.length === 0) return;

            const firstEvent = events[0];
            const lastEvent = events[events.length - 1];
            
            const startPos = this.calculatePosition(firstEvent);
            const endPos = this.calculatePosition(lastEvent);
            const width = Math.max(endPos - startPos, 50); // Minimum width of 50px

            // Create era bracket
            const bracket = document.createElement('div');
            bracket.className = `era-bracket ${getEraClass(era)}`;
            bracket.style.left = `${startPos}px`;
            bracket.style.width = `${width}px`;
            
            bracket.innerHTML = `
                <div class="era-bracket-line"></div>
                <div class="era-bracket-label">${era}</div>
                <div class="era-bracket-dates">
                    ${firstEvent.year_gregorian || firstEvent.year} - ${lastEvent.year_gregorian || lastEvent.year}
                </div>
            `;

            track.appendChild(bracket);
        });
    }

    generateTimelinePoints() {
        // Generate both timelines
        this.generateDeathsTimeline();
        this.generateEventsTimeline();
        this.updateTimelineCounts();
    }
    
    generateDeathsTimeline() {
        const deathsBar = document.getElementById('deathsTimelineBar');
        const deathsScale = document.getElementById('deathsTimelineScale');
        if (!deathsBar || !deathsScale) return;
        
        // Filter deaths from current events
        const deathEvents = this.filteredEvents.filter(event => 
            event.type === 'death' || 
            (event.category && event.category.toLowerCase().includes('death'))
        );
        
        this.generateTimelineTrack(deathEvents, deathsBar, deathsScale, 'deaths');
    }
    
    generateEventsTimeline() {
        const eventsBar = document.getElementById('eventsTimelineBar');
        const eventsScale = document.getElementById('eventsTimelineScale');
        if (!eventsBar || !eventsScale) return;
        
        // Filter events (non-deaths) from current events
        const eventEvents = this.filteredEvents.filter(event => 
            event.type !== 'death' && 
            !(event.category && event.category.toLowerCase().includes('death'))
        );
        
        this.generateTimelineTrack(eventEvents, eventsBar, eventsScale, 'events');
    }
    
    generateTimelineTrack(events, timelineBar, timelineScale, trackType) {
        // Clear existing content
        timelineBar.innerHTML = '';
        timelineScale.innerHTML = '';
        
        // Create container for timeline lines
        const timelineLinesContainer = document.createElement('div');
        timelineLinesContainer.className = 'timeline-lines-container';
        timelineBar.appendChild(timelineLinesContainer);
        
        // Determine timeline range based on current navigation level
        let minYear, maxYear;
        // Helper to extract year from date_gregorian
        const extractYear = e => {
            if (e.date_gregorian) {
                const y = parseInt(e.date_gregorian.split('-')[0], 10);
                return isNaN(y) ? 0 : y;
            }
            return 0;
        };
        if (this.currentLevel === 'event' && this.currentEra) {
            // Use actual min/max from events in this era for better fit
            if (events.length > 0) {
                minYear = Math.min(...events.map(extractYear));
                maxYear = Math.max(...events.map(extractYear));
            } else {
                // fallback to era range if no events
                const eraRange = this.eraDateRanges[this.currentEra];
                minYear = eraRange ? eraRange.start : 0;
                maxYear = eraRange ? eraRange.end : 2025;
            }
        } else {
            // For era level: use all events
            if (this.events.length > 0) {
                minYear = Math.min(...this.events.map(extractYear));
                maxYear = Math.max(...this.events.map(extractYear));
            } else {
                minYear = 0;
                maxYear = 2025;
            }
        }

        // Add appropriate padding based on the range
        const baseRange = maxYear - minYear;
        let padding;
        if (baseRange <= 10) {
            padding = 1;
        } else if (baseRange <= 100) {
            padding = 5;
        } else {
            padding = Math.max(10, baseRange * 0.05);
        }
        minYear = Math.floor(minYear - padding);
        maxYear = Math.ceil(maxYear + padding);
        const totalRange = maxYear - minYear;
        console.log(`Timeline range for ${trackType}: ${minYear} to ${maxYear} (${totalRange} years)`);
        // Calculate timeline width based on range (aim for appropriate scale per era)
        let timelineWidth;
        if (this.currentLevel === 'event' && this.currentEra) {
            // For event level, scale based on era duration with minimum reasonable width
            const pixelsPerYear = totalRange <= 50 ? 40 : totalRange <= 100 ? 20 : 10;
            timelineWidth = Math.max(1200, totalRange * pixelsPerYear); // Increased minimum width for era
        } else {
            // For era level, use standard scaling
            timelineWidth = Math.max(1200, totalRange * 10);
            console.log(`Adjusted timeline width for ${trackType}: ${timelineWidth}px`);
        }
        
        // Create the full calendar timeline background
        this.createFullCalendarTimeline(timelineLinesContainer, minYear, maxYear, timelineWidth);
        this.createFullCalendarTimeline2(timelineLinesContainer, minYear, maxYear, timelineWidth);
        
        // Create year indicators
        this.createCalendarYearIndicators(timelineScale, minYear, maxYear, timelineWidth);
        
        // Position event dots on the calendar timeline
        if (events.length > 0) {
            events.forEach((event, index) => {
                const year = extractYear(event);
                // Calculate exact position based on year in the calendar
                const position = ((year - minYear) / totalRange) * timelineWidth;

                // Create event dot
                const point = document.createElement('div');
                point.className = `timeline-event-dot`;

                // Add era-specific class for coloring
                const eraName = event.era_english || event.era_persian || event.era;
                const eraClass = getEraClass(eraName);
                if (eraClass) {
                    point.classList.add(eraClass);
                }

                // Position the point precisely on the calendar
                point.style.left = `${position}px`;
                point.style.top = '50%';
                point.style.transform = 'translateY(-50%)';

                // Find the original index in filteredEvents for slide navigation
                const originalIndex = this.filteredEvents.findIndex(e => e === event);
                point.onclick = () => this.showSlide(originalIndex);

                // Add tooltip with event info
                const yearDisplay = year > 0 ? year : Math.abs(year) + ' BCE';
                const eventTitle = event.title_english || event.title || 'Unknown Event';
                point.title = `${yearDisplay}: ${eventTitle}`;

                // Simple dot structure
                point.innerHTML = '<div class="event-dot-inner"></div>';

                timelineBar.appendChild(point);
            });
        }

        // Set timeline dimensions
        timelineBar.style.width = `${timelineWidth}px`;
        timelineBar.style.position = 'relative';
        timelineBar.style.height = '60px';
    }
    
    createFullCalendarTimeline(container, minYear, maxYear, timelineWidth) {
        // Create the main timeline line
        const timelineLine = document.createElement('div');
        timelineLine.className = 'calendar-timeline-line';
        timelineLine.style.position = 'absolute';
        timelineLine.style.top = '50%';
        timelineLine.style.left = '0';
        timelineLine.style.width = `${timelineWidth}px`;
        timelineLine.style.height = '2px';
        timelineLine.style.transform = 'translateY(-50%)';
        timelineLine.style.zIndex = '1';
        
        container.appendChild(timelineLine);
        
        // Call the second timeline creation
        this.createFullCalendarTimeline2(container, minYear, maxYear, timelineWidth);
        console.log('Created full calendar timeline from', minYear, 'to', maxYear, 'with width', timelineWidth);
    }
    createFullCalendarTimeline2(container, minYear, maxYear, timelineWidth) {
        // Create the second timeline line
        const timelineLine = document.createElement('div');
        timelineLine.className = 'calendar-timeline-line2';
        timelineLine.style.position = 'absolute';
        timelineLine.style.top = '70%'; // Position below the first line
        timelineLine.style.left = '0';
        timelineLine.style.width = `${timelineWidth}px`;
        timelineLine.style.height = '2px';
        timelineLine.style.backgroundColor = '#666'; // Different color to distinguish
        timelineLine.style.transform = 'translateY(-50%)';
        timelineLine.style.zIndex = '1';
        
        container.appendChild(timelineLine);
    }  
    createCalendarYearIndicators(container, minYear, maxYear, timelineWidth) {
        const yearRange = maxYear - minYear;
        
        // Determine year step based on range and available space
        let yearStep;
        if (yearRange <= 12) yearStep = 1;        // For decades: show every year
        else if (yearRange <= 25) yearStep = 2;   // Show every 2 years
        else if (yearRange <= 50) yearStep = 5;   // Show every 5 years
        else if (yearRange <= 100) yearStep = 10; // Show every 10 years
        else if (yearRange <= 200) yearStep = 25; // Show every 25 years
        else if (yearRange <= 500) yearStep = 50; // Show every 50 years
        else if (yearRange <= 1000) yearStep = 100; // Show every 100 years
        else yearStep = 200;                      // Show every 200 years
        
        // Create year markers
        const startYear = Math.ceil(minYear / yearStep) * yearStep;
        const endYear = Math.floor(maxYear / yearStep) * yearStep;
        
        for (let year = startYear; year <= endYear; year += yearStep) {
            const position = ((year - minYear) / yearRange) * timelineWidth;
            
            // Create year indicator
            const yearIndicator = document.createElement('div');
            yearIndicator.className = 'calendar-year-indicator';
            yearIndicator.style.position = 'absolute';
            yearIndicator.style.left = `${position}px`;
            yearIndicator.style.top = '0';
            
            const yearDisplay = year > 0 ? year : Math.abs(year) + ' BCE';
            yearIndicator.innerHTML = `
                <div class="calendar-year-tick"></div>
                <div class="calendar-year-label">${yearDisplay}</div>
            `;
            console.log('Created year indicator for', year, 'at position', position);
            container.appendChild(yearIndicator);
        }
        
        // Add intermediate minor ticks for better granularity (only for larger ranges)
        if (yearRange > 12) { // Don't add minor ticks for decade view
            const minorStep = Math.max(1, yearStep / 5);
            for (let year = Math.ceil(minYear); year <= Math.floor(maxYear); year += minorStep) {
                if (year % yearStep !== 0) { // Don't duplicate major ticks
                    const position = ((year - minYear) / yearRange) * timelineWidth;
                    
                    const minorTick = document.createElement('div');
                    minorTick.className = 'calendar-minor-tick';
                    minorTick.style.position = 'absolute';
                    minorTick.style.left = `${position}px`;
                    minorTick.style.top = '50%';
                    minorTick.style.width = '1px';
                    minorTick.style.height = '10px';
                    minorTick.style.background = 'rgba(0,0,0,0.3)';
                    minorTick.style.transform = 'translateY(-50%)';
                    
                    container.appendChild(minorTick);
                }
            }
        }
    }
    
    updateTimelineCounts() {
        const deathsCount = this.filteredEvents.filter(event => 
            event.type === 'death' || 
            (event.category && event.category.toLowerCase().includes('death'))
        ).length;
        
        const eventsCount = this.filteredEvents.filter(event => 
            event.type !== 'death' && 
            !(event.category && event.category.toLowerCase().includes('death'))
        ).length;
        
        const deathsCountElement = document.getElementById('deathsCount');
        const eventsCountElement = document.getElementById('eventsCount');
        
        if (deathsCountElement) {
            deathsCountElement.textContent = `${deathsCount} deaths`;
        }
        
        if (eventsCountElement) {
            eventsCountElement.textContent = `${eventsCount} events`;
        }
    }

    createYearIndicators(track, minYear, maxYear, timelineWidth) {
        const yearRange = maxYear - minYear;
        
        // Determine year step based on range
        let yearStep;
        if (yearRange <= 50) yearStep = 10;
        else if (yearRange <= 200) yearStep = 25;
        else if (yearRange <= 500) yearStep = 50;
        else if (yearRange <= 1000) yearStep = 100;
        else yearStep = 200;
        
        // Create year markers
        const startYear = Math.ceil(minYear / yearStep) * yearStep;
        const endYear = Math.floor(maxYear / yearStep) * yearStep;
        
        for (let year = startYear; year <= endYear; year += yearStep) {
            const position = ((year - minYear) / yearRange) * timelineWidth + 50; // Adjusted for dual tracks
            
            // Create year indicator
            const yearIndicator = document.createElement('div');
            yearIndicator.className = 'timeline-year-indicator';
            yearIndicator.style.left = `${position}px`;
            yearIndicator.style.position = 'absolute';
            
            const yearDisplay = year > 0 ? year : Math.abs(year) + ' BCE';
            yearIndicator.innerHTML = `
                <div class="year-tick"></div>
                <div class="year-label">${yearDisplay}</div>
            `;
            
            track.appendChild(yearIndicator);
        }
        console.log('Created year indicators from', minYear, 'to', maxYear, 'with step', yearStep);
    }

    generateEraBrackets() {
        // This method is now replaced by hierarchical navigation
        // Only called when showing individual events
        const track = document.getElementById('timelineTrack');
        if (!track) return;

        // Remove existing era brackets
        const existingBrackets = track.querySelectorAll('.era-bracket');
        existingBrackets.forEach(bracket => bracket.remove());
        console.log('Generating era brackets for current events');
        // Group events by era
        const eraGroups = {};
        this.filteredEvents.forEach(event => {
            const era = event.era_english || event.era_persian || event.era || 'Unknown';
            if (!eraGroups[era]) {
                eraGroups[era] = [];
            }
            eraGroups[era].push(event);
        });

        // Create brackets for each era
        Object.entries(eraGroups).forEach(([era, events]) => {
            if (events.length === 0) return;

            const firstEvent = events[0];
            const lastEvent = events[events.length - 1];
            
            const startPos = this.calculatePosition(firstEvent);
            const endPos = this.calculatePosition(lastEvent);
            const width = Math.max(endPos - startPos, 50); // Minimum width of 50px

            // Create era bracket
            const bracket = document.createElement('div');
            bracket.className = `era-bracket ${getEraClass(era)}`;
            bracket.style.left = `${startPos}px`;
            bracket.style.width = `${width}px`;
            
            bracket.innerHTML = `
                <div class="era-bracket-line"></div>
                <div class="era-bracket-label">${era}</div>
                <div class="era-bracket-dates">
                    ${firstEvent.year_gregorian || firstEvent.year} - ${lastEvent.year_gregorian || lastEvent.year}
                </div>
            `;

            track.appendChild(bracket);
        });
    }

    generateTimelinePoints() {
        const track = document.getElementById('timelineTrack');
        if (!track) return;
        
        // Clear existing points but keep era brackets
        const points = track.querySelectorAll('.timeline-point');
        points.forEach(point => point.remove());
        
        // Ensure timeline line exists
        let timelineLine = track.querySelector('.timeline-line');
        if (!timelineLine) {
            timelineLine = document.createElement('div');
            timelineLine.className = 'timeline-line';
            track.appendChild(timelineLine);
        }

        // Determine timeline range based on current navigation level
        let minYear, maxYear;
        
        if (this.currentLevel === 'event' && this.currentEra) {
            // For event level: use the era's predefined date range
            const eraRange = this.eraDateRanges[this.currentEra];
            if (eraRange) {
                minYear = eraRange.start;
                maxYear = eraRange.end;
            } else {
                // Fallback to filtered events if era range not found
                if (this.filteredEvents.length > 0) {
                    minYear = Math.min(...this.filteredEvents.map(e => e.year_gregorian || e.year || 0));
                    maxYear = Math.max(...this.filteredEvents.map(e => e.year_gregorian || e.year || 0));
                } else {
                    minYear = 0;
                    maxYear = 2025;
                }
            }
        } else {
            // For era level: use all events
            if (this.events.length > 0) {
                minYear = Math.min(...this.events.map(e => e.year_gregorian || e.year || 0));
                maxYear = Math.max(...this.events.map(e => e.year_gregorian || e.year || 0));
            } else {
                minYear = 0;
                maxYear = 2025;
            }
        }
        
        // Add appropriate padding based on the range
        const baseRange = maxYear - minYear;
        let padding;
        
        if (baseRange <= 10) {
            padding = 1;
        } else if (baseRange <= 100) {
            padding = 5;
        } else {
            padding = Math.max(10, baseRange * 0.05);
        }
        
        minYear = Math.floor(minYear - padding);
        maxYear = Math.ceil(maxYear + padding);
        const totalRange = maxYear - minYear;
        
        console.log(`Timeline range: ${minYear} to ${maxYear} (${totalRange} years), Era: ${this.currentEra || 'All'}`);
        
        // Calculate timeline width based on range
        let timelineWidth;
        if (this.currentLevel === 'event' && this.currentEra) {
            // Special handling for Pahlavi and Islamic Republic eras - make timeline wider
            if (this.currentEra === 'Pahlavi' || this.currentEra === 'Islamic Republic') {
                const pixelsPerYear = totalRange <= 30 ? 80 : totalRange <= 50 ? 60 : totalRange <= 80 ? 40 : 30;
                timelineWidth = Math.max(4000, totalRange * pixelsPerYear); // Minimum 2000px for these eras
            } else {
                // Standard scaling for other eras
                const pixelsPerYear = totalRange <= 50 ? 40 : totalRange <= 100 ? 20 : 10;
                timelineWidth = Math.max(800, totalRange * pixelsPerYear);
            }
        } else {
            // For era level, use standard scaling
            timelineWidth = Math.max(1200, totalRange * 10);
        }

        // Generate timeline points with correct positioning based on actual dates
        // First, create a map to track positions and handle overlapping events
        const positionMap = new Map();
        
        this.filteredEvents.forEach((event, index) => {
            const year = event.year_gregorian || event.year || 0;
            const month = event.month_gregorian || event.month || 1;
            const day = event.day_gregorian || event.day || 1;
            
            // Calculate exact position based on full date in the timeline range
            // Use fractional year for more precise positioning
            const fractionalYear = year + (month - 1) / 12 + (day - 1) / 365;
            const position = ((fractionalYear - minYear) / totalRange) * timelineWidth;
            
            console.log(`Event: ${event.title_english?.substring(0, 30) || 'Untitled'}, Year: ${year}, Position: ${position.toFixed(2)}px`);
            
            // Check if this is a death event
            const isDeath = event.type === 'death' || 
                           (event.category && event.category.toLowerCase().includes('death'));
            
            // Apply current filter
            const shouldShow = this.shouldShowEvent(isDeath);
            if (!shouldShow) {
                return; // Skip this event based on current filter
            }
            
            // Handle overlapping events at the same position
            const posKey = Math.round(position / 5) * 5; // Group events within 5px
            if (!positionMap.has(posKey)) {
                positionMap.set(posKey, { regular: 0, death: 0 });
            }
            
            const point = document.createElement('div');
            point.className = `timeline-point ${index === 0 ? 'active' : ''} ${isDeath ? 'death-event' : 'regular-event'}`;
            
            // Add era-specific class for coloring (only for non-death events)
            if (!isDeath) {
                const eraClass = getEraClass(event.era_english);
                point.classList.add(eraClass);
            }
            
            // Calculate vertical offset for overlapping events
            let verticalOffset = 0;
            if (isDeath) {
                verticalOffset = positionMap.get(posKey).death * 8; // Stack death events
                positionMap.get(posKey).death++;
            } else {
                verticalOffset = positionMap.get(posKey).regular * 8; // Stack regular events
                positionMap.get(posKey).regular++;
            }
            
            // Position the point horizontally and vertically based on event type
            point.style.position = 'absolute';
            point.style.left = `${position}px`;
            point.style.transform = 'translateX(-50%)';
            
            if (isDeath) {
                // Death events: red color, positioned below timeline line
                point.style.top = `calc(50% + 15px + ${verticalOffset}px)`;
                point.style.color = '#ff4444';
            } else {
                // Regular events: positioned above timeline line
                point.style.top = `calc(50% - 15px - ${verticalOffset}px)`;
            }
            
            point.onclick = () => this.showSlide(index);
            
            // Simple dot without year labels
            point.innerHTML = `<div class="timeline-dot-simple"></div>`;
            
            // Add tooltip with event info for debugging
            const eventTitle = event.title_english || event.title || 'Unknown Event';
            point.title = `${year}/${month}/${day}: ${eventTitle}`;
            
            track.appendChild(point);
        });

        // Generate year markers on the timeline
        this.generateTimelineYearMarkers(track, minYear, maxYear, totalRange, timelineWidth);

        // Set timeline line and track width to match calculated timelineWidth
        if (timelineWidth < 2000) {
            timelineWidth = 2000; // Set a minimum width for usability
        }
        console.log('Setting timeline width to', timelineWidth);
        timelineLine.style.width = `${timelineWidth}px`;

        // Ensure the track container can accommodate the full width
        const trackInner = track.querySelector('.timeline-track');
        if (!trackInner) {
            const inner = document.createElement('div');
            inner.className = 'timeline-track';
            inner.style.width = `${timelineWidth}px`;
            console.log('Created new timeline track with width', timelineWidth);
            inner.style.position = 'relative';

            while (track.firstChild) {
                inner.appendChild(track.firstChild);
            }
            track.appendChild(inner);
        } else {
            trackInner.style.width = `${timelineWidth}px`;
        }
    }

    generateTimelineYearMarkers(track, minYear, maxYear, totalRange, timelineWidth) {
        // Clear existing year markers and minor ticks
        const existingMarkers = track.querySelectorAll('.timeline-year-marker, .timeline-minor-tick');
        existingMarkers.forEach(marker => marker.remove());

        // Determine year step based on range and available space
        let yearStep;
        
        // Special handling for Pahlavi and Islamic Republic eras with increased width
        if (this.currentEra === 'Pahlavi' || this.currentEra === 'Islamic Republic') {
            if (totalRange <= 10) yearStep = 1;        // Show every year
            else if (totalRange <= 30) yearStep = 1;   // Show every 2 years
            else if (totalRange <= 60) yearStep = 2;   // Show every 5 years
            else yearStep = 10;                        // Show every 10 years for longer ranges
        } else {
            // Standard logic for other eras
            if (totalRange <= 12) yearStep = 1;        // For decades: show every year
            else if (totalRange <= 100) yearStep = 2;   // Show every 2 years
            else if (totalRange <= 200) yearStep = 25; // Show every 25 years
            else if (totalRange <= 500) yearStep = 50; // Show every 50 years
            else if (totalRange <= 1000) yearStep = 100; // Show every 100 years
            else yearStep = 200;                      // Show every 200 years
        }

        // Create year markers
        const startYear = Math.ceil(minYear / yearStep) * yearStep;
        const endYear = Math.floor(maxYear / yearStep) * yearStep;

        for (let year = startYear; year <= endYear; year += yearStep) {
            const position = ((year - minYear) / totalRange) * timelineWidth;
            
            // Create year marker
            const yearMarker = document.createElement('div');
            yearMarker.className = 'timeline-year-marker';
            yearMarker.style.position = 'absolute';
            yearMarker.style.left = `${position}px`;
            yearMarker.style.top = '50%'; // Align with timeline line
            yearMarker.style.transform = 'translateY(-50%) translateX(-50%)'; // Center both ways
            
            const yearDisplay = year > 0 ? year : Math.abs(year) + ' BCE';
            yearMarker.innerHTML = `
                <div class="timeline-year-tick"></div>
                <div class="timeline-year-label">${yearDisplay}</div>
            `;
            
            track.appendChild(yearMarker);
        }

        // Add minor ticks for better granularity (only for larger ranges)
        if (totalRange > 12 && yearStep > 10) {
            const minorStep = Math.max(1, yearStep / 5);
            for (let year = Math.ceil(minYear); year <= Math.floor(maxYear); year += minorStep) {
                if (year % yearStep !== 0) { // Don't duplicate major ticks
                    const position = ((year - minYear) / totalRange) * timelineWidth;
                    
                    const minorTick = document.createElement('div');
                    minorTick.className = 'timeline-minor-tick';
                    minorTick.style.position = 'absolute';
                    minorTick.style.left = `${position}px`;
                    minorTick.style.top = '50%';
                    minorTick.style.width = '1px';
                    minorTick.style.height = '15px';
                    minorTick.style.background = 'rgba(255, 255, 255, 0.3)';
                    minorTick.style.transform = 'translate(-50%, -50%)'; // Center both horizontally and vertically
                    minorTick.style.pointerEvents = 'none';
                    minorTick.style.zIndex = '1';
                    
                    track.appendChild(minorTick);
                }
            }
        }
        
        console.log(`Generated year markers for era "${this.currentEra}" with step ${yearStep} years, timeline width: ${timelineWidth}px for range ${minYear}-${maxYear}`);
    }

    shouldShowEvent(isDeath) {
        if (this.activeFilters.size === 0) {
            return false; // No filters active, show nothing
        }
        
        if (isDeath && this.activeFilters.has('deaths')) {
            return true;
        }
        
        if (!isDeath && this.activeFilters.has('events')) {
            return true;
        }
        
        return false;
    }

    toggleTimelineFilter(filterType) {
        if (filterType === 'clear') {
            this.activeFilters.clear();
        } else {
            if (this.activeFilters.has(filterType)) {
                this.activeFilters.delete(filterType);
            } else {
                this.activeFilters.add(filterType);
            }
        }
        
        console.log(`Active filters:`, Array.from(this.activeFilters));
        
        // Regenerate timeline points with new filter
        if (this.currentLevel === 'event') {
            this.generateTimelinePoints();
        }
        
        // Update filter button states
        this.updateFilterButtonStates();
    }

    updateFilterButtonStates() {
        const filterButtons = document.querySelectorAll('.timeline-filter-btn');
        filterButtons.forEach(btn => {
            const filterType = btn.getAttribute('data-filter');
            btn.classList.remove('active');
            
            if (filterType === 'clear') {
                // Clear button is active when no filters are selected
                if (this.activeFilters.size === 0) {
                    btn.classList.add('active');
                }
            } else {
                // Regular filter buttons
                if (this.activeFilters.has(filterType)) {
                    btn.classList.add('active');
                }
            }
        });
    }

    updateFilterVisibility() {
        const filterContainer = document.querySelector('.timeline-filter-container');
        if (filterContainer) {
            // Show filter buttons only in event level
            if (this.currentLevel === 'event') {
                filterContainer.style.display = 'flex';
            } else {
                filterContainer.style.display = 'none';
            }
        }
    }

    setupEventListeners() {
        const searchBox = document.getElementById('searchBox');
        if (searchBox) {
            searchBox.addEventListener('input', (e) => this.searchEvents(e.target.value));
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.previousSlide();
            if (e.key === 'ArrowRight') this.nextSlide();
            if (e.key === ' ') {
                e.preventDefault();
                this.toggleAutoplay();
            }
        });

        // Setup filter buttons
        this.setupFilterButtons();
        this.setupTimelineFilterButtons();
        
        // Setup zoom controls
        const zoomInBtn = document.getElementById('zoomInBtn');
        const zoomOutBtn = document.getElementById('zoomOutBtn');
        
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => {
                console.log('Zoom in button clicked');
                this.zoomIn();
            });
        }
        
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => {
                console.log('Zoom out button clicked');
                this.zoomOut();
            });
        }
    }

    setupFilterButtons() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all buttons
                filterButtons.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                e.target.classList.add('active');
                
                const filter = e.target.getAttribute('data-filter');
                this.filterEvents(filter);
            });
        });
    }

    setupTimelineFilterButtons() {
        const timelineFilterButtons = document.querySelectorAll('.timeline-filter-btn');
        timelineFilterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filterType = e.currentTarget.getAttribute('data-filter');
                this.toggleTimelineFilter(filterType);
            });
        });
        
        // Set initial button state
        this.updateFilterButtonStates();
    }

    filterEvents(filter) {
        if (filter === 'all') {
            this.filteredEvents = [...this.events];
        } else {
            this.filteredEvents = this.events.filter(event => {
                // Check if filtering by era
                if (Object.keys(eraColorMap).some(era => 
                    era.toLowerCase().replace(' ', '-') === filter
                )) {
                    return event.era_english && 
                           event.era_english.toLowerCase().replace(' ', '-') === filter;
                }
                // Check if filtering by type
                return event.type === filter || 
                       event.category === filter ||
                       (event.keywords && event.keywords.includes(filter));
            });
        }
        
        this.generateTimelinePoints();
        this.generateEraBrackets();
        if (this.filteredEvents.length > 0) {
            this.showSlide(0, false);
        }
    }

    showSlide(index, animate = true) {
        if (index < 0 || index >= this.filteredEvents.length) return;
        
        const event = this.filteredEvents[index];
        // console.log('Showing slide for event:', event.title_english, 'Era:', event.era_english);
        
        const slideContent = document.getElementById('slideContent');
        const mediaImage = document.getElementById('mediaImage');
        
        // Update active state for both timeline tracks and category timelines
        document.querySelectorAll('.timeline-point, .timeline-event-dot, .category-timeline-point').forEach((point) => {
            point.classList.remove('active');
        });
        
        // Highlight in category timelines if they're visible
        const categoryPoints = document.querySelectorAll('.category-timeline-point');
        categoryPoints.forEach((point) => {
            // Check if this point's data contains the current event
            const pointData = point.__eventData;
            if (Array.isArray(pointData)) {
                // Point contains multiple events
                if (pointData.includes(event)) {
                    point.classList.add('active');
                }
            } else if (pointData === event) {
                // Point contains single event
                point.classList.add('active');
            }
        });
        
        // Find and activate the corresponding dot in the appropriate timeline
        const isDeathEvent = event.type === 'death' || 
                            (event.category && event.category.toLowerCase().includes('death'));
        
        const timelineSelector = isDeathEvent ? '#deathsTimelineBar' : '#eventsTimelineBar';
        const timelineDots = document.querySelectorAll(`${timelineSelector} .timeline-event-dot`);
        
        // Find the correct dot by matching the event
        timelineDots.forEach((dot) => {
            if (dot.onclick && dot.onclick.toString().includes(`showSlide(${index})`)) {
                dot.classList.add('active');
            }
        });
        
        if (animate && slideContent) {
            slideContent.classList.remove('active');
            if (mediaImage) mediaImage.classList.remove('active');
            
            setTimeout(() => {
                this.updateSlideContent(event);
                slideContent.classList.add('active');
                if (mediaImage) mediaImage.classList.add('active');
            }, 300);
        } else {
            this.updateSlideContent(event);
            if (slideContent) slideContent.classList.add('active');
        }
        
        this.currentSlide = index;
        this.scrollToActivePoint();
    }

    updateSlideContent(event) {
        const titleField = this.currentLanguage === 'english' ? 'title_english' : 'title';
        const detailsField = this.currentLanguage === 'english' ? 'details_english' : 'details';
        const descriptionField = this.currentLanguage === 'english' ? 'description_english' : 'description';
        
        // Get DOM elements
        const slideDate = document.getElementById('slideDate');
        const slideTitle = document.getElementById('slideTitle');
        const slideText = document.getElementById('slideText');
        const slideEra = document.getElementById('slideEra');
        const slideCategory = document.getElementById('slideCategory');
        const slideDetails = document.getElementById('slideDetails');
        const slideDetailsSection = document.getElementById('slideDetailsSection');
        const slideLinksSection = document.getElementById('slideLinksSection');
        const englishLinks = document.getElementById('englishLinks');
        const persianLinks = document.getElementById('persianLinks');
        const mediaImage = document.getElementById('mediaImage');
        const mediaCaption = document.getElementById('mediaCaption');
        
        // Update basic info
        if (slideDate) {
            const gregorianDate = event.date_gregorian || '';
            const jalaliDate = event.date_jalali || '';
            slideDate.textContent = gregorianDate + (jalaliDate ? ` (${jalaliDate})` : '');
        }
        
        if (slideTitle) {
            const title = event[titleField] || event.title || 'Untitled Event';
            slideTitle.textContent = title;
        }
        
        if (slideEra) {
            const era = event.era_english || event.era_persian || 'Unknown Era';
            slideEra.textContent = era;
        }
        
        // Determine categories
        if (slideCategory) {
            const categories = [];
            const catFields = ['Crime/Safety', 'Economy', 'Health', 'Natural Disaster', 'Politics', 'Social', 'Sports/Entertainment', 'Technology/Science', 'Death'];
            catFields.forEach(cat => {
                if (event[cat] === 1) categories.push(cat);
            });
            slideCategory.textContent = categories.length > 0 ? categories.join(', ') : 'General';
        }
        
        // Update description/details
        if (slideText) {
            const details = event.details || event[detailsField] || event[descriptionField] || event.description || 'No description available';
            slideText.textContent = details;
        }
        
        // Show additional details if available
        if (slideDetails && slideDetailsSection) {
            const additionalInfo = [];
            if (event.id) additionalInfo.push(`Event ID: ${event.id}`);
            
            if (additionalInfo.length > 0) {
                slideDetails.innerHTML = additionalInfo.join('<br>');
                slideDetailsSection.style.display = 'block';
            } else {
                slideDetailsSection.style.display = 'none';
            }
        }
        
        // Show Wikipedia links
        const wikiLinksMeta = document.getElementById('wikiLinksMeta');
        const wikiLinksInline = document.getElementById('wikiLinksInline');
        
        if (englishLinks && persianLinks && slideLinksSection) {
            englishLinks.innerHTML = '';
            persianLinks.innerHTML = '';
            
            let hasLinks = false;
            let inlineLinksHTML = '';
            
            // English Wikipedia links
            if (event.english_wiki_links) {
                const englishLinksArray = Array.isArray(event.english_wiki_links) 
                    ? event.english_wiki_links 
                    : [event.english_wiki_links];
                    
                englishLinksArray.forEach((link, index) => {
                    if (link && link.trim() !== '') {
                        const a = document.createElement('a');
                        a.href = link;
                        a.className = 'wiki-link';
                        a.target = '_blank';
                        a.innerHTML = `🇬🇧 Wikipedia EN ${index + 1}`;
                        englishLinks.appendChild(a);
                        hasLinks = true;
                        
                        // Add to inline links
                        inlineLinksHTML += `<a href="${link}" target="_blank" class="wiki-link-inline">EN${index > 0 ? index + 1 : ''}</a> `;
                    }
                });
            }
            
            // Persian Wikipedia links
            if (event.persian_wiki_links) {
                const persianLinksArray = Array.isArray(event.persian_wiki_links) 
                    ? event.persian_wiki_links 
                    : [event.persian_wiki_links];
                    
                persianLinksArray.forEach((link, index) => {
                    if (link && link.trim() !== '') {
                        const a = document.createElement('a');
                        a.href = link;
                        a.className = 'wiki-link';
                        a.target = '_blank';
                        a.innerHTML = `🇮🇷 Wikipedia FA ${index + 1}`;
                        persianLinks.appendChild(a);
                        hasLinks = true;
                        
                        // Add to inline links
                        inlineLinksHTML += `<a href="${link}" target="_blank" class="wiki-link-inline">FA${index > 0 ? index + 1 : ''}</a> `;
                    }
                });
            }
            
            slideLinksSection.style.display = hasLinks ? 'block' : 'none';
            
            // Update inline wiki links in meta
            if (wikiLinksMeta && wikiLinksInline) {
                if (hasLinks) {
                    wikiLinksInline.innerHTML = inlineLinksHTML;
                    wikiLinksMeta.style.display = 'flex';
                } else {
                    wikiLinksMeta.style.display = 'none';
                }
            }
        }
        
        if (mediaImage) {
            if (event.image) {
                mediaImage.src = event.image;
                mediaImage.style.display = 'block';
            } else {
                mediaImage.style.display = 'none';
            }
        }
        
        if (mediaCaption) {
            const caption = event.caption || event.image_caption || '';
            mediaCaption.textContent = caption;
            mediaCaption.style.display = caption ? 'block' : 'none';
        }
        
        // Update era backgrounds
        this.updateEraBackgrounds(event.era_english || event.era_persian);
    }

    updateEraBackgrounds(era) {
        //console.log('Updating era backgrounds for:', era);
        
        const contentPanel = document.querySelector('.content-panel');
        const timelineNav = document.querySelector('.timeline-nav');
        
        // Remove all existing era classes
        const eraClasses = Object.values(eraColorMap);
        
        if (contentPanel) {
            eraClasses.forEach(className => {
                contentPanel.classList.remove(className);
            });
            
            if (era) {
                const eraClass = getEraClass(era);
               // console.log('Adding era class to content panel:', eraClass);
                contentPanel.classList.add(eraClass);
            }
        } else {
            console.warn('Content panel not found');
        }
        
        if (timelineNav) {
            eraClasses.forEach(className => {
                timelineNav.classList.remove(className);
            });
            
            if (era) {
                const eraClass = getEraClass(era);
               // console.log('Adding era class to timeline nav:', eraClass);
                timelineNav.classList.add(eraClass);
            }
        } else {
            console.warn('Timeline nav not found');
        }
    }

    scrollToActivePoint() {
        const activePoint = document.querySelector('.timeline-point.active');
        const track = document.getElementById('timelineTrack');
        
        if (activePoint && track) {
            const pointLeft = parseInt(activePoint.style.left) || 0;
            
            // Calculate scroll position to center the active point
            const scrollLeft = pointLeft - (track.offsetWidth / 2) + 40;
            
            track.scrollTo({
                left: Math.max(0, scrollLeft),
                behavior: 'smooth'
            });
        }
    }

    nextSlide() {
        const nextIndex = (this.currentSlide + 1) % this.filteredEvents.length;
        this.showSlide(nextIndex);
    }

    previousSlide() {
        const prevIndex = this.currentSlide === 0 ? this.filteredEvents.length - 1 : this.currentSlide - 1;
        this.showSlide(prevIndex);
    }

    toggleAutoplay() {
        const playBtn = document.getElementById('playBtn');
        
        if (this.isAutoplay) {
            this.stopAutoplay();
            if (playBtn) playBtn.textContent = '▶';
        } else {
            this.startAutoplay();
            if (playBtn) playBtn.textContent = '⏸';
        }
        
        this.isAutoplay = !this.isAutoplay;
    }

    startAutoplay() {
        this.autoplayInterval = setInterval(() => {
            this.nextSlide();
        }, 8000);
    }

    stopAutoplay() {
        if (this.autoplayInterval) {
            clearInterval(this.autoplayInterval);
            this.autoplayInterval = null;
        }
    }

    searchEvents(query) {
        if (!query.trim()) {
            this.filteredEvents = [...this.events];
        } else {
            const lowerQuery = query.toLowerCase();
            this.filteredEvents = this.events.filter(event => {
                const titleField = this.currentLanguage === 'english' ? 'title_english' : 'title';
                const detailsField = this.currentLanguage === 'english' ? 'details_english' : 'details';
                
                return (event[titleField] && event[titleField].toLowerCase().includes(lowerQuery)) ||
                       (event[detailsField] && event[detailsField].toLowerCase().includes(lowerQuery)) ||
                       (event.era_english && event.era_english.toLowerCase().includes(lowerQuery));
            });
        }
        
        this.generateTimelinePoints();
        this.generateEraBrackets();
        
        if (this.filteredEvents.length > 0) {
            this.showSlide(0, false);
        }
    }

    switchLanguage() {
        // Navigate to Persian version
        window.location.href = 'Fa.html';
    }
}

// Updated era color mapping to include both English and Persian names
const eraColorMap = {
    // English names
    'Sasanian': 'era-sasanian',
    'Islamic Era': 'era-islamic-era',
    'Safavid': 'era-safavid',
    'Afsharian': 'era-afsharian',
    'Zandian': 'era-zandian',
    'Qajar': 'era-qajar',
    'Pahlavi': 'era-pahlavi',
    'Islamic Republic': 'era-islamic-republic',
    'New Folder': 'era-new-folder', // Placeholder for future events

    // Persian names - matching your data
    'ساسانی': 'era-sasanian',
    'ساسانییان': 'era-sasanian',
    'دوران اسلامی': 'era-islamic-era',
    'صفوی': 'era-safavid',
    'صفویان': 'era-safavid',
    'افشاری': 'era-afsharian',
    'افشاریان': 'era-afsharian',
    'زندی': 'era-zandian',
    'زندیان': 'era-zandian',
    'قاجار': 'era-qajar',
    'پهلوی': 'era-pahlavi',
    'جمهوری اسلامی': 'era-islamic-republic'
};
function debugEraColors() {
    const contentPanel = document.querySelector('.content-panel');
    const timelineNav = document.querySelector('.timeline-nav');
    
    //console.log('Content Panel:', contentPanel);
   // console.log('Content Panel Classes:', contentPanel ? contentPanel.className : 'NOT FOUND');
    //console.log('Timeline Nav:', timelineNav);
   // console.log('Timeline Nav Classes:', timelineNav ? timelineNav.className : 'NOT FOUND');
}

function getEraClass(eraEnglish) {
    if (!eraEnglish) return 'era-default';
    const eraClass = eraColorMap[eraEnglish] || 'era-default';
    //console.log(`Era: ${eraEnglish} -> Class: ${eraClass}`);
    return eraClass;
}

// Global timeline instance
let timeline;

// Navigation functions
function nextSlide() {
    if (timeline) timeline.nextSlide();
}

function previousSlide() {
    if (timeline) timeline.previousSlide();
}

function toggleAutoplay() {
    if (timeline) timeline.toggleAutoplay();
}

function switchLanguage() {
    if (timeline) timeline.switchLanguage();
}

function toggleCardExpand() {
    const eventCard = document.getElementById('eventCard');
    if (eventCard) {
        eventCard.classList.toggle('collapsed');
    }
}

function navigateBack() {
    if (timeline && timeline.navigateBack) {
        timeline.navigateBack();
    } else {
        console.warn('Timeline not initialized or navigateBack method not available');
    }
}

function showTimelineLevel(level, context = null) {
    if (timeline && timeline.showTimelineLevel) {
        timeline.showTimelineLevel(level, context);
    } else {
        console.warn('Timeline not initialized or showTimelineLevel method not available');
    }
}

function toggleTimelineFilter(filterType) {
    if (timeline && timeline.toggleTimelineFilter) {
        timeline.toggleTimelineFilter(filterType);
    } else {
        console.warn('Timeline not initialized or toggleTimelineFilter method not available');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing timeline...');
    timeline = new IranHistoryTimeline();
    window.timeline = timeline; // Make globally accessible
});