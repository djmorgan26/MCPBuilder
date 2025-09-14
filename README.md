# MCP GUI Builder

A visual, no-code tool for building Model Context Protocol (MCP) servers using FastMCP. Create production-ready MCP servers through an intuitive drag-and-drop interface without writing any code.

![MCP GUI Builder](https://img.shields.io/badge/Version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-3178C6.svg)
![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)

## 🚀 Quick Start

### Prerequisites

Make sure you have the following installed on your system:

- **Node.js** (version 18 or higher)
- **npm** (comes with Node.js)
- **Git** (optional, for cloning)

You can check your versions with:
```bash
node --version
npm --version
```

### Installation & Setup

1. **Clone or download this repository:**
   ```bash
   git clone <repository-url>
   cd mcp-gui-builder
   ```

2. **Install all dependencies:**
   ```bash
   npm run install:all
   ```
   This command installs dependencies for the root project, frontend, and backend.

3. **Start the development servers:**
   ```bash
   npm run dev
   ```
   This starts both the frontend (http://localhost:5173) and backend (http://localhost:3001) servers concurrently.

4. **Open your browser:**
   Navigate to [http://localhost:5173](http://localhost:5173) to access the MCP GUI Builder interface.

That's it! The application should now be running.

## 📖 How to Use

### Step 1: Configure Your Server
1. Fill in the **Server Configuration** panel on the left:
   - **Server Name**: Must be lowercase with hyphens (e.g., "my-mcp-server")
   - **Description**: Brief description of your server's purpose
   - **Author**: Your name or organization
   - **Version**: Semantic version (e.g., "1.0.0")
   - **Python Version**: Choose your target Python version

### Step 2: Add Tools
1. Browse **Tool Templates** in the left sidebar
2. Click on any tool template to add it (e.g., "File Reader", "API Caller")
3. Configure the tool in the modal that opens:
   - Set tool name and description
   - Add parameters with types and descriptions
   - Configure return type and options
4. Click **Save Tool** to add it to your server

### Step 3: Add Environment Variables (Optional)
1. In the **Server Configuration** panel, click **Add Variable**
2. Configure environment variables for API keys, database URLs, etc.
3. Mark variables as **Required** or **Secret** as needed

### Step 4: Generate Code
1. Click the **Preview Code** button in the header
2. Switch to the **Code** tab to see generated files:
   - `main.py` - Your MCP server code
   - `requirements.txt` - Python dependencies
   - `Dockerfile` - Container configuration
   - `docker-compose.yml` - Multi-service setup
   - `README.md` - Generated documentation
   - `.env.example` - Environment variable template
   - `test_server.py` - Basic tests

### Step 5: Download & Deploy
1. Click **Download** to get individual files
2. Click **Download All** to get a complete ZIP package
3. Switch to the **Deploy** tab for deployment instructions

## 🛠️ Available Tool Templates

The GUI builder includes these pre-configured tool templates:

- **📁 File Reader**: Read CSV, JSON, PDF, Word, Excel files
- **🌐 API Caller**: Make HTTP requests with authentication
- **🔢 Calculator**: Mathematical operations and scientific computing
- **🗄️ Database Query**: SQL and NoSQL database integration
- **🕷️ Web Scraper**: Extract data from websites
- **📧 Email Sender**: Send emails via SMTP
- **🖼️ Image Processor**: Process and analyze images
- **🧠 Text Analyzer**: NLP and text analysis tools

## 🏗️ Project Structure

```
mcp-gui-builder/
├── frontend/              # React TypeScript frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── utils/        # Utility functions
│   │   ├── types/        # TypeScript definitions
│   │   └── App.tsx       # Main application
├── backend/              # Express.js API server
│   ├── src/
│   │   └── index.ts      # API server
├── tests/                # Playwright tests
├── package.json          # Root package configuration
└── README.md            # This file
```

## 🖥️ Development Scripts

### Root Level Commands
```bash
npm run dev              # Start both frontend and backend
npm run build           # Build both frontend and backend
npm run dev:frontend    # Start only frontend (port 5173)
npm run dev:backend     # Start only backend (port 3001)
npm run test:e2e        # Run Playwright tests
```

### Frontend Commands
```bash
cd frontend
npm run dev             # Start development server
npm run build           # Build for production
npm run preview         # Preview production build
```

### Backend Commands
```bash
cd backend
npm run dev             # Start development server with hot reload
npm run build           # Compile TypeScript
npm run start           # Start production server
```

## 🧪 Testing

The project includes comprehensive Playwright tests for both functionality and visual regression:

```bash
# Run all tests
npm run test:e2e

# Run tests in headed mode (see the browser)
npx playwright test --headed

# Run specific test file
npx playwright test tests/app.spec.ts

# Generate test report
npx playwright show-report
```

## 🚢 Deployment

### Generated Server Deployment

After generating your MCP server code:

1. **Local Development:**
   ```bash
   pip install -r requirements.txt
   python main.py
   ```

2. **Docker:**
   ```bash
   docker build -t your-server-name .
   docker run -p 8000:8000 your-server-name
   ```

3. **Docker Compose:**
   ```bash
   docker-compose up -d
   ```

4. **Cloud Platforms:**
   - **Railway:** `railway up`
   - **Render:** Connect your Git repository
   - **Heroku:** `git push heroku main`

### GUI Builder Deployment

To deploy the MCP GUI Builder itself:

1. **Build for production:**
   ```bash
   npm run build
   ```

2. **Deploy frontend** (static files in `frontend/dist/`)
3. **Deploy backend** (Node.js app from `backend/dist/`)

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory for configuration:

```env
# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Backend port
PORT=3001

# Node environment
NODE_ENV=development
```

### Customization

- **Add new tool templates**: Edit `frontend/src/components/ToolTemplates.tsx`
- **Modify code generation**: Edit `frontend/src/utils/codeGenerator.ts`
- **Add new components**: Create files in `frontend/src/components/`

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   # Kill processes on ports 3001 and 5173
   lsof -ti:3001 | xargs kill
   lsof -ti:5173 | xargs kill
   ```

2. **Dependencies not installing:**
   ```bash
   # Clear npm cache and reinstall
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **TypeScript errors:**
   ```bash
   # Rebuild TypeScript
   cd frontend && npm run build
   cd ../backend && npm run build
   ```

4. **TailwindCSS errors (fixed in v1.0.0):**
   The project now uses TailwindCSS v3 for maximum compatibility. If you encounter CSS issues:
   ```bash
   # Ensure PostCSS is properly configured
   cd frontend
   npm install -D tailwindcss@^3.4.0 postcss autoprefixer
   ```

5. **Tests failing:**
   ```bash
   # Install Playwright browsers
   npx playwright install
   ```

### Getting Help

If you encounter issues:

1. Check the browser console for errors
2. Check the terminal output for server errors
3. Ensure all dependencies are properly installed
4. Verify Node.js version compatibility

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- Built with [FastMCP](https://github.com/jlowin/fastmcp)
- Powered by [React](https://react.dev/) and [TypeScript](https://www.typescriptlang.org/)
- UI components from [Lucide React](https://lucide.dev/)
- Code editor by [Monaco Editor](https://microsoft.github.io/monaco-editor/)

---

**Happy MCP Server Building! 🎉**