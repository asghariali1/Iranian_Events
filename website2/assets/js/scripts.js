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
            this.filteredEvents = [...this.events];
            this.generateTimelinePoints();
            this.generateEraBrackets();
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

    generateEraBrackets() {
        const track = document.getElementById('timelineTrack');
        if (!track) return;

        // Remove existing era brackets
        const existingBrackets = track.querySelectorAll('.era-bracket');
        existingBrackets.forEach(bracket => bracket.remove());

        // Group events by era
        const eraGroups = {};
        this.filteredEvents.forEach(event => {
            const era = event.era_english || 'Unknown';
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
        this.currentLanguage = this.currentLanguage === 'english' ? 'persian' : 'english';
        // Update current slide content
        if (this.filteredEvents.length > 0) {
            this.updateSlideContent(this.filteredEvents[this.currentSlide]);
        }
    }
}

// Era color mapping
const eraColorMap = {
    'Sasanian': 'era-sasanian',
    'Islamic Era': 'era-islamic-era',
    'Safavid': 'era-safavid',
    'Afsharian': 'era-afsharian',
    'Zandian': 'era-zandian',
    'Qajar': 'era-qajar',
    'Pahlavi': 'era-pahlavi',
    'Islamic Republic': 'era-islamic-republic'
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
    console.log('DOM loaded, initializing timeline...');
    timeline = new IranHistoryTimeline();
});