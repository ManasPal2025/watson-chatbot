#!/bin/bash

echo "🚀 Starting deployment process..."

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Prerequisites check passed!"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating template..."
    cat > .env << EOF
WATSON_API_KEY=your_watson_api_key_here
WATSON_ASSISTANT_ID=your_assistant_id_here
WATSON_INSTANCE_ID=your_instance_id_here
WATSON_SERVICE_URL=https://api.au-syd.assistant.watson.cloud.ibm.com
PORT=3000
EOF
    echo "📝 Please edit .env file with your actual Watson credentials"
fi

# Initialize git if not already done
if [ ! -d .git ]; then
    echo "🔧 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit"
    echo "✅ Git repository initialized!"
else
    echo "✅ Git repository already exists"
fi

echo ""
echo "🎉 Setup complete! Next steps:"
echo ""
echo "1. 📝 Edit .env file with your Watson credentials"
echo "2. 🔗 Create a GitHub repository"
echo "3. 📤 Push to GitHub:"
echo "   git remote add origin https://github.com/yourusername/your-repo-name.git"
echo "   git push -u origin main"
echo ""
echo "4. 🌐 Deploy to Render:"
echo "   - Go to render.com"
echo "   - Connect your GitHub repo"
echo "   - Add environment variables"
echo "   - Deploy!"
echo ""
echo "📚 For detailed instructions, see README.md" 