class IranHistoryTimelinePersian {
            constructor() {
                this.currentSlide = 0;
                this.isAutoplay = true;
                this.autoplayInterval = null;
                this.events = [];
                this.filteredEvents = [];
                this.isEnglish = false;
                
                this.init();
            }

            async init() {
                this.events = await this.getHistoricalEvents();
                this.filteredEvents = [...this.events];
                this.generateTimelinePoints();
                this.setupEventListeners();
                this.showSlide(0);
                this.startAutoplay();
            }

            async getHistoricalEvents() {
                       const response = await fetch('/assets/js/df.json');
        return await response.json();
            }

            // Convert English numbers to Persian numbers
            toPersianDigits(str) {
                const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
                return str.toString().replace(/[0-9]/g, function(w) {
                    return persianDigits[parseInt(w)];
                });
            }

            generateTimelinePoints() {
                const track = document.getElementById('timelineTrack');
                const line = track.querySelector('.timeline-line');
                
                // Clear existing points
                track.innerHTML = '<div class="timeline-line"></div>';
                
                this.filteredEvents.forEach((event, index) => {
                    const point = document.createElement('div');
                    point.className = `timeline-point ${index === 0 ? 'active' : ''}`;
                    point.onclick = () => this.showSlide(index);
                    
                    const yearText = this.isEnglish ? 
                        (event.era_english > 0 ? event.era_english : Math.abs(event.era_english) + ' BCE') :
                        event.era_persian;
                    
                    point.innerHTML = `
                        <div class="timeline-dot"></div>
                        <div class="timeline-year">${yearText}</div>
                    `;
                    
                    track.appendChild(point);
                });
            }

            setupEventListeners() {
                const searchBox = document.getElementById('searchBox');
                searchBox.addEventListener('input', (e) => this.searchEvents(e.target.value));
                
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'ArrowLeft') this.previousSlide();
                    if (e.key === 'ArrowRight') this.nextSlide();
                    if (e.key === ' ') {
                        e.preventDefault();
                        this.toggleAutoplay();
                    }
                });
            }

            showSlide(index, animate = true) {
                if (index < 0 || index >= this.filteredEvents.length) return;
                
                const event = this.filteredEvents[index];
                const slideContent = document.getElementById('slideContent');
                const mediaImage = document.getElementById('mediaImage');
                
                document.querySelectorAll('.timeline-point').forEach((point, i) => {
                    point.classList.toggle('active', i === index);
                });
                
                if (animate) {
                    slideContent.classList.remove('active');
                    mediaImage.classList.remove('active');
                    
                    setTimeout(() => {
                        this.updateSlideContent(event);
                        slideContent.classList.add('active');
                        mediaImage.classList.add('active');
                    }, 300);
                } else {
                    this.updateSlideContent(event);
                }
                
                this.currentSlide = index;
                this.scrollToActivePoint();
            }

            updateSlideContent(event) {
                const dateText = this.isEnglish ? event.date_gregorian : event.date;
                const titleText = this.isEnglish ? event.title_english : event.title;
                const detailsText = this.isEnglish ? event.details_english : event.details;
                const captionText = this.isEnglish ? event.caption : (event.caption_persian || event.caption);
                
                document.getElementById('slideDate').textContent = this.isEnglish ? dateText : this.toPersianDigits(dateText);
                document.getElementById('slideTitle').textContent = titleText;
                document.getElementById('slideText').textContent = detailsText;
                document.getElementById('mediaImage').src = event.image;
                document.getElementById('mediaCaption').textContent = captionText;
            }

            scrollToActivePoint() {
                const activePoint = document.querySelector('.timeline-point.active');
                if (activePoint) {
                    activePoint.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center',
                        inline: 'center'
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
                    playBtn.textContent = '▶';
                } else {
                    this.startAutoplay();
                    playBtn.textContent = '⏸';
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

            switchLanguage() {
                this.isEnglish = !this.isEnglish;
                
                const title = document.querySelector('.timeline-title');
                const subtitle = document.querySelector('.timeline-subtitle');
                const searchBox = document.getElementById('searchBox');
                const langBtn = document.querySelector('.language-switch');
                
                if (this.isEnglish) {
                    title.textContent = 'History of Iran';
                    subtitle.textContent = 'Journey Through Persian History';
                    searchBox.placeholder = 'Search events...';
                    langBtn.textContent = 'فا | EN';
                    document.documentElement.setAttribute('lang', 'en');
                    document.body.style.direction = 'ltr';
                } else {
                    title.textContent = 'تاریخ ایران';
                    subtitle.textContent = 'سفر در تاریخ ایران باستان';
                    searchBox.placeholder = 'جستجوی رویدادها...';
                    langBtn.textContent = 'EN | فا';
                    document.documentElement.setAttribute('lang', 'fa');
                    document.body.style.direction = 'rtl';
                }
                
                this.generateTimelinePoints();
                this.showSlide(this.currentSlide, false);
            }

            searchEvents(query) {
                if (!query.trim()) {
                    this.filteredEvents = [...this.events];
                } else {
                    this.filteredEvents = this.events.filter(event => {
                        const searchFields = this.isEnglish ? 
                            [event.title_english, event.details_english] :
                            [event.title, event.details];
                        
                        return searchFields.some(field => 
                            field && field.toLowerCase().includes(query.toLowerCase())
                        );
                    });
                }
                
                this.generateTimelinePoints();
                
                if (this.filteredEvents.length > 0) {
                    this.showSlide(0, false);
                }
            }
        }

        let timeline;

        function nextSlide() {
            timeline.nextSlide();
        }

        function previousSlide() {
            timeline.previousSlide();
        }

        function toggleAutoplay() {
            timeline.toggleAutoplay();
        }

        function switchLanguage() {
            timeline.switchLanguage();
        }

        document.addEventListener('DOMContentLoaded', () => {
            timeline = new IranHistoryTimelinePersian();
        });