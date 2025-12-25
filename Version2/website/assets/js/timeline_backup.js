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

const MAX_POINTS_PER_TIMELINE = 20; // Limit points for better visualization

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
    if (event['Crime/Safety']) categories.push('Crime/Safety');
    if (event['Economy']) categories.push('Economy');
    if (event['Health']) categories.push('Health');
    if (event['Natural Disaster']) categories.push('Natural Disaster');
    if (event['Politics']) categories.push('Politics');
    if (event['Social']) categories.push('Social');
    if (event['Sports/Entertainment']) categories.push('Sports/Entertainment');
    if (event['Technology/Science']) categories.push('Technology/Science');
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

// Create timeline for a specific era
function createEraTimeline(events, eraName) {
    // Filter events with valid dates and sort chronologically
    const validEvents = events
        .filter(event => event.date_gregorian)
        .sort((a, b) => new Date(a.date_gregorian) - new Date(b.date_gregorian));

    if (validEvents.length === 0) return null;

    // Get date range
    const dates = events.map(e => new Date(e.date_gregorian));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    const timeRange = maxDate - minDate;

    const section = document.createElement('div');
    section.className = 'timeline-section';

    section.innerHTML = `
        <div class="timeline-header">
            <div class="timeline-title">Iranian Historical Events Timeline</div>
            <div class="timeline-count">${events.length} events</div>
        </div>
        <div class="timeline-container">
            <div class="timeline-line"></div>
            <div class="timeline-points" id="unified-timeline"></div>
        </div>
    `;

    const pointsContainer = section.querySelector('#unified-timeline');

    // Calculate container height based on events (more compressed)
    const containerHeight = Math.max(400, events.length * 8);
    section.querySelector('.timeline-container').style.minHeight = `${containerHeight}px`;
    section.querySelector('.timeline-points').style.height = `${containerHeight}px`;

    // Add date overlay bands (monthly/yearly based on span)
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Determine date step based on timeline length (in years)
    const yearSpan = (maxDate.getTime() - minDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    let monthStep;
    let showMonths = true;
    
    if (yearSpan > 100) {
        monthStep = 60; // Every 5 years
        showMonths = false;
    } else if (yearSpan > 50) {
        monthStep = 24; // Every 2 years
        showMonths = false;
    } else if (yearSpan > 20) {
        monthStep = 12; // Every year
        showMonths = false;
    } else if (yearSpan > 10) {
        monthStep = 6; // Every 6 months
    } else if (yearSpan > 5) {
        monthStep = 3; // Every 3 months
    } else {
        monthStep = 1; // Every month
    }
    
    let currentDate = new Date(minDate.getTime());
    currentDate.setDate(1);
    currentDate.setHours(0, 0, 0, 0);
    
    let monthCount = 0;
    const overlays = [];
    
    while (currentDate <= maxDate) {
        if (monthCount % monthStep === 0) {
            const startPos = ((currentDate.getTime() - minDate.getTime()) / timeRange) * 100;
            
            // Calculate end position for this overlay
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
    
    // Create overlay bands
    overlays.forEach((overlay, index) => {
        const band = document.createElement('div');
        band.className = 'date-overlay';
        band.style.top = `${overlay.startPos}%`;
        band.style.height = `${overlay.endPos - overlay.startPos}%`;
        
        // Alternate slightly darker bands for visual separation
        if (index % 2 === 1) {
            band.style.background = 'rgba(102, 126, 234, 0.05)';
        }
        
        band.innerHTML = `<div class="date-overlay-label">${overlay.label}</div>`;
        pointsContainer.appendChild(band);
    });

    // Group events by date to handle horizontal stacking
    const eventsByDate = {};
    events.forEach(event => {
        const date = event.date_gregorian;
        if (!eventsByDate[date]) {
            eventsByDate[date] = [];
        }
        eventsByDate[date].push(event);
    });

    // Add event points
    Object.entries(eventsByDate).forEach(([date, dateEvents]) => {
        const eventDate = new Date(date);
        const position = ((eventDate - minDate) / timeRange) * 100;
        
        dateEvents.forEach((event, stackIndex) => {
            const point = document.createElement('div');
            point.className = 'timeline-point';
            
            const category = event._category || 'Politics';
            const categoryLabel = event._categoryLabel || 'Event';
            
            // Create creative scatter pattern
            // Use hash of event ID to create consistent but pseudo-random positioning
            const eventHash = (event.id || Math.random() * 1000);
            const hashSeed = eventHash * 9301 + 49297;
            const pseudoRandom = (hashSeed % 233280) / 233280;
            
            // Scatter horizontally: -150px to +150px from center, with bias away from center
            let horizontalOffset = (pseudoRandom - 0.5) * 300;
            // Add some clustering by category
            const categoryOffsets = {
                'Politics': -20, 'Economy': 30, 'Social': -40,
                'Technology_Science': 50, 'Health': -30, 'Crime_Safety': 40,
                'Sports_Entertainment': -50, 'Death': 20, 'Natural_Disaster': 0
            };
            horizontalOffset += (categoryOffsets[category] || 0);
            
            // Stack multiple events on same date vertically with slight offset
            const verticalJitter = stackIndex * 4 + (pseudoRandom * 2 - 1);
            
            // Position the point
            const containerWidth = pointsContainer.offsetWidth || 1200;
            const centerPos = containerWidth / 2;
            const leftPos = centerPos + horizontalOffset;
            
            point.style.top = `${position}%`;
            point.style.left = `${leftPos}px`;
            point.style.transform = `translateY(${verticalJitter}px)`;
            
            // Determine if event info should be on left or right
            const infoSide = horizontalOffset < 0 ? 'event-info-left' : 'event-info-right';
            
            // Add connector line from dot to center timeline
            const connector = document.createElement('div');
            connector.className = 'point-connector';
            if (horizontalOffset < 0) {
                connector.style.left = '14px';
                connector.style.width = `${Math.abs(horizontalOffset)}px`;
            } else {
                connector.style.right = '14px';
                connector.style.width = `${Math.abs(horizontalOffset)}px`;
            }
            
            point.innerHTML = `
                <div class="point-dot" data-category="${category}"></div>
                <div class="event-info ${infoSide}">
                    <span class="event-category category-${category}">${categoryLabel}</span>
                    <div style="margin-top: 5px; font-size: 0.9em;">${(event.title_english || event.title || 'Event').substring(0, 100)}${(event.title_english || event.title || '').length > 100 ? '...' : ''}</div>
                </div>
            `;
            
            point.appendChild(connector);
            point.onclick = () => showEventDetails(event);
            
            pointsContainer.appendChild(point);
        });
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
                
                // Get as text first to clean NaN values
                const text = await response.text();
                const cleanedText = text.replace(/:\s*NaN/g, ': null');
                const data = JSON.parse(cleanedText);
                
                if (data && data.length > 0) {
                    // Add category information to each event
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

        timelinesContainer.innerHTML = '';

        if (allEvents.length > 0) {
            const timeline = createUnifiedTimeline(allEvents);
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
