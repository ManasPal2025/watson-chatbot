class Chatbot {
    constructor() {
        this.isAuthenticated = false;
        this.credentials = {
            username: 'manas123',
            password: 'Admin@123'
        };
        
        this.initializeElements();
        this.setupEventListeners();
        this.checkAuthentication();
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
        
        // Initialize Swiper
        const swiper = new Swiper(content.querySelector('.swiper'), {
            slidesPerView: 1,
            spaceBetween: 20,
            loop: false,
            pagination: {
                el: content.querySelector('.Carousel__BulletContainer'),
                clickable: true,
                bulletClass: 'swiper-pagination-bullet',
                bulletActiveClass: 'swiper-pagination-bullet-active',
            },
            navigation: {
                nextEl: content.querySelector('.Carousel__NavigationNext'),
                prevEl: content.querySelector('.Carousel__NavigationPrevious'),
            },
            breakpoints: {
                768: {
                    slidesPerView: 2,
                },
                1024: {
                    slidesPerView: 3,
                }
            }
        });
        
        this.scrollToBottom();
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
        
        // Simulate bot response (you can customize this)
        setTimeout(() => {
            this.addBotMessage(`Great choice! Here's more information about ${title}: ${description}<br>Is there anything I can help you with ?`);
        }, 500);
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
            
            console.log('Charts created successfully');
        } catch (error) {
            console.error('Error creating charts:', error);
        }
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
}

// Initialize the chatbot when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new Chatbot();
}); 