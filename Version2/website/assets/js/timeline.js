// Configuration
const DATA_FILES = [
    { file: 'Politics_data.json', category: 'Politics', displayName: 'Political Events' },
    { file: 'Economy_data.json', category: 'Economy', displayName: 'Economic Events' },
    { file: 'Social_data.json', category: 'Social', displayName: 'Social Events' },
    { file: 'Technology_Science_data.json', category: 'Technology_Science', displayName: 'Technology & Science' },
    { file: 'Health_data.json', category: 'Health', displayName: 'Health Events' },
    { file: 'Crime_Safety_data.json', category: 'Crime_Safety', displayName: 'Crime & Safety' },
    { file: 'Sports_Entertainment_data.json', category: 'Sports_Entertainment', displayName: 'Sports & Entertainment' },
    { file: 'Death_data.json', category: 'Death', displayName: 'Notable Deaths' },
    { file: 'Natural Disaster_data.json', category: 'Natural_Disaster', displayName: 'Natural Disasters' }
];

// Modal functionality
const modal = document.getElementById('eventModal');
const closeBtn = document.querySelector('.close');
const timelinesContainer = document.getElementById('timelines-container');

closeBtn.onclick = function() {
    modal.style.display = 'none';
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

// Show event details in modal
function showEventDetails(event) {
    const modalTitle = document.getElementById('modalTitle');
    const modalSubtitle = document.getElementById('modalSubtitle');
    const modalBody = document.getElementById('modalBody');

    modalTitle.textContent = event.title_english || event.title || 'Event';
    modalSubtitle.textContent = `${event.date_gregorian || ''} (${event.date_jalali || ''})`;

    let bodyHTML = '';

    // Persian Title
    if (event.title) {
        bodyHTML += `
            <div class="event-detail">
                <div class="event-label">Persian Title:</div>
                <div class="event-value" dir="rtl">${event.title}</div>
            </div>
        `;
    }

    // English Title
    if (event.title_english) {
        bodyHTML += `
            <div class="event-detail">
                <div class="event-label">English Title:</div>
                <div class="event-value">${event.title_english}</div>
            </div>
        `;
    }

    // Dates
    bodyHTML += `
        <div class="event-detail">
            <div class="event-label">Date:</div>
            <div class="event-value">
                Gregorian: ${event.date_gregorian || 'N/A'}<br>
                Jalali: ${event.date_jalali || 'N/A'}
            </div>
        </div>
    `;

    // Era
    if (event.era_english || event.era_persian) {
        bodyHTML += `
            <div class="event-detail">
                <div class="event-label">Era:</div>
                <div class="event-value">
                    ${event.era_english || ''} ${event.era_persian ? `(${event.era_persian})` : ''}
                </div>
            </div>
        `;
    }

    // Details
    if (event.details && event.details !== 'NaN' && event.details !== 'null') {
        bodyHTML += `
            <div class="event-detail">
                <div class="event-label">Details:</div>
                <div class="event-value">${event.details}</div>
            </div>
        `;
    }

    // Categories
    const categories = [];
    if (event['Crime/Safety'] || event['Crime_Safety']) categories.push('Crime_Safety');
    if (event['Economy']) categories.push('Economy');
    if (event['Health']) categories.push('Health');
    if (event['Natural Disaster'] || event['Natural_Disaster']) categories.push('Natural_Disaster');
    if (event['Politics']) categories.push('Politics');
    if (event['Social']) categories.push('Social');
    if (event['Sports/Entertainment'] || event['Sports_Entertainment']) categories.push('Sports_Entertainment');
    if (event['Technology/Science'] || event['Technology_Science']) categories.push('Technology_Science');
    if (event['Death']) categories.push('Death');

    if (categories.length > 0) {
        bodyHTML += `
            <div class="event-detail">
                <div class="event-label">Categories:</div>
                <div class="category-badges">
                    ${categories.map(cat => `<span class="category-badge">${cat}</span>`).join('')}
                </div>
            </div>
        `;
    }

    // Links
    const links = [];
    if (event.persian_wiki_links && event.persian_wiki_links !== 'NaN') {
        links.push(`<a href="${event.persian_wiki_links}" target="_blank" class="event-link">Persian Wikipedia</a>`);
    }
    if (event.english_wiki_links && event.english_wiki_links !== 'NaN') {
        links.push(`<a href="${event.english_wiki_links}" target="_blank" class="event-link">English Wikipedia</a>`);
    }

    if (links.length > 0) {
        bodyHTML += `
            <div class="event-detail">
                <div class="event-label">References:</div>
                <div class="event-links">
                    ${links.join('')}
                </div>
            </div>
        `;
    }

    modalBody.innerHTML = bodyHTML;
    modal.style.display = 'block';
}

// Helper function to add date overlays
function addDateOverlays(pointsContainer, minDate, maxDate, timeRange) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const yearSpan = (maxDate.getTime() - minDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    let monthStep;
    let showMonths = true;
    
    if (yearSpan > 100) {
        monthStep = 60;
        showMonths = false;
    } else if (yearSpan > 50) {
        monthStep = 24;
        showMonths = false;
    } else if (yearSpan > 20) {
        monthStep = 12;
        showMonths = false;
    } else if (yearSpan > 10) {
        monthStep = 6;
    } else if (yearSpan > 5) {
        monthStep = 3;
    } else {
        monthStep = 1;
    }
    
    let currentDate = new Date(minDate.getTime());
    currentDate.setDate(1);
    currentDate.setHours(0, 0, 0, 0);
    
    let monthCount = 0;
    const overlays = [];
    
    while (currentDate <= maxDate) {
        if (monthCount % monthStep === 0) {
            const startPos = ((currentDate.getTime() - minDate.getTime()) / timeRange) * 100;
            
            let nextDate = new Date(currentDate.getTime());
            nextDate.setMonth(nextDate.getMonth() + monthStep);
            const endPos = Math.min(((nextDate.getTime() - minDate.getTime()) / timeRange) * 100, 100);
            
            let dateLabel;
            if (showMonths) {
                dateLabel = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
            } else {
                dateLabel = currentDate.getFullYear().toString();
            }
            
            overlays.push({
                startPos,
                endPos,
                label: dateLabel
            });
        }
        
        currentDate.setMonth(currentDate.getMonth() + 1);
        monthCount++;
    }
    
    overlays.forEach((overlay, index) => {
        const band = document.createElement('div');
        band.className = 'date-overlay';
        band.style.top = `${overlay.startPos}%`;
        band.style.height = `${overlay.endPos - overlay.startPos}%`;
        
        if (index % 2 === 1) {
            band.style.background = 'rgba(102, 126, 234, 0.05)';
        }
        
        band.innerHTML = `<div class="date-overlay-label">${overlay.label}</div>`;
        pointsContainer.appendChild(band);
    });
}

// Helper function to add event points
function addEventPoints(pointsContainer, eventsByDate, minDate, timeRange) {
    // Category color mapping
    const categoryColors = {
        'Politics': '#ef4444',
        'Economy': '#10b981',
        'Social': '#f59e0b',
        'Technology_Science': '#06b6d4',
        'Health': '#8b5cf6',
        'Crime_Safety': '#f97316',
        'Sports_Entertainment': '#ec4899',
        'Death': '#6b7280',
        'Natural_Disaster': '#14b8a6'
    };

    Object.entries(eventsByDate).forEach(([date, dateEvents]) => {
        const eventDate = new Date(date);
        const position = ((eventDate - minDate) / timeRange) * 100;
        
        dateEvents.forEach((event, stackIndex) => {
            const point = document.createElement('div');
            point.className = 'timeline-point';
            
            const categories = event._categories || [event._category || 'Politics'];
            const categoryLabels = event._categoryLabels || [event._categoryLabel || 'Event'];
            
            // Set all categories on the point element for filtering
            point.dataset.categories = categories.join(',');
            point.dataset.category = categories[0]; // Primary category for backward compatibility
            
            const eventHash = (event.id || Math.random() * 1000);
            const hashSeed = eventHash * 9301 + 49297;
            const pseudoRandom = (hashSeed % 233280) / 233280;
            
            let horizontalOffset = (pseudoRandom - 0.5) * 300;
            const categoryOffsets = {
                'Politics': -20, 'Economy': 30, 'Social': -40,
                'Technology_Science': 50, 'Health': -30, 'Crime_Safety': 40,
                'Sports_Entertainment': -50, 'Death': 20, 'Natural_Disaster': 0
            };
            horizontalOffset += (categoryOffsets[categories[0]] || 0);
            
            const verticalJitter = stackIndex * 4 + (pseudoRandom * 2 - 1);
            
            const containerWidth = pointsContainer.offsetWidth || 1200;
            const centerPos = containerWidth / 2;
            const leftPos = centerPos + horizontalOffset;
            
            point.style.top = `${position}%`;
            point.style.left = `${leftPos}px`;
            point.style.transform = `translateY(${verticalJitter}px)`;
            
            const infoSide = horizontalOffset < 0 ? 'event-info-left' : 'event-info-right';
            
            const connector = document.createElement('div');
            connector.className = 'point-connector';
            if (horizontalOffset < 0) {
                connector.style.left = '10px';
                connector.style.width = `${Math.abs(horizontalOffset)}px`;
            } else {
                connector.style.right = '10px';
                connector.style.width = `${Math.abs(horizontalOffset)}px`;
            }
            
            // Create multi-category dot if event has multiple categories
            let dotHTML = '';
            if (categories.length > 1) {
                // Multiple categories - create nested circles
                const outerColor = categoryColors[categories[0]];
                const innerColor = categoryColors[categories[1]];
                dotHTML = `
                    <div class="point-dot multi-category" style="border-color: ${outerColor};">
                        <div class="inner-dot" style="background: ${innerColor};"></div>
                    </div>
                `;
            } else {
                // Single category
                dotHTML = `<div class="point-dot" data-category="${categories[0]}"></div>`;
            }
            
            // Create category badges for info tooltip
            const categoryBadgesHTML = categories.map((cat, idx) => 
                `<span class="event-category category-${cat}">${categoryLabels[idx]}</span>`
            ).join(' ');
            
            point.innerHTML = `
                ${dotHTML}
                <div class="event-info ${infoSide}">
                    ${categoryBadgesHTML}
                    <div style="margin-top: 5px; font-size: 0.9em;">${(event.title_english || event.title || 'Event').substring(0, 100)}${(event.title_english || event.title || '').length > 100 ? '...' : ''}</div>
                </div>
            `;
            
            point.appendChild(connector);
            point.onclick = () => showEventDetails(event);
            
            pointsContainer.appendChild(point);
        });
    });
}

// Helper for lazy loading all events in unified timeline
function lazyLoadUnifiedTimeline(pointsContainer, allEvents, minDate, timeRange, chunkSize = 200) {
    const sortedEvents = allEvents.filter(e => e.date_gregorian).sort((a, b) => new Date(a.date_gregorian) - new Date(b.date_gregorian));
    let loadedChunks = 0;
    let loading = false;

    function loadChunk() {
        console.log('[UnifiedInfiniteScroll] loadChunk called. loadedChunks:', loadedChunks, 'loading:', loading);
        if (loading) return;
        loading = true;
        const start = loadedChunks * chunkSize;
        const end = start + chunkSize;
        const chunkEvents = sortedEvents.slice(start, end);
        console.log('[UnifiedInfiniteScroll] chunkEvents.length:', chunkEvents.length, 'start:', start, 'end:', end);
        if (chunkEvents.length === 0) return;
        // Group by date for addEventPoints
        const chunkEventsByDate = {};
        chunkEvents.forEach(event => {
            const date = event.date_gregorian;
            if (!chunkEventsByDate[date]) chunkEventsByDate[date] = [];
            chunkEventsByDate[date].push(event);
        });
        addEventPoints(pointsContainer, chunkEventsByDate, minDate, timeRange);
        loadedChunks++;
        loading = false;
    }

    // Initial load
    loadChunk();

    function isNearBottom() {
        return (window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 200);
    }

    window.addEventListener('scroll', () => {
        if (isNearBottom()) {
            console.log('[UnifiedInfiniteScroll] Window near bottom, triggering loadChunk');
            loadChunk();
        }
    });
}

// Create timeline for a specific era
function createEraTimeline(events, eraName) {
    const validEvents = events
        .filter(event => event.date_gregorian)
        .sort((a, b) => new Date(a.date_gregorian) - new Date(b.date_gregorian));

    if (validEvents.length === 0) return null;

    const dates = validEvents.map(e => new Date(e.date_gregorian));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    const timeRange = maxDate - minDate;

    const timelineDiv = document.createElement('div');
    timelineDiv.className = 'timeline-container';
    timelineDiv.innerHTML = `
        <div class="timeline-line"></div>
        <div class="timeline-points" id="timeline-${eraName.replace(/\s+/g, '-')}"></div>
    `;

    const pointsContainer = timelineDiv.querySelector('.timeline-points');

    // Increase minimum height for large eras
    const containerHeight = Math.max(1200, validEvents.length * 8);
    timelineDiv.style.minHeight = `${containerHeight}px`;
    pointsContainer.style.height = `${containerHeight}px`;

    addDateOverlays(pointsContainer, minDate, maxDate, timeRange);

    const eventsByDate = {};
    validEvents.forEach(event => {
        const date = event.date_gregorian;
        if (!eventsByDate[date]) {
            eventsByDate[date] = [];
        }
        eventsByDate[date].push(event);
    });

    lazyLoadEventPoints(pointsContainer, eventsByDate, minDate, timeRange);

    if (eraName === 'Islamic Republic') {
        console.log('Islamic Republic validEvents:', validEvents.length, 'min:', minDate.toISOString(), 'max:', maxDate.toISOString());
    }

    return timelineDiv;
}

// Create unified timeline grouped by era
function createUnifiedTimeline(allEvents) {
    const section = document.createElement('div');
    section.className = 'timeline-section';

    section.innerHTML = `
        <div class="timeline-header">
            <div class="timeline-title">Iranian Historical Events Timeline</div>
            <div class="timeline-count">${allEvents.length} events</div>
        </div>
        <div class="sticky-controls">
            <div class="filter-section">
                <div class="filter-header">
                    <span class="filter-icon">🔍</span>
                    <span class="filter-label">Filter Categories</span>
                    <button class="toggle-filter" id="toggle-filter">▼</button>
                </div>
                <div class="filter-content collapsed" id="filter-content">
                    <div class="filter-options">
                        <label class="filter-option">
                            <input type="checkbox" class="category-filter" value="Politics" checked>
                            <span class="filter-color" style="background: #ef4444;"></span>
                            <span>Politics</span>
                        </label>
                        <label class="filter-option">
                            <input type="checkbox" class="category-filter" value="Economy" checked>
                            <span class="filter-color" style="background: #10b981;"></span>
                            <span>Economy</span>
                        </label>
                        <label class="filter-option">
                            <input type="checkbox" class="category-filter" value="Social" checked>
                            <span class="filter-color" style="background: #f59e0b;"></span>
                            <span>Social</span>
                        </label>
                        <label class="filter-option">
                            <input type="checkbox" class="category-filter" value="Technology_Science" checked>
                            <span class="filter-color" style="background: #06b6d4;"></span>
                            <span>Technology/Science</span>
                        </label>
                        <label class="filter-option">
                            <input type="checkbox" class="category-filter" value="Health" checked>
                            <span class="filter-color" style="background: #8b5cf6;"></span>
                            <span>Health</span>
                        </label>
                        <label class="filter-option">
                            <input type="checkbox" class="category-filter" value="Crime_Safety" checked>
                            <span class="filter-color" style="background: #f97316;"></span>
                            <span>Crime/Safety</span>
                        </label>
                        <label class="filter-option">
                            <input type="checkbox" class="category-filter" value="Sports_Entertainment" checked>
                            <span class="filter-color" style="background: #ec4899;"></span>
                            <span>Sports/Entertainment</span>
                        </label>
                        <label class="filter-option">
                            <input type="checkbox" class="category-filter" value="Death" checked>
                            <span class="filter-color" style="background: #6b7280;"></span>
                            <span>Death</span>
                        </label>
                        <label class="filter-option">
                            <input type="checkbox" class="category-filter" value="Natural_Disaster" checked>
                            <span class="filter-color" style="background: #14b8a6;"></span>
                            <span>Natural Disaster</span>
                        </label>
                    </div>
                </div>
            </div>
            <div class="timeline-controls">
                <button class="zoom-btn" id="zoom-out" title="Zoom Out">−</button>
                <span class="zoom-level">100%</span>
                <button class="zoom-btn" id="zoom-in" title="Zoom In">+</button>
            </div>
        </div>
        <div id="era-sections-container"></div>
    `;

    const eraSectionsContainer = section.querySelector('#era-sections-container');

    // Group events by era
    const eventsByEra = {};
    allEvents.forEach(event => {
        const eraEnglish = event.era_english || 'Unknown Era';
        const eraPersian = event.era_persian || '';
        const eraKey = `${eraEnglish}|||${eraPersian}`;
        
        if (!eventsByEra[eraKey]) {
            eventsByEra[eraKey] = [];
        }
        eventsByEra[eraKey].push(event);
    });

    // Define colors for different eras
    const eraColors = [
        '#ef4444', // red
        '#f59e0b', // amber
        '#10b981', // emerald
        '#06b6d4', // cyan
        '#3b82f6', // blue
        '#8b5cf6', // violet
        '#ec4899', // pink
        '#f97316', // orange
        '#14b8a6', // teal
        '#6366f1', // indigo
        '#a855f7', // purple
        '#84cc16'  // lime
    ];

    // Sort eras by earliest event date
    const sortedEras = Object.entries(eventsByEra).sort((a, b) => {
        const dateA = new Date(a[1].find(e => e.date_gregorian)?.date_gregorian || 0);
        const dateB = new Date(b[1].find(e => e.date_gregorian)?.date_gregorian || 0);
        return dateA - dateB;
    });

    // Restore per-era sections with per-era infinite scroll
    sortedEras.forEach(([eraKey, eraEvents], index) => {
        const [eraEnglish, eraPersian] = eraKey.split('|||');
        const eraSection = document.createElement('div');
        eraSection.className = 'era-section';
        const eraColor = eraColors[index % eraColors.length];
        eraSection.style.setProperty('--era-color', eraColor);
        const eraId = eraEnglish.replace(/\s+/g, '-').toLowerCase();
        eraSection.innerHTML = `
            <div class="era-header collapsed" data-era="${eraId}">
                <div class="era-title-group">
                    <span class="era-toggle">▼</span>
                    <div>
                        <div class="era-name">${eraEnglish}</div>
                        ${eraPersian ? `<div class="era-name-persian">${eraPersian}</div>` : ''}
                    </div>
                </div>
                <div class="era-count">${eraEvents.length} events</div>
            </div>
            <div class="era-content collapsed" id="era-content-${eraId}"></div>
        `;
        const eraHeader = eraSection.querySelector('.era-header');
        const eraContent = eraSection.querySelector('.era-content');
        eraHeader.addEventListener('click', () => {
            eraHeader.classList.toggle('collapsed');
            eraContent.classList.toggle('collapsed');
        });
        // Create timeline for this era with per-era lazy loading
        const validEvents = eraEvents.filter(event => event.date_gregorian).sort((a, b) => new Date(a.date_gregorian) - new Date(b.date_gregorian));
        if (validEvents.length === 0) return;
        const dates = validEvents.map(e => new Date(e.date_gregorian));
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        const timeRange = maxDate - minDate;
        const timelineDiv = document.createElement('div');
        timelineDiv.className = 'timeline-container';
        timelineDiv.innerHTML = `
            <div class="timeline-line"></div>
            <div class="timeline-points" id="timeline-${eraId}"></div>
        `;
        const pointsContainer = timelineDiv.querySelector('.timeline-points');
        const containerHeight = Math.max(1200, validEvents.length * 8);
        timelineDiv.style.minHeight = `${containerHeight}px`;
        pointsContainer.style.height = `${containerHeight}px`;
        addDateOverlays(pointsContainer, minDate, maxDate, timeRange);
        // Per-era lazy loading state
        let loadedChunks = 0;
        let loading = false;
        // Use smaller chunk size for large eras
        const chunkSize = validEvents.length > 1000 ? 50 : 200;
        // Loading indicator
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'timeline-loading';
        loadingDiv.style.display = 'none';
        loadingDiv.textContent = 'Loading more events...';
        timelineDiv.appendChild(loadingDiv);

        function showLoading() {
            loadingDiv.style.display = '';
        }
        function hideLoading() {
            loadingDiv.style.display = 'none';
        }

        function loadChunk() {
            if (loading) return;
            loading = true;
            showLoading();
            setTimeout(() => { // Simulate async loading for UX
                const start = loadedChunks * chunkSize;
                const end = start + chunkSize;
                if (start >= validEvents.length) {
                    hideLoading();
                    loading = false;
                    return;
                }
                const chunkEvents = validEvents.slice(start, end);
                const chunkEventsByDate = {};
                chunkEvents.forEach(event => {
                    const date = event.date_gregorian;
                    if (!chunkEventsByDate[date]) chunkEventsByDate[date] = [];
                    chunkEventsByDate[date].push(event);
                });
                addEventPoints(pointsContainer, chunkEventsByDate, minDate, timeRange);
                loadedChunks++;
                hideLoading();
                loading = false;
            }, 200); // 200ms delay for visual feedback
        }
        // Initial load
        loadChunk();
        // Helper to check if this era's content is near bottom of viewport
        function isEraContentNearBottom() {
            const rect = pointsContainer.getBoundingClientRect();
            return rect.bottom - window.innerHeight < 200;
        }
        // Attach window scroll event for this era
        window.addEventListener('scroll', () => {
            if (!eraContent.classList.contains('collapsed') && isEraContentNearBottom()) {
                loadChunk();
            }
        });
        eraContent.appendChild(timelineDiv);
        eraSectionsContainer.appendChild(eraSection);
    });

    // Add zoom functionality
    let zoomLevel = 1.0;
    const zoomInBtn = section.querySelector('#zoom-in');
    const zoomOutBtn = section.querySelector('#zoom-out');
    const zoomLevelDisplay = section.querySelector('.zoom-level');
    
    const updateZoom = () => {
        eraSectionsContainer.style.transform = `scale(${zoomLevel})`;
        eraSectionsContainer.style.transformOrigin = 'top center';
        zoomLevelDisplay.textContent = `${Math.round(zoomLevel * 100)}%`;
    };
    
    zoomInBtn.addEventListener('click', () => {
        if (zoomLevel < 2.0) {
            zoomLevel += 0.1;
            updateZoom();
        }
    });
    
    zoomOutBtn.addEventListener('click', () => {
        if (zoomLevel > 0.5) {
            zoomLevel -= 0.1;
            updateZoom();
        }
    });

    // Add filter toggle functionality
    const toggleFilterBtn = section.querySelector('#toggle-filter');
    const filterContent = section.querySelector('#filter-content');
    
    toggleFilterBtn.addEventListener('click', () => {
        filterContent.classList.toggle('collapsed');
        toggleFilterBtn.textContent = filterContent.classList.contains('collapsed') ? '▼' : '▲';
    });

    // Add category filtering functionality
    const categoryFilters = section.querySelectorAll('.category-filter');
    
    const applyFilters = () => {
        const selectedCategories = Array.from(categoryFilters)
            .filter(cb => cb.checked)
            .map(cb => cb.value);
        
        // Show/hide timeline points based on selected categories
        const allPoints = section.querySelectorAll('.timeline-point');
        allPoints.forEach(point => {
            const categories = (point.dataset.categories || point.dataset.category || '').split(',');
            // Show point if ANY of its categories are selected
            const shouldShow = categories.some(cat => selectedCategories.includes(cat.trim()));
            point.style.display = shouldShow ? '' : 'none';
        });
    };
    
    categoryFilters.forEach(filter => {
        filter.addEventListener('change', applyFilters);
    });

    return section;
}

// Load all timelines and combine into one
async function loadTimelines() {
    try {
        timelinesContainer.innerHTML = '<div class="loading">Loading events...</div>';

        const allEvents = [];
        
        for (const config of DATA_FILES) {
            try {
                const response = await fetch(`assets/data/${config.file}`);
                if (!response.ok) throw new Error(`Failed to load ${config.file}`);
                
                const text = await response.text();
                const cleanedText = text.replace(/:\s*NaN/g, ': null');
                const data = JSON.parse(cleanedText);
                
                if (data && data.length > 0) {
                    data.forEach(event => {
                        event._category = config.category;
                        event._categoryLabel = config.displayName;
                    });
                    allEvents.push(...data);
                }
            } catch (error) {
                console.error(`Error loading ${config.file}:`, error);
            }
        }

        // Merge duplicate events by unique key (id + date)
        const eventMap = new Map();
        allEvents.forEach(event => {
            const key = `${event.id || ''}_${event.date_gregorian || ''}_${event.title || ''}`;
            if (eventMap.has(key)) {
                // Event already exists, add this category to it
                const existing = eventMap.get(key);
                if (!existing._categories) {
                    existing._categories = [existing._category];
                    existing._categoryLabels = [existing._categoryLabel];
                }
                if (!existing._categories.includes(event._category)) {
                    existing._categories.push(event._category);
                    existing._categoryLabels.push(event._categoryLabel);
                }
            } else {
                // First time seeing this event
                event._categories = [event._category];
                event._categoryLabels = [event._categoryLabel];
                eventMap.set(key, event);
            }
        });

        const mergedEvents = Array.from(eventMap.values());

        timelinesContainer.innerHTML = '';

        if (mergedEvents.length > 0) {
            const timeline = createUnifiedTimeline(mergedEvents);
            if (timeline) {
                timelinesContainer.appendChild(timeline);
            }
        } else {
            timelinesContainer.innerHTML = '<div class="error">No events could be loaded.</div>';
        }
    } catch (error) {
        console.error('Error loading timelines:', error);
        timelinesContainer.innerHTML = `<div class="error">Error loading timelines: ${error.message}</div>`;
    }
}

// Initialize
loadTimelines();
