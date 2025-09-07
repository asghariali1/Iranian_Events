let events = [];

// Load events from JSON file
async function loadEvents() {
    try {
        const response = await fetch('assets/js/df.json');
        const data = await response.json();
        events = data.map(event => ({
            date: event.date_gregorian,
            title: event.title,
            link: event.link || '',
            tags: Array.isArray(event.type) ? event.type : [event.type || 'Event'],
            title_english: event.title_english || event.person_english || '',
            category: event.type || 'Event',
            fullDescription: event.description || event.title_english || event.title || 'No description available'
        }));
        
        console.log(`Loaded ${events.length} events from JSON`);
        
        // Initialize timeline after loading data
        new HorizontalTimeline();
    } catch (error) {
        console.error('Error loading events:', error);
        // Fallback to empty timeline if JSON fails to load
        new HorizontalTimeline();
    }
}

class HorizontalTimeline {
    constructor() {
        this.viewport = document.getElementById('timelineViewport');
        this.canvas = document.getElementById('timelineCanvas');
        
        // Check if required elements exist
        if (!this.viewport || !this.canvas) {
            console.error('Required timeline elements not found');
            return;
        }

        this.isDragging = false;
        this.lastX = 0;
        this.panX = 0;
        this.zoomLevel = 1;
        this.minZoom = 0.5;
        this.maxZoom = 3;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderTimeline();
        this.setupFilters();
        this.setupModal();
        this.animateItems();
    }

    renderTimeline() {
        // Clear existing items (keep timeline line)
        const timelineLine = this.canvas.querySelector('.timeline-line');
        this.canvas.innerHTML = '';
        if (timelineLine) {
            this.canvas.appendChild(timelineLine);
        } else {
            // Create timeline line if it doesn't exist
            const line = document.createElement('div');
            line.className = 'timeline-line';
            this.canvas.appendChild(line);
        }

        if (events.length === 0) {
            console.warn('No events to display');
            return;
        }

        // Calculate timeline width based on number of events
        const itemSpacing = 300; // Spacing between items
        const timelineWidth = Math.max(events.length * itemSpacing, this.viewport.offsetWidth);
        this.canvas.style.width = timelineWidth + 'px';
        class HistoricalTimeline {
  constructor() {
    this.currentYear = new Date().getFullYear();
    this.loadedEvents = new Map();
    this.visibleRange = { start: null, end: null };
  }
  
  async loadVisibleEvents() {
    // Only load events for currently visible time range
    const events = await loadEventsByRange(
      this.visibleRange.start,
      this.visibleRange.end
    );
    
    // Cache loaded events
    this.cacheEvents(events);
  }
}
        // Create timeline items
        events.forEach((event, index) => {
            const item = document.createElement('div');
            item.className = `timeline-item ${index % 2 === 0 ? 'above' : 'below'}`;
            item.setAttribute('data-category', event.category);
            item.style.left = `${index * itemSpacing + 150}px`; // Start offset + spacing

            // Create connector
            const connector = document.createElement('div');
            connector.className = 'timeline-connector';

            // Create marker
            const marker = document.createElement('div');
            marker.className = 'timeline-marker';

            // Create icon (use default icon or based on category)
            const icon = document.createElement('div');
            icon.className = 'timeline-icon';
            const iconClass = this.getIconForCategory(event.category);
            icon.innerHTML = `<i class="${iconClass}"></i>`;

            // Create content
            const content = document.createElement('div');
            content.className = 'timeline-content';
            content.setAttribute('data-bs-toggle', 'modal');
            content.setAttribute('data-bs-target', '#eventModal');
            content.setAttribute('data-event', index);

            content.innerHTML = `
                <div class="timeline-date">${event.date}</div>
                <div class="timeline-title">${event.title}</div>
                <div class="timeline-description">${this.truncateText(event.title_english || event.title, 100)}</div>
                <div class="timeline-tags">
                    ${event.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            `;

            // Assemble the item
            item.appendChild(connector);
            item.appendChild(marker);
            item.appendChild(icon);
            item.appendChild(content);

            this.canvas.appendChild(item);
        });

        console.log(`Rendered ${events.length} timeline items`);
    }

    getIconForCategory(category) {
        const iconMap = {
            'Event': 'fas fa-calendar',
            'milestone': 'fas fa-flag',
            'achievement': 'fas fa-trophy',
            'launch': 'fas fa-rocket',
            'default': 'fas fa-circle'
        };
        return iconMap[category] || iconMap.default;
    }

    truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    setupEventListeners() {
        const zoomIn = document.getElementById('zoomIn');
        const zoomOut = document.getElementById('zoomOut');
        const resetView = document.getElementById('resetView');

        if (zoomIn) zoomIn.addEventListener('click', () => this.zoomIn());
        if (zoomOut) zoomOut.addEventListener('click', () => this.zoomOut());
        if (resetView) resetView.addEventListener('click', () => this.resetView());

        // Pan functionality
        this.canvas.addEventListener('mousedown', (e) => this.startPan(e));
        this.canvas.addEventListener('mousemove', (e) => this.doPan(e));
        this.canvas.addEventListener('mouseup', () => this.endPan());
        this.canvas.addEventListener('mouseleave', () => this.endPan());

        // Touch support
        this.canvas.addEventListener('touchstart', (e) => this.startPan(e.touches[0]));
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.doPan(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', () => this.endPan());

        // Mouse wheel zoom
        this.viewport.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY < 0) {
                this.zoomIn();
            } else {
                this.zoomOut();
            }
        });
    }

    zoomIn() {
        if (this.zoomLevel < this.maxZoom) {
            this.zoomLevel *= 1.2;
            this.updateTransform();
        }
    }

    zoomOut() {
        if (this.zoomLevel > this.minZoom) {
            this.zoomLevel /= 1.2;
            this.updateTransform();
        }
    }

    resetView() {
        this.zoomLevel = 1;
        this.panX = 0;
        this.updateTransform();
    }

    startPan(e) {
        this.isDragging = true;
        this.lastX = e.clientX;
        this.canvas.style.cursor = 'grabbing';
    }

    doPan(e) {
        if (!this.isDragging) return;
        
        const deltaX = e.clientX - this.lastX;
        this.panX += deltaX / this.zoomLevel;
        this.lastX = e.clientX;
        this.updateTransform();
    }

    endPan() {
        this.isDragging = false;
        this.canvas.style.cursor = 'grab';
    }

    updateTransform() {
        // Constrain pan based on zoom level and content width
        const canvasWidth = this.canvas.offsetWidth;
        const viewportWidth = this.viewport.offsetWidth;
        const scaledWidth = canvasWidth * this.zoomLevel;
        
        const maxPanLeft = 0;
        const maxPanRight = Math.max(0, scaledWidth - viewportWidth);
        
        this.panX = Math.max(-maxPanRight, Math.min(maxPanLeft, this.panX));

        this.canvas.style.transform = `translateX(${this.panX}px) scaleX(${this.zoomLevel})`;
        
        // Update zoom indicator
        const indicator = document.getElementById('zoomIndicator');
        if (indicator) {
            indicator.textContent = Math.round(this.zoomLevel * 100) + '%';
        }
    }

    setupFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                const filter = button.getAttribute('data-filter');
                this.filterItems(filter);
            });
        });
    }

    filterItems(filter) {
        const timelineItems = document.querySelectorAll('.timeline-item');

        timelineItems.forEach((item, index) => {
            const category = item.getAttribute('data-category');
            
            if (filter === 'all' || category === filter) {
                item.style.display = 'block';
                setTimeout(() => {
                    item.classList.add('animate');
                }, index * 100);
            } else {
                item.classList.remove('animate');
                setTimeout(() => {
                    item.style.display = 'none';
                }, 300);
            }
        });
    }

    setupModal() {
        // Use event delegation for dynamically created elements
        document.addEventListener('click', (e) => {
            const eventElement = e.target.closest('[data-event]');
            if (eventElement) {
                const eventIndex = parseInt(eventElement.getAttribute('data-event'));
                const event = events[eventIndex];

                if (event) {
                    const modalTitle = document.getElementById('modalTitle');
                    const modalDate = document.getElementById('modalDate');
                    const modalDescription = document.getElementById('modalDescription');
                    const modalTags = document.getElementById('modalTags');

                    if (modalTitle) modalTitle.textContent = event.title;
                    if (modalDate) modalDate.textContent = event.date;
                    if (modalDescription) {
                        modalDescription.innerHTML = `
                            <p><strong>Title:</strong> ${event.title}</p>
                            ${event.title_english ? `<p><strong>English Title:</strong> ${event.title_english}</p>` : ''}
                            <p><strong>Full Description:</strong> ${event.fullDescription}</p>
                            ${event.link ? `<p><strong>Link:</strong> <a href="${event.link}" target="_blank">${event.link}</a></p>` : ''}
                        `;
                    }
                    if (modalTags) {
                        modalTags.innerHTML = event.tags.map(tag => 
                            `<span class="tag">${tag}</span>`
                        ).join(' ');
                    }
                }
            }
        });
    }

    animateItems() {
        setTimeout(() => {
            document.querySelectorAll('.timeline-item').forEach((item, index) => {
                setTimeout(() => {
                    item.classList.add('animate');
                }, index * 200);
            });
        }, 500);
    }
}
window.addEventListener('scroll', () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000) {
    loadMoreData();
  }
});
// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', loadEvents);