# 🤖 IBM Watson Assistant Chatbot

A modern, responsive chatbot application powered by IBM Watsonx Assistant v5, featuring a beautiful UI with real-time messaging, file uploads, analytics dashboard, and medical APIs.

## ✨ Features

- **🔐 Secure Login System** - Username/password authentication
- **💬 Real-time Chat** - Powered by IBM Watsonx Assistant v5
- **📊 Analytics Dashboard** - Interactive charts and KPIs
- **📎 File Uploads** - Support for images, PDFs, and documents
- **🏥 Medical APIs** - Integrated medicine and doctor databases
- **📱 Responsive Design** - Works on desktop, tablet, and mobile
- **🎨 Modern UI** - Beautiful gradient backgrounds and animations
- **⚡ Typing Indicators** - Real-time typing animations
- **🔔 Broadcast Messages** - System announcements and updates

## 🚀 Live Demo

[Your deployed URL will go here]

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **AI**: IBM Watsonx Assistant v5
- **Charts**: Chart.js
- **Icons**: Font Awesome
- **File Upload**: Multer
- **Styling**: Custom CSS with gradients and animations

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- IBM Watson Assistant account
- Git

## 🔧 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/watson-chatbot.git
cd watson-chatbot
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```env
WATSON_API_KEY=your_watson_api_key
WATSON_ASSISTANT_ID=your_assistant_id
WATSON_INSTANCE_ID=your_instance_id
WATSON_SERVICE_URL=https://api.au-syd.assistant.watson.cloud.ibm.com
PORT=3000
```

### 4. Start the Application
```bash
npm start
```

The application will be available at `http://localhost:3000`

## 🔑 Login Credentials

- **Username**: `manas123`
- **Password**: `Admin@123`

## 📚 API Endpoints

### Chatbot APIs
- `POST /api/session` - Create Watson session
- `POST /api/message` - Send message to Watson
- `DELETE /api/session/:sessionId` - Delete session

### Medicine APIs
- `GET /api/medicines` - Get all medicines
- `GET /api/medicines/:id` - Get medicine by ID
- `POST /api/medicines/search` - Search medicines
- `GET /api/medicines/recommend/:condition` - Get recommendations

### Doctor APIs
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/:id` - Get doctor by ID
- `POST /api/doctors/search` - Search doctors
- `GET /api/doctors/type/:type` - Get doctors by specialty
- `GET /api/doctors/available/:status` - Get available/unavailable doctors
- `GET /api/doctors/recommend/:specialty` - Get recommendations

## 🌐 Deployment

### Deploy to Render (Free)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with your GitHub account

3. **Deploy from GitHub**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `watson-chatbot`
     - **Environment**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`

4. **Add Environment Variables**
   - Go to your service → Environment
   - Add all variables from your `.env` file

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (2-3 minutes)

### Alternative: Deploy to Railway

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Deploy**
   ```bash
   railway login
   railway init
   railway up
   ```

## 📁 Project Structure

```
watson-chatbot/
├── public/
│   ├── index.html          # Main application
│   ├── script.js           # Frontend JavaScript
│   ├── styles.css          # Styling
│   └── test_*.html         # API test pages
├── server.js               # Express server
├── config.js               # Configuration
├── package.json            # Dependencies
├── Procfile               # Deployment configuration
├── .gitignore             # Git ignore rules
└── README.md              # This file
```

## 🔧 Configuration

### Watson Assistant Setup

1. **Create IBM Cloud Account**
   - Go to [cloud.ibm.com](https://cloud.ibm.com)
   - Sign up for free account

2. **Create Watson Assistant**
   - Go to Catalog → AI → Watson Assistant
   - Create new instance

3. **Get Credentials**
   - Copy API Key, Assistant ID, and Instance ID
   - Update your `.env` file

### Customization

- **Login Credentials**: Edit `script.js` line 3-6
- **UI Colors**: Modify CSS variables in `styles.css`
- **API Data**: Update medicine and doctor data in `server.js`

## 🧪 Testing

### Test APIs Locally
- Medicine API: `http://localhost:3000/test_medicine_api.html`
- Doctor API: `http://localhost:3000/test_doctors_api.html`

### Test Chatbot
1. Login with credentials
2. Send test messages
3. Try file uploads
4. Check dashboard functionality

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Kill existing process
   npx kill-port 3000
   # Or change port in .env
   PORT=3001
   ```

2. **Watson Authentication Error**
   - Check API key and credentials
   - Verify Assistant ID and Instance ID
   - Ensure Watson service is active

3. **Charts Not Loading**
   - Check browser console for errors
   - Verify Chart.js CDN is accessible
   - Clear browser cache

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section
2. Review browser console for errors
3. Verify all environment variables are set
4. Create an issue on GitHub

## 🙏 Acknowledgments

- IBM Watson for AI capabilities
- Chart.js for beautiful charts
- Font Awesome for icons
- Express.js community

---

**Made with ❤️ using IBM Watson Assistant** 