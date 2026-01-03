class IranHistoryTimelinePersian {
    constructor() {
        this.currentSlide = 0;
        this.isAutoplay = true;
        this.autoplayInterval = null;
        this.events = [];
        this.filteredEvents = [];
        this.currentLanguage = 'persian';
        this.timelineScale = 1;
        this.minDate = null;
        this.maxDate = null;
        
        // Hierarchical timeline properties
        this.currentLevel = 'era'; // 'era', 'century', 'decade', 'event'
        this.currentEra = null;
        this.currentCentury = null;
        this.currentDecade = null;
        this.hierarchicalData = {};
        this.navigationHistory = [];
        
        this.init();
    }

    // Convert English numbers to Persian numbers
    toPersianDigits(str) {
        const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        return str.toString().replace(/[0-9]/g, function(w) {
            return persianDigits[parseInt(w)];
        });
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
                }, 100);
            }
            
            this.startAutoplay();
        } catch (error) {
            console.error('Error initializing timeline:', error);
        }
    }

    async getHistoricalEvents() {
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
            
            console.log(`Loaded ${allEvents.length} events from ${categoryFiles.length} category files`);
            
            // Convert dates to Date objects for proper calculation
            return allEvents.map(event => ({
                ...event,
                dateObject: this.createDateObject(event)
            })).sort((a, b) => a.dateObject - b.dateObject);
        } catch (error) {
            console.error('Failed to load events:', error);
            return [];
        }
    }

    createDateObject(event) {
        const year = event.year_gregorian || event.year || 1;
        const month = event.month_gregorian || event.month || 1;
        const day = event.day_gregorian || event.day || 1;
        
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
            const era = event.era_english || event.era_persian || event.era || 'Unknown';
            const year = event.year_gregorian || event.year || 0;
            const century = Math.floor(year / 100) * 100;
            const decade = Math.floor(year / 10) * 10;
            
            // Build hierarchy: era -> century -> decade -> events
            if (!this.hierarchicalData[era]) {
                this.hierarchicalData[era] = {
                    name: era,
                    type: 'era',
                    events: [],
                    centuries: {}
                };
            }
            
            if (!this.hierarchicalData[era].centuries[century]) {
                this.hierarchicalData[era].centuries[century] = {
                    name: `${century}s`,
                    type: 'century',
                    events: [],
                    decades: {}
                };
            }
            
            if (!this.hierarchicalData[era].centuries[century].decades[decade]) {
                this.hierarchicalData[era].centuries[century].decades[decade] = {
                    name: `${decade}s`,
                    type: 'decade',
                    events: []
                };
            }
            
            // Add event to all levels
            this.hierarchicalData[era].events.push(event);
            this.hierarchicalData[era].centuries[century].events.push(event);
            this.hierarchicalData[era].centuries[century].decades[decade].events.push(event);
        });
        
        console.log('Hierarchical data built:', this.hierarchicalData);
    }

    showTimelineLevel(level, context = null) {
        this.currentLevel = level;
        
        switch (level) {
            case 'era':
                this.showEraLevel();
                break;
            case 'century':
                this.showCenturyLevel(context);
                break;
            case 'decade':
                this.showDecadeLevel(context.era, context.century);
                break;
            case 'event':
                this.showEventLevel(context.era, context.century, context.decade);
                break;
        }
        
        this.updateBreadcrumb();
    }

    showEraLevel() {
        this.currentEra = null;
        this.currentCentury = null;
        this.currentDecade = null;
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
                this.showTimelineLevel('century', era);
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
    }

    showCenturyLevel(era) {
        this.currentEra = era;
        this.currentCentury = null;
        this.currentDecade = null;
        
        const track = document.getElementById('timelineTrack');
        if (!track) return;
        
        track.innerHTML = '';
        
        const centuries = Object.keys(this.hierarchicalData[era].centuries);
        centuries.forEach((century, index) => {
            const centuryData = this.hierarchicalData[era].centuries[century];
            const position = (index * 150) + 100;
            
            const centuryElement = this.createHierarchicalTimelineItem({
                name: `${century}s`,
                type: 'century',
                count: centuryData.events.length,
                firstYear: Math.min(...centuryData.events.map(e => e.year_gregorian || e.year || 0)),
                lastYear: Math.max(...centuryData.events.map(e => e.year_gregorian || e.year || 0))
            }, position, () => {
                this.navigationHistory.push({level: 'century', era: era});
                this.currentCentury = century;
                this.showTimelineLevel('decade', {era: era, century: century});
            });
            
            track.appendChild(centuryElement);
        });
        
        // Show first century's events in content panel
        if (centuries.length > 0) {
            const firstCentury = this.hierarchicalData[era].centuries[centuries[0]];
            if (firstCentury.events.length > 0) {
                this.updateSlideContent(firstCentury.events[0]);
            }
        }
    }

    showDecadeLevel(era, century) {
        this.currentCentury = century;
        this.currentDecade = null;
        
        const track = document.getElementById('timelineTrack');
        if (!track) return;
        
        track.innerHTML = '';
        
        const decades = Object.keys(this.hierarchicalData[era].centuries[century].decades);
        decades.forEach((decade, index) => {
            const decadeData = this.hierarchicalData[era].centuries[century].decades[decade];
            const position = (index * 120) + 100;
            
            const decadeElement = this.createHierarchicalTimelineItem({
                name: `${decade}s`,
                type: 'decade',
                count: decadeData.events.length,
                firstYear: Math.min(...decadeData.events.map(e => e.year_gregorian || e.year || 0)),
                lastYear: Math.max(...decadeData.events.map(e => e.year_gregorian || e.year || 0))
            }, position, () => {
                this.navigationHistory.push({level: 'decade', era: era, century: century});
                this.currentDecade = decade;
                this.showTimelineLevel('event', {era: era, century: century, decade: decade});
            });
            
            track.appendChild(decadeElement);
        });
        
        // Show first decade's events in content panel
        if (decades.length > 0) {
            const firstDecade = this.hierarchicalData[era].centuries[century].decades[decades[0]];
            if (firstDecade.events.length > 0) {
                this.updateSlideContent(firstDecade.events[0]);
            }
        }
    }

    showEventLevel(era, century, decade) {
        this.currentDecade = decade;
        
        const track = document.getElementById('timelineTrack');
        if (!track) return;
        
        track.innerHTML = '';
        
        const events = this.hierarchicalData[era].centuries[century].decades[decade].events;
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
        
        let breadcrumbHTML = '<span class="breadcrumb-item" onclick="timeline.showTimelineLevel(\'era\')">Eras</span>';
        let levelText = 'Era Level';
        
        if (this.currentEra) {
            breadcrumbHTML += ` > <span class="breadcrumb-item" onclick="timeline.showTimelineLevel('century', '${this.currentEra}')">${this.currentEra}</span>`;
            levelText = 'Century Level';
        }
        
        if (this.currentCentury) {
            breadcrumbHTML += ` > <span class="breadcrumb-item" onclick="timeline.showTimelineLevel('decade', {era: '${this.currentEra}', century: '${this.currentCentury}'})">${this.currentCentury}s</span>`;
            levelText = 'Decade Level';
        }
        
        if (this.currentDecade) {
            breadcrumbHTML += ` > <span class="breadcrumb-item active">${this.currentDecade}s</span>`;
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
            case 'century':
                this.showTimelineLevel('century', lastState.era);
                break;
            case 'decade':
                this.showTimelineLevel('decade', {era: lastState.era, century: lastState.century});
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

        // Calculate total width needed
        let maxPosition = 0;

        this.filteredEvents.forEach((event, index) => {
            const position = this.calculatePosition(event);
            maxPosition = Math.max(maxPosition, position);
            
            const point = document.createElement('div');
            point.className = `timeline-point ${index === 0 ? 'active' : ''}`;
            
            // Add era-specific class for coloring - try different era field names
            const eraName = event.era_english || event.era_persian || event.era;
            const eraClass = getEraClass(eraName);
            point.classList.add(eraClass);
            
            console.log(`Event: ${event.title_english || event.title}, Era: ${eraName}, Era Class: ${eraClass}`);
            
            // Position the point
            point.style.left = `${position}px`;
            point.onclick = () => this.showSlide(index);
            
            // Calculate date display
            const year = event.year_gregorian || event.year || 0;
            const yearDisplay = year > 0 ? year : Math.abs(year) + ' BCE';
            
            point.innerHTML = `
                <div class="timeline-dot"></div>
                <div class="timeline-year">${yearDisplay}</div>
                <div class="timeline-month-day">${event.month_gregorian || event.month || 1}/${event.day_gregorian || event.day || 1}</div>
            `;
            
            // Add era background
            const eraBackground = document.createElement('div');
            eraBackground.className = `timeline-point-background ${eraClass}`;
            point.appendChild(eraBackground);
            
            track.appendChild(point);
        });

        // Set timeline line and track width to accommodate all points
        const totalWidth = maxPosition + 200;
        timelineLine.style.width = `${totalWidth}px`;
        
        // Ensure the track container can accommodate the full width
        const trackInner = track.querySelector('.timeline-track');
        if (!trackInner) {
            const inner = document.createElement('div');
            inner.className = 'timeline-track';
            inner.style.width = `${totalWidth}px`;
            inner.style.position = 'relative';
            
            while (track.firstChild) {
                inner.appendChild(track.firstChild);
            }
            track.appendChild(inner);
        } else {
            trackInner.style.width = `${totalWidth}px`;
        }
    }

    showCenturyLevel(era) {
        this.currentEra = era;
        this.currentCentury = null;
        this.currentDecade = null;
        
        const track = document.getElementById('timelineTrack');
        if (!track) return;
        
        track.innerHTML = '';
        
        const centuries = Object.keys(this.hierarchicalData[era].centuries);
        centuries.forEach((century, index) => {
            const centuryData = this.hierarchicalData[era].centuries[century];
            const position = (index * 150) + 100;
            
            const centuryElement = this.createHierarchicalTimelineItem({
                name: `${century}s`,
                type: 'century',
                count: centuryData.events.length,
                firstYear: Math.min(...centuryData.events.map(e => e.year_gregorian || e.year || 0)),
                lastYear: Math.max(...centuryData.events.map(e => e.year_gregorian || e.year || 0))
            }, position, () => {
                this.navigationHistory.push({level: 'century', era: era});
                this.currentCentury = century;
                this.showTimelineLevel('decade', {era: era, century: century});
            });
            
            track.appendChild(centuryElement);
        });
        
        // Show first century's events in content panel
        if (centuries.length > 0) {
            const firstCentury = this.hierarchicalData[era].centuries[centuries[0]];
            if (firstCentury.events.length > 0) {
                this.updateSlideContent(firstCentury.events[0]);
            }
        }
    }

    showDecadeLevel(era, century) {
        this.currentCentury = century;
        this.currentDecade = null;
        
        const track = document.getElementById('timelineTrack');
        if (!track) return;
        
        track.innerHTML = '';
        
        const decades = Object.keys(this.hierarchicalData[era].centuries[century].decades);
        decades.forEach((decade, index) => {
            const decadeData = this.hierarchicalData[era].centuries[century].decades[decade];
            const position = (index * 120) + 100;
            
            const decadeElement = this.createHierarchicalTimelineItem({
                name: `${decade}s`,
                type: 'decade',
                count: decadeData.events.length,
                firstYear: Math.min(...decadeData.events.map(e => e.year_gregorian || e.year || 0)),
                lastYear: Math.max(...decadeData.events.map(e => e.year_gregorian || e.year || 0))
            }, position, () => {
                this.navigationHistory.push({level: 'decade', era: era, century: century});
                this.currentDecade = decade;
                this.showTimelineLevel('event', {era: era, century: century, decade: decade});
            });
            
            track.appendChild(decadeElement);
        });
        
        // Show first decade's events in content panel
        if (decades.length > 0) {
            const firstDecade = this.hierarchicalData[era].centuries[century].decades[decades[0]];
            if (firstDecade.events.length > 0) {
                this.updateSlideContent(firstDecade.events[0]);
            }
        }
    }

    showEventLevel(era, century, decade) {
        this.currentDecade = decade;
        
        const track = document.getElementById('timelineTrack');
        if (!track) return;
        
        track.innerHTML = '';
        
        const events = this.hierarchicalData[era].centuries[century].decades[decade].events;
        this.filteredEvents = events;
        
        // Use original timeline generation for events
        this.generateTimelinePoints();
        
        // Show first event
        if (events.length > 0) {
            this.showSlide(0, false);
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

        // Calculate total width needed
        let maxPosition = 0;

        this.filteredEvents.forEach((event, index) => {
            const position = this.calculatePosition(event);
            maxPosition = Math.max(maxPosition, position);
            
            const point = document.createElement('div');
            point.className = `timeline-point ${index === 0 ? 'active' : ''}`;
            
            // Add era-specific class for coloring
            const eraClass = getEraClass(event.era_english);
            point.classList.add(eraClass);
            
            console.log(`Event: ${event.title_english}, Era: ${event.era_english}, Era Class: ${eraClass}`);
            
            // Position the point
            point.style.left = `${position}px`;
            point.onclick = () => this.showSlide(index);
            
            // Calculate date display
            const year = event.year_gregorian || event.year || 0;
            const yearDisplay = year > 0 ? year : Math.abs(year) + ' BCE';
            
            point.innerHTML = `
                <div class="timeline-dot"></div>
                <div class="timeline-year">${yearDisplay}</div>
                <div class="timeline-month-day">${event.month_gregorian || event.month || 1}/${event.day_gregorian || event.day || 1}</div>
            `;
            
            // Add era background
            const eraBackground = document.createElement('div');
            eraBackground.className = `timeline-point-background ${eraClass}`;
            point.appendChild(eraBackground);
            
            track.appendChild(point);
        });

        // Set timeline line and track width to accommodate all points
        const totalWidth = maxPosition + 200;
        timelineLine.style.width = `${totalWidth}px`;
        
        // Ensure the track container can accommodate the full width
        const trackInner = track.querySelector('.timeline-track');
        if (!trackInner) {
            const inner = document.createElement('div');
            inner.className = 'timeline-track';
            inner.style.width = `${totalWidth}px`;
            inner.style.position = 'relative';
            
            while (track.firstChild) {
                inner.appendChild(track.firstChild);
            }
            track.appendChild(inner);
        } else {
            trackInner.style.width = `${totalWidth}px`;
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
        console.log('Showing slide for event:', event.title_english, 'Era:', event.era_english);
        
        const slideContent = document.getElementById('slideContent');
        const mediaImage = document.getElementById('mediaImage');
        
        document.querySelectorAll('.timeline-point').forEach((point, i) => {
            point.classList.toggle('active', i === index);
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
            const date = event.date_gregorian || event.date || '';
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
        console.log('Updating era backgrounds for:', era);
        
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
                console.log('Adding era class to content panel:', eraClass);
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
                console.log('Adding era class to timeline nav:', eraClass);
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
        // Navigate to English version
        window.location.href = 'index.html';
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
    
    console.log('Content Panel:', contentPanel);
    console.log('Content Panel Classes:', contentPanel ? contentPanel.className : 'NOT FOUND');
    console.log('Timeline Nav:', timelineNav);
    console.log('Timeline Nav Classes:', timelineNav ? timelineNav.className : 'NOT FOUND');
}

function getEraClass(eraEnglish) {
    if (!eraEnglish) return 'era-default';
    const eraClass = eraColorMap[eraEnglish] || 'era-default';
    console.log(`Era: ${eraEnglish} -> Class: ${eraClass}`);
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing Persian timeline...');
    timeline = new IranHistoryTimelinePersian();
});