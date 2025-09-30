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
            'Sasanian': { start: 224, end: 651 },
            'Islamic Era': { start: 652, end: 1508 },
            'Safavid': { start: 1509, end: 1736 },
            'Afsharian': { start: 1736, end: 1796 },
            'Zandian': { start: 1751, end: 1794 },
            'Qajar': { start: 1796, end: 1925 },
            'Pahlavi': { start: 1926, end: 1979 },
            'Islamic Republic': { start: 1979, end: 2025 },
            'New Folder' : { start: 2026, end: 3000 } // Placeholder for future events
        };
        
        this.init();
    }

    async init() {
        try {
            this.events = await this.getHistoricalEvents();
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

    async getHistoricalEvents() {
        try {
            const response = await fetch('assets/js/df.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const events = await response.json();
            
            // Convert dates to Date objects for proper calculation
            return events.map(event => ({
                ...event,
                dateObject: this.createDateObject(event)
            })).sort((a, b) => a.dateObject - b.dateObject);
        } catch (error) {
            console.error('Failed to load events:', error);
            return [];
        }
    }
    createDateObject(event) {
        const year = event.year_gregorian ;
        const month = event.month_gregorian;
        const day = event.day_gregorian ;
        
        // Handle BCE dates (negative years)
        if (year < 1) {
            return new Date(Math.abs(year), month - 1, day);
        }
        return new Date(year, month - 1, day);
    }

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
        
        switch (level) {
            case 'era':
                this.showEraLevel();
                // Clear timeline visualization for hierarchical view
                this.clearTimelineVisualization();
                break;
            case 'event':
                this.showEventLevel(context);
                // Filter events for this era
                this.filterEventsForEra(context);
                this.generateTimelinePoints();
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
            
            const eraElement = this.createHierarchicalTimelineItem({
                name: era,
                type: 'era',
                count: eraData.events.length,
                firstYear: Math.min(...eraData.events.map(e => e.year_gregorian || e.year || 0)),
                lastYear: Math.max(...eraData.events.map(e => e.year_gregorian || e.year || 0))
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
        const timelineYears = [600, 800, 1000, 1200, 1400, 1600, 1800, 2000];
        timelineYears.forEach(year => {
            const label = document.createElement('div');
            label.className = 'timeline-scale-label';
            label.textContent = year + ' CE';
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
            // Add hover effect
            eraElement.addEventListener('mouseenter', () => {
                this.showTimelineZoom(eraElement, false);
            });
            
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
        const timelineStart = 600;
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
            scaleYears = [600, 800, 1000, 1200, 1400, 1600, 1800, 2000];
        }
        
        scaleYears.forEach(year => {
            const label = document.createElement('div');
            label.className = 'timeline-scale-label';
            label.textContent = year + ' CE';
            
            if (focusStart && focusEnd && year >= focusStart && year <= focusEnd) {
                label.style.background = 'rgba(255, 255, 255, 0.3)';
                label.style.fontWeight = 'bold';
            }
            
            timelineScale.appendChild(label);
        });
    }

    getEraClassFromName(eraName) {
        const eraMapping = {
            'Sasanian': 'era-sasanian',
            'Islamic Era': 'era-islamic-era', 
            'Safavid': 'era-safavid',
            'Afsharian': 'era-afsharian',
            'Zandian': 'era-zandian',
            'Qajar': 'era-qajar',
            'Pahlavi': 'era-pahlavi',
            'Islamic Republic': 'era-islamic-republic',
            'New Folder' : 'era-new-folder' // Placeholder for future events
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
                } 
            }
        } 
        
        // Add appropriate padding based on the range
        const baseRange = maxYear - minYear;
        let padding;
        
        if (baseRange <= 10) {
            // For decades: minimal padding
            padding = 1;
        } else if (baseRange <= 100) {
            // For centuries: small padding
            padding = 5;
        } else {
            // For larger ranges: proportional padding
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
            timelineWidth = Math.max(800, totalRange * pixelsPerYear);
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
                const year = event.year_gregorian || event.year || 0;
                
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
            timelineWidth = '5000px'; // Cap max width for usability
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
        
        // Update active state for both timeline tracks
        document.querySelectorAll('.timeline-point, .timeline-event-dot').forEach((point) => {
            point.classList.remove('active');
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
        const mediaImage = document.getElementById('mediaImage');
        const mediaCaption = document.getElementById('mediaCaption');
        
        // Update content with fallbacks
        if (slideDate) {
            const date = event.date_gregorian || '';
            slideDate.textContent = date;
        }
        
        if (slideTitle) {
            const title = event[titleField] || event.title || 'Untitled Event';
            slideTitle.textContent = title;
        }
        
        if (slideText) {
            const details = event[detailsField] || event[descriptionField] || event.description || 'No description available';
            slideText.textContent = details;
        }
        
        if (slideEra) {
            const era = event.era_english || event.era_persian || 'Unknown Era';
            slideEra.textContent = era;
        }
        
        if (slideCategory) {
            const category = event.category || event.type || 'Event';
            slideCategory.textContent = category;
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