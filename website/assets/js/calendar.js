// Calendar Data
let allData = [];
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// Month names
const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

// Load data on page load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('assets/data/merged_data.json');
        const data = await response.json();
        
        // Convert object to array if needed
        if (!Array.isArray(data)) {
            allData = Object.values(data);
        } else {
            allData = data;
        }
        
        console.log(`Loaded ${allData.length} events/deaths`);
        renderCalendar();
        
        // Setup event listeners
        document.getElementById('prevMonth').addEventListener('click', () => {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            renderCalendar();
        });
        
        document.getElementById('nextMonth').addEventListener('click', () => {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            renderCalendar();
        });
        
        document.getElementById('closePanel').addEventListener('click', () => {
            document.getElementById('eventPanel').classList.remove('active');
        });
        
    } catch (error) {
        console.error('Error loading data:', error);
        alert('Error loading calendar data. Please check the console for details.');
    }
});

// Render calendar
function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    document.getElementById('currentMonth').textContent = `${monthNames[currentMonth]} ${currentYear}`;
    
    // Clear existing calendar (except headers)
    const headers = grid.querySelectorAll('.weekday-header');
    grid.innerHTML = '';
    headers.forEach(header => grid.appendChild(header));
    
    // Get first day of month and number of days
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
    
    // Add previous month's trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const dayElement = createDayElement(day, currentMonth - 1, true);
        grid.appendChild(dayElement);
    }
    
    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = createDayElement(day, currentMonth, false);
        grid.appendChild(dayElement);
    }
    
    // Add next month's leading days
    const totalCells = grid.children.length - 7; // Subtract headers
    const remainingCells = 42 - totalCells; // 6 rows * 7 days
    for (let day = 1; day <= remainingCells; day++) {
        const dayElement = createDayElement(day, currentMonth + 1, true);
        grid.appendChild(dayElement);
    }
}

// Create day element
function createDayElement(day, month, isOtherMonth) {
    const dayDiv = document.createElement('div');
    dayDiv.className = 'calendar-day';
    if (isOtherMonth) {
        dayDiv.classList.add('other-month');
    }
    
    // Get events for this day
    const events = getEventsForDate(month + 1, day);
    
    dayDiv.innerHTML = `
        <div class="day-number">${day}</div>
        ${events.length > 0 ? `
            <div class="day-event-count">${events.length} event${events.length > 1 ? 's' : ''}</div>
            <div class="event-indicator"></div>
        ` : ''}
    `;
    
    if (events.length > 0) {
        dayDiv.classList.add('has-events');
        dayDiv.addEventListener('click', () => showEvents(month + 1, day, events));
    }
    
    return dayDiv;
}

// Get events for specific date (month and day)
function getEventsForDate(month, day) {
    return allData.filter(item => {
        // Try multiple date field names
        const dateStr = item.Gregorian_Date || item.gregorian_date || item.date || '';
        
        if (!dateStr) return false;
        
        // Parse date (handle various formats)
        try {
            // Format: "YYYY-MM-DD" or similar
            const parts = dateStr.split('-');
            if (parts.length >= 2) {
                const itemMonth = parseInt(parts[1]);
                const itemDay = parseInt(parts[2]);
                return itemMonth === month && itemDay === day;
            }
            
            // Try as Date object
            const date = new Date(dateStr);
            return date.getMonth() + 1 === month && date.getDate() === day;
        } catch (e) {
            return false;
        }
    });
}

// Show events in panel
function showEvents(month, day, events) {
    const panel = document.getElementById('eventPanel');
    const panelDate = document.getElementById('panelDate');
    const panelContent = document.getElementById('panelContent');
    
    panelDate.textContent = `${monthNames[month - 1]} ${day}`;
    
    if (events.length === 0) {
        panelContent.innerHTML = '<p class="no-events">No events on this date</p>';
    } else {
        panelContent.innerHTML = events.map(item => createEventCard(item)).join('');
    }
    
    panel.classList.add('active');
}

// Create event card HTML
function createEventCard(item) {
    const isEvent = item.Type === 'Event' || item.type === 'Event' || item.Event_Description || item.event_description;
    const type = isEvent ? 'event' : 'death';
    
    // Get fields with fallbacks
    const title = item.Event_Name || item.event_name || item.Death_Name || item.death_name || 'Untitled';
    const description = item.Event_Description || item.event_description || item.Description || item.description || '';
    const year = item.Gregorian_Year || item.gregorian_year || item.Year || item.year || 'Unknown';
    const category = item.Category || item.category || '';
    const link = item.Event_Link || item.event_link || item.Link || item.link || '';
    
    return `
        <div class="event-item">
            <span class="event-type ${type}">${isEvent ? '📅 Event' : '⚰️ Death'}</span>
            <div class="event-title">${title}</div>
            <div class="event-year">Year: ${year}</div>
            ${category ? `<div class="event-category">Category: ${category}</div>` : ''}
            ${description ? `<div class="event-description">${description}</div>` : ''}
            ${link ? `<a href="${link}" target="_blank" class="event-link">Read more →</a>` : ''}
        </div>
    `;
}
