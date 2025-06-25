class Chatbot {
    constructor() {
        this.isAuthenticated = false;
        this.credentials = {
            username: 'manas123',
            password: 'Admin@123'
        };
        
        // Check if Swiper is available
        this.checkSwiperAvailability();
        
        this.initializeElements();
        this.setupEventListeners();
        this.checkAuthentication();
    }

    checkSwiperAvailability() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.verifySwiper();
            });
        } else {
            this.verifySwiper();
        }
    }

    verifySwiper() {
        if (typeof Swiper === 'undefined') {
            console.warn('Swiper library not loaded. Carousel functionality will use fallback cards.');
            this.swiperAvailable = false;
        } else {
            console.log('Swiper library loaded successfully');
            this.swiperAvailable = true;
        }
    }

    initializeElements() {
        // Login elements
        this.loginContainer = document.getElementById('loginContainer');
        this.chatbotContainer = document.getElementById('chatbotContainer');
        this.loginForm = document.getElementById('loginForm');
        this.usernameInput = document.getElementById('username');
        this.passwordInput = document.getElementById('password');
        this.loginError = document.getElementById('loginError');
        this.logoutBtn = document.getElementById('logoutBtn');

        // Chat elements
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.fileInput = document.getElementById('fileInput');
        this.botTypingIndicator = document.getElementById('botTypingIndicator');
        this.userTypingIndicator = document.getElementById('userTypingIndicator');
        this.status = document.getElementById('status');

        // Modal elements
        this.dashboardBtn = document.getElementById('dashboardBtn');
        this.broadcastBtn = document.getElementById('broadcastBtn');
        this.dashboardModal = document.getElementById('dashboardModal');
        this.broadcastModal = document.getElementById('broadcastModal');
        this.closeDashboard = document.getElementById('closeDashboard');
        this.closeBroadcast = document.getElementById('closeBroadcast');

        this.sessionId = null;
        this.isTyping = false;
        this.typingTimeout = null;
    }

    setupEventListeners() {
        // Login form
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        this.logoutBtn.addEventListener('click', () => this.handleLogout());

        // Chat functionality
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Typing indicators
        this.messageInput.addEventListener('input', () => this.handleUserTyping());

        // File upload
        this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));

        // Modal controls
        this.dashboardBtn.addEventListener('click', () => this.showDashboard());
        this.broadcastBtn.addEventListener('click', () => this.showBroadcast());
        this.closeDashboard.addEventListener('click', () => this.hideDashboard());
        this.closeBroadcast.addEventListener('click', () => this.hideBroadcast());

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === this.dashboardModal) this.hideDashboard();
            if (e.target === this.broadcastModal) this.hideBroadcast();
        });
    }

    checkAuthentication() {
        const isLoggedIn = sessionStorage.getItem('isLoggedIn');
        if (isLoggedIn === 'true') {
            this.isAuthenticated = true;
            this.showChatbot();
        } else {
            this.showLogin();
        }
    }

    handleLogin(e) {
        e.preventDefault();
        
        const username = this.usernameInput.value.trim();
        const password = this.passwordInput.value.trim();

        if (username === this.credentials.username && password === this.credentials.password) {
            this.isAuthenticated = true;
            sessionStorage.setItem('isLoggedIn', 'true');
            this.showChatbot();
            this.loginError.style.display = 'none';
        } else {
            this.showLoginError('Invalid username or password. Please try again.');
        }
    }

    handleLogout() {
        this.isAuthenticated = false;
        sessionStorage.removeItem('isLoggedIn');
        this.showLogin();
        this.clearChat();
    }

    showLoginError(message) {
        this.loginError.textContent = message;
        this.loginError.style.display = 'block';
        this.passwordInput.value = '';
        this.passwordInput.focus();
    }

    showLogin() {
        this.loginContainer.style.display = 'flex';
        this.chatbotContainer.style.display = 'none';
        this.usernameInput.focus();
    }

    showChatbot() {
        this.loginContainer.style.display = 'none';
        this.chatbotContainer.style.display = 'block';
        this.initializeChat();
    }

    clearChat() {
        this.chatMessages.innerHTML = `
            <div class="message bot-message">
                <div class="message-content">
                    <div class="message-avatar">
                        <div class="medical-robot-icon-small">
                            <i class="fas fa-robot"></i>
                            <i class="fas fa-cross"></i>
                        </div>
                    </div>
                    <div class="message-text">
                        Hello! I'm your AI assistant powered by IBM Watson. How can I help you today?
                    </div>
                </div>
                <div class="message-time">Just now</div>
            </div>
        `;
    }

    async initializeChat() {
        try {
            this.status.textContent = 'Connecting...';
            const response = await fetch('/api/session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.sessionId = data.sessionId;
                this.status.textContent = 'Connected';
                this.status.style.color = '#4CAF50';
            } else {
                this.status.textContent = 'Connection failed';
                this.status.style.color = '#f44336';
            }
        } catch (error) {
            console.error('Error initializing chat:', error);
            this.status.textContent = 'Connection failed';
            this.status.style.color = '#f44336';
        }
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        this.addUserMessage(message);
        this.messageInput.value = '';
        this.hideUserTyping();

        // Show bot typing indicator
        this.showBotTyping();

        try {
            const response = await fetch('/api/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    sessionId: this.sessionId
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.hideBotTyping();
                this.handleBotResponse(data);
            } else {
                this.hideBotTyping();
                this.addBotMessage('Sorry, I encountered an error. Please try again.');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            this.hideBotTyping();
            this.addBotMessage('Sorry, I encountered an error. Please try again.');
        }
    }

    handleBotResponse(data) {
        // The server sends the response in format: { response: watsonResponse, sessionId: sessionId, ... }
        const watsonResponse = data.response;
        
        if (watsonResponse && watsonResponse.output && watsonResponse.output.generic) {
            watsonResponse.output.generic.forEach(item => {
                if (item.response_type === 'text') {
                    this.addBotMessage(item.text);
                } else if (item.response_type === 'option') {
                    this.addOptionButtons(item.options);
                } else if (item.response_type === 'user_defined') {
                    this.handleCustomResponse(item);
                }
            });
        } else if (watsonResponse && watsonResponse.output && watsonResponse.output.text) {
            // Handle simple text responses
            this.addBotMessage(watsonResponse.output.text);
        } else {
            this.addBotMessage('Sorry, I encountered an error. Please try again.');
        }
    }

    handleCustomResponse(item) {
        if (item.user_defined && item.user_defined.user_defined_type === 'carousel') {
            this.createCarousel(item.user_defined.carousel_data);
        } else {
            // Handle other custom response types
            this.addBotMessage('Received custom response: ' + JSON.stringify(item.user_defined));
        }
    }

    createCarousel(carouselData) {
        try {
            // Check if Swiper is available
            if (!this.swiperAvailable || typeof Swiper === 'undefined') {
                console.warn('Swiper not available, using fallback cards');
                this.createFallbackCards(carouselData);
                return;
            }

            const messageDiv = document.createElement('div');
            messageDiv.className = 'message bot-message';
            
            const avatar = document.createElement('div');
            avatar.className = 'message-avatar';
            avatar.innerHTML = '<div class="medical-robot-icon-small"><i class="fas fa-robot"></i><i class="fas fa-cross"></i></div>';
            
            const content = document.createElement('div');
            content.className = 'message-content';
            
            // Create carousel HTML structure
            content.innerHTML = `
                <div class="Carousel">
                    <div class="swiper">
                        <div class="swiper-wrapper"></div>
                    </div>
                    <div class="Carousel__Navigation">
                        <button type="button" class="Carousel__NavigationButton Carousel__NavigationPrevious">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <div class="Carousel__BulletContainer"></div>
                        <button type="button" class="Carousel__NavigationButton Carousel__NavigationNext">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            `;
            
            messageDiv.appendChild(avatar);
            messageDiv.appendChild(content);
            this.chatMessages.appendChild(messageDiv);
            
            // Create slides
            const slidesContainer = content.querySelector('.swiper-wrapper');
            this.createSlides(slidesContainer, carouselData);
            
            // Initialize Swiper with proper configuration and error handling
            const swiperElement = content.querySelector('.swiper');
            if (!swiperElement) {
                throw new Error('Swiper element not found');
            }

            const swiper = new Swiper(swiperElement, {
                slidesPerView: 1,
                spaceBetween: 20,
                loop: false,
                allowTouchMove: true,
                grabCursor: true,
                watchSlidesProgress: true,
                watchSlidesVisibility: true,
                pagination: {
                    el: content.querySelector('.Carousel__BulletContainer'),
                    clickable: true,
                    bulletClass: 'swiper-pagination-bullet',
                    bulletActiveClass: 'swiper-pagination-bullet-active',
                    type: 'bullets',
                    dynamicBullets: false
                },
                navigation: {
                    nextEl: content.querySelector('.Carousel__NavigationNext'),
                    prevEl: content.querySelector('.Carousel__NavigationPrevious'),
                    disabledClass: 'swiper-button-disabled',
                    hiddenClass: 'swiper-button-hidden'
                },
                breakpoints: {
                    768: {
                        slidesPerView: 2,
                        spaceBetween: 20
                    },
                    1024: {
                        slidesPerView: 3,
                        spaceBetween: 20
                    }
                },
                on: {
                    init: function() {
                        console.log('Swiper initialized successfully');
                        // Update navigation button states on init
                        this.updateNavigation();
                    },
                    slideChange: function() {
                        // Update navigation button states on slide change
                        this.updateNavigation();
                    },
                    error: function(error) {
                        console.error('Swiper error:', error);
                    }
                }
            });
            
            console.log('Carousel created successfully with', carouselData.length, 'items');
            this.scrollToBottom();
            
        } catch (error) {
            console.error('Error creating carousel:', error);
            // Fallback: show items as simple cards instead of carousel
            this.createFallbackCards(carouselData);
        }
    }

    createSlides(slidesContainer, carouselData) {
        carouselData.forEach((cardData, index) => {
            const { url, title, description, alt, icon } = cardData;
            const slideElement = document.createElement('div');
            slideElement.classList.add('swiper-slide');
            
            // Use icon if provided, otherwise use a default icon
            const iconHtml = icon ? `<i class="${icon}"></i>` : '<i class="fas fa-info-circle"></i>';
            
            slideElement.innerHTML = `
                <div class="Carousel__Card">
                    <div class="Carousel__CardImage">
                        ${iconHtml}
                    </div>
                    <div class="Carousel__CardText">
                        <div class="Carousel__CardTitle">${title}</div>
                        <div class="Carousel__CardDescription">${description}</div>
                    </div>
                    <button type="button" class="Carousel__CardButton Carousel__CardButtonMessage" data-index="${index}">
                        Tell me more about this
                    </button>
                </div>
            `;
            
            // Add click event for the button
            const button = slideElement.querySelector('.Carousel__CardButtonMessage');
            button.addEventListener('click', () => {
                this.handleCarouselButtonClick(title, description, index);
            });
            
            slidesContainer.appendChild(slideElement);
        });
    }

    handleCarouselButtonClick(title, description, index) {
        // Add user message showing what they clicked
        this.addUserMessage(`I'm interested in: ${title}`);
        
        // Create rating system
        const ratingMessage = this.createRatingSystem(title, description);
        
        // Add the rating message to chat
        this.chatMessages.appendChild(ratingMessage);
        this.scrollToBottom();
    }

    createRatingSystem(title, description) {
        const ratingContainer = document.createElement('div');
        ratingContainer.className = 'message bot-message rating-message';
        ratingContainer.innerHTML = `
            <div class="message-content">
                <div class="message-avatar">
                    <div class="medical-robot-icon-small">
                        <i class="fas fa-robot"></i>
                        <i class="fas fa-cross"></i>
                    </div>
                </div>
                <div class="message-text">
                    <div class="rating-info">
                        <h4>${this.escapeHtml(title)}</h4>
                        <p>${this.escapeHtml(description)}</p>
                        <p class="rating-prompt">How would you rate this information?</p>
                    </div>
                    <div class="star-rating">
                        <span class="star" data-rating="1">★</span>
                        <span class="star" data-rating="2">★</span>
                        <span class="star" data-rating="3">★</span>
                        <span class="star" data-rating="4">★</span>
                        <span class="star" data-rating="5">★</span>
                    </div>
                    <div class="rating-feedback" style="display: none;">
                        <p class="rating-text"></p>
                        <button class="rating-submit-btn">Submit Rating</button>
                    </div>
                </div>
            </div>
            <div class="message-time">${this.getCurrentTime()}</div>
        `;

        // Add event listeners for star rating
        const stars = ratingContainer.querySelectorAll('.star');
        const ratingFeedback = ratingContainer.querySelector('.rating-feedback');
        const ratingText = ratingContainer.querySelector('.rating-text');
        const submitBtn = ratingContainer.querySelector('.rating-submit-btn');
        let selectedRating = 0;

        stars.forEach(star => {
            star.addEventListener('mouseover', () => {
                const rating = parseInt(star.dataset.rating);
                this.highlightStars(stars, rating);
            });

            star.addEventListener('mouseout', () => {
                this.highlightStars(stars, selectedRating);
            });

            star.addEventListener('click', () => {
                selectedRating = parseInt(star.dataset.rating);
                this.highlightStars(stars, selectedRating);
                this.showRatingFeedback(ratingFeedback, ratingText, selectedRating);
            });
        });

        // Handle rating submission
        submitBtn.addEventListener('click', () => {
            this.submitRating(title, selectedRating, ratingContainer);
        });

        return ratingContainer;
    }

    highlightStars(stars, rating) {
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    showRatingFeedback(feedbackElement, textElement, rating) {
        const feedbackMessages = {
            1: "Poor - This information wasn't helpful at all.",
            2: "Fair - This information was somewhat helpful.",
            3: "Good - This information was helpful.",
            4: "Very Good - This information was very helpful.",
            5: "Excellent - This information was extremely helpful!"
        };

        textElement.textContent = feedbackMessages[rating];
        feedbackElement.style.display = 'block';
    }

    submitRating(title, rating, ratingContainer) {
        // Store rating in localStorage for persistence
        const ratings = JSON.parse(localStorage.getItem('chatbotRatings') || '{}');
        ratings[title] = {
            rating: rating,
            timestamp: new Date().toISOString(),
            count: (ratings[title]?.count || 0) + 1
        };
        localStorage.setItem('chatbotRatings', JSON.stringify(ratings));

        // Add user rating message
        this.addUserMessage(`I rated "${title}" ${rating} star${rating > 1 ? 's' : ''}`);

        // Bot response based on rating
        setTimeout(() => {
            let response = '';
            if (rating >= 4) {
                response = `Thank you for the ${rating}-star rating! I'm glad you found the information about "${title}" helpful. Is there anything else you'd like to know?`;
            } else if (rating >= 3) {
                response = `Thanks for the ${rating}-star rating for "${title}". I'll work on providing even better information. What else can I help you with?`;
            } else {
                response = `I appreciate your ${rating}-star feedback for "${title}". I'll use this to improve my responses. How can I better assist you?`;
            }
            this.addBotMessage(response);
        }, 500);

        // Remove the rating container
        ratingContainer.remove();
    }

    // Method to get average rating for a specific item
    getAverageRating(title) {
        const ratings = JSON.parse(localStorage.getItem('chatbotRatings') || '{}');
        const itemRating = ratings[title];
        return itemRating ? itemRating.rating : null;
    }

    // Method to get all ratings for analytics
    getAllRatings() {
        return JSON.parse(localStorage.getItem('chatbotRatings') || '{}');
    }

    addUserMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user-message';
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-text">${this.escapeHtml(text)}</div>
            </div>
            <div class="message-time">${this.getCurrentTime()}</div>
        `;
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    addBotMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-avatar">
                    <div class="medical-robot-icon-small">
                        <i class="fas fa-robot"></i>
                        <i class="fas fa-cross"></i>
                    </div>
                </div>
                <div class="message-text">${this.escapeHtml(text)}</div>
            </div>
            <div class="message-time">${this.getCurrentTime()}</div>
        `;
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    addOptionButtons(options) {
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'option-buttons';
        
        options.forEach(option => {
            const button = document.createElement('button');
            button.className = 'option-btn';
            button.textContent = option.label;
            button.addEventListener('click', () => {
                this.messageInput.value = option.label;
                this.sendMessage();
                buttonsContainer.remove();
            });
            buttonsContainer.appendChild(button);
        });
        
        this.chatMessages.appendChild(buttonsContainer);
        this.scrollToBottom();
    }

    handleUserTyping() {
        if (!this.isTyping) {
            this.isTyping = true;
            this.showUserTyping();
        }

        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            this.isTyping = false;
            this.hideUserTyping();
        }, 1000);
    }

    showUserTyping() {
        this.userTypingIndicator.style.display = 'flex';
        this.scrollToBottom();
    }

    hideUserTyping() {
        this.userTypingIndicator.style.display = 'none';
    }

    showBotTyping() {
        this.botTypingIndicator.style.display = 'flex';
        this.scrollToBottom();
    }

    hideBotTyping() {
        this.botTypingIndicator.style.display = 'none';
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            this.addUserMessage(`📎 Uploaded: ${file.name}`);
            // Here you would typically upload the file to your server
            // For now, we'll just acknowledge the upload
            setTimeout(() => {
                this.addBotMessage('I received your file. How can I help you with it?');
            }, 1000);
        }
    }

    showDashboard() {
        try {
            console.log('Opening dashboard...');
            this.dashboardModal.style.display = 'flex';
            console.log('Dashboard modal displayed');
            
            // Add a small delay to ensure modal is visible before creating charts
            setTimeout(() => {
                this.createCharts();
                console.log('Charts created');
            }, 100);
        } catch (error) {
            console.error('Error showing dashboard:', error);
        }
    }

    hideDashboard() {
        try {
            this.dashboardModal.style.display = 'none';
        } catch (error) {
            console.error('Error hiding dashboard:', error);
        }
    }

    showBroadcast() {
        try {
            this.broadcastModal.style.display = 'flex';
        } catch (error) {
            console.error('Error showing broadcast:', error);
        }
    }

    hideBroadcast() {
        try {
            this.broadcastModal.style.display = 'none';
        } catch (error) {
            console.error('Error hiding broadcast:', error);
        }
    }

    createCharts() {
        try {
            console.log('Creating charts...');
            
            // Check if Chart.js is available
            if (typeof Chart === 'undefined') {
                console.error('Chart.js is not loaded!');
                return;
            }
            
            // Check if canvas elements exist
            const conversationCanvas = document.getElementById('conversationChart');
            const activityCanvas = document.getElementById('activityChart');
            const ratingCanvas = document.getElementById('ratingChart');
            
            if (!conversationCanvas) {
                console.error('conversationChart canvas not found!');
                return;
            }
            
            if (!activityCanvas) {
                console.error('activityChart canvas not found!');
                return;
            }
            
            console.log('Canvas elements found, creating charts...');
            
            // Conversation Trends Chart
            const conversationCtx = conversationCanvas.getContext('2d');
            new Chart(conversationCtx, {
                type: 'line',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                        label: 'Conversations',
                        data: [120, 190, 300, 500, 200, 300, 450],
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });

            // Activity Distribution Chart
            const activityCtx = activityCanvas.getContext('2d');
            new Chart(activityCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Medical Queries', 'General Questions', 'File Uploads', 'System Issues'],
                    datasets: [{
                        data: [45, 30, 15, 10],
                        backgroundColor: [
                            '#4CAF50',
                            '#2196F3',
                            '#FF9800',
                            '#F44336'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });

            // Rating Analytics Chart
            if (ratingCanvas) {
                const ratingCtx = ratingCanvas.getContext('2d');
                const ratingData = this.getRatingAnalytics();
                
                new Chart(ratingCtx, {
                    type: 'bar',
                    data: {
                        labels: ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'],
                        datasets: [{
                            label: 'Number of Ratings',
                            data: ratingData.distribution,
                            backgroundColor: [
                                '#F44336',
                                '#FF9800',
                                '#FFC107',
                                '#4CAF50',
                                '#2196F3'
                            ],
                            borderColor: [
                                '#D32F2F',
                                '#F57C00',
                                '#FFA000',
                                '#388E3C',
                                '#1976D2'
                            ],
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                display: false
                            },
                            title: {
                                display: true,
                                text: `Average Rating: ${ratingData.average.toFixed(1)}/5.0 (${ratingData.total} total ratings)`,
                                color: '#333',
                                font: {
                                    size: 14,
                                    weight: 'bold'
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    stepSize: 1
                                }
                            }
                        }
                    }
                });
            }
            
            console.log('Charts created successfully');
        } catch (error) {
            console.error('Error creating charts:', error);
        }
    }

    getRatingAnalytics() {
        const ratings = this.getAllRatings();
        const distribution = [0, 0, 0, 0, 0]; // 1-5 stars
        let totalRating = 0;
        let totalCount = 0;

        Object.values(ratings).forEach(item => {
            if (item.rating >= 1 && item.rating <= 5) {
                distribution[item.rating - 1]++;
                totalRating += item.rating;
                totalCount++;
            }
        });

        return {
            distribution: distribution,
            average: totalCount > 0 ? totalRating / totalCount : 0,
            total: totalCount
        };
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    getCurrentTime() {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    createFallbackCards(carouselData) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = '<div class="medical-robot-icon-small"><i class="fas fa-robot"></i><i class="fas fa-cross"></i></div>';
        
        const content = document.createElement('div');
        content.className = 'message-content';
        
        let cardsHTML = '<div class="fallback-cards">';
        carouselData.forEach((cardData, index) => {
            const { title, description, icon } = cardData;
            const iconHtml = icon ? `<i class="${icon}"></i>` : '<i class="fas fa-info-circle"></i>';
            
            cardsHTML += `
                <div class="fallback-card">
                    <div class="fallback-card-image">
                        ${iconHtml}
                    </div>
                    <div class="fallback-card-text">
                        <div class="fallback-card-title">${title}</div>
                        <div class="fallback-card-description">${description}</div>
                    </div>
                    <button type="button" class="fallback-card-button" data-index="${index}">
                        Tell me more about this
                    </button>
                </div>
            `;
        });
        cardsHTML += '</div>';
        
        content.innerHTML = cardsHTML;
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        this.chatMessages.appendChild(messageDiv);
        
        // Add click events to fallback buttons
        const buttons = content.querySelectorAll('.fallback-card-button');
        buttons.forEach((button, index) => {
            button.addEventListener('click', () => {
                const cardData = carouselData[index];
                this.handleCarouselButtonClick(cardData.title, cardData.description, index);
            });
        });
        
        this.scrollToBottom();
    }
}

// Initialize the chatbot when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new Chatbot();
}); 