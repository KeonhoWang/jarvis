# 🤖 J.A.R.V.I.S — Personal AI Assistant

> **Just A Rather Very Intelligent System.**  
> Your personal AI assistant inspired by Iron Man's JARVIS, built with Python, Flask, JavaScript, and AI.

J.A.R.V.I.S is a personal AI assistant that combines AI-powered conversations with everyday productivity tools in a futuristic, Iron Man-inspired dashboard. It can answer questions, remember important information, manage tasks and notes, retrieve weather information, monitor system resources, and provide usage analytics — all through a single web interface.

## ✨ Features

### 🧠 AI-Powered Conversations
- AI-generated responses powered by the Groq API.
- Context-aware conversations with recent chat history.
- Personalized assistant personality inspired by JARVIS from Iron Man.
- Automatic language detection for English and Korean responses, with support for Thai and German in the assistant's instructions.
- Voice input and spoken responses using browser speech APIs.

### 💾 Persistent Memory
- Save important information for future conversations.
- Recall stored facts.
- Save, view, and delete notes.
- Store tasks and reminders in local JSON files.
- Retain saved information between application restarts.

### ✅ Productivity Management
- Add, view, and complete tasks.
- Create and organize notes.
- Add and review reminders.
- Use natural-language commands to access assistant features.

### 🌤️ Weather Dashboard
- Retrieve current weather conditions using OpenWeatherMap.
- Display temperature, feels-like temperature, humidity, and conditions.
- Check weather in Seoul, London, New York, Tokyo, and Bangkok.

### 💻 System Monitoring
- Monitor CPU usage.
- Track RAM utilization.
- View disk usage.
- Display battery percentage and charging status when available.
- View system time and date.

### 📊 Usage Analytics
- Track total messages and daily usage.
- Record detected message languages.
- Categorize commands, such as chat, weather, tasks, memory, and search.
- Review usage statistics through the analytics dashboard.

### 🎨 Futuristic User Interface
- Iron Man-inspired heads-up display (HUD).
- Animated Arc Reactor-style centerpiece.
- Animated particles and connected background elements.
- Dark and light themes.
- Dedicated Chat, Notes, News, and Analytics tabs.
- Built-in music player with local audio uploads, playback controls, and volume adjustment.
- Web search shortcuts that open Google search results.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Python | Backend logic and API integration |
| Flask | Web server and REST endpoints |
| Flask-CORS | Cross-origin request support |
| HTML5 | Dashboard structure |
| CSS3 | Styling, animations, and responsive interface |
| JavaScript | Interactive UI and client-side functionality |
| Groq API | AI-powered conversations |
| Qwen model via Groq | Language generation |
| OpenWeatherMap API | Current weather data |
| psutil | System resource monitoring |
| Speech Recognition API | Voice input in supported browsers |
| Web Speech API | Text-to-speech responses |
| JSON | Local storage for memory and analytics |
| python-dotenv | Environment variable management |
| Requests | HTTP API communication |

## 📁 Project Structure

```text
JARVIS-AI/
├── app.py                  # Flask backend and API routes
├── index.html              # Main dashboard interface
├── style.css               # UI styling and animations
├── script.js               # Frontend interactions
├── jarvis_memory.json      # Persistent memory and productivity data
├── jarvis_analytics.json   # Usage analytics
├── .env                    # API keys (not committed)
├── .gitignore              # Files excluded from Git
├── requirements.txt        # Python dependencies
└── README.md               # Project documentation
```

**Note:** Keep the filenames consistent with the paths used in the Flask application. The uploaded source files may currently have different filenames.

## 🚀 Getting Started

### 1. Prerequisites

Make sure you have installed:

- Python 3.10 or newer
- pip
- Git
- A modern web browser
- A Groq API key
- An OpenWeatherMap API key (optional, required for weather data)

### 2. Clone the Repository

```bash
git clone https://github.com/KeonhoWang/JARVIS-AI.git
cd JARVIS-AI
```

Replace the repository URL with your actual GitHub repository URL if the project is hosted elsewhere.

### 3. Create a Virtual Environment

**macOS / Linux**

```bash
python3 -m venv .venv
source .venv/bin/activate
```

**Windows**

```bash
python -m venv .venv
.venv\Scripts\activate
```

### 4. Install Dependencies

```bash
pip install Flask Flask-Cors python-dotenv requests psutil
```

Alternatively, create a `requirements.txt` file containing:

```text
Flask
Flask-Cors
python-dotenv
requests
psutil
```

Then install everything with:

```bash
pip install -r requirements.txt
```

### 5. Configure Environment Variables

Create a `.env` file in the project root:

```env
GROQ_API_KEY=your_groq_api_key
WEATHER_API_KEY=your_openweathermap_api_key
```

Obtain your keys from:

- [Groq Console](https://console.groq.com/)
- [OpenWeatherMap](https://openweathermap.org/api)

The weather API key is optional, but weather functionality will not return live data without it.

**Security:** Never commit your `.env` file or expose your API keys in your source code.

### 6. Run the Application

```bash
python app.py
```

The Flask application defaults to port `5001`.

Open your browser and visit:

**http://127.0.0.1:5001**

Keep the terminal running while using the application.

## 💬 Example Commands

Interact with JARVIS using the chat interface.

| Command | Action |
|---|---|
| `What time is it?` | Display the current time and date |
| `Remember that my goal is to become a developer` | Store a fact in memory |
| `What do you remember?` | Retrieve stored facts |
| `Add todo: Finish my project` | Add a task |
| `Show my todos` | View pending tasks |
| `Complete task Finish my project` | Mark a matching task as complete |
| `Add note: Project ideas for next week` | Save a note |
| `Show notes` | Display saved notes |
| `Delete note Project ideas` | Delete notes matching a keyword |
| `Remind me to review my code` | Save a reminder |
| `Show reminders` | View active reminders |
| `Search for Python tutorials` | Open a Google search |
| `Analytics` | Review usage statistics |
| `Clear` | Clear the current conversation |
| `Clear memory` | Clear stored facts and conversation history |

Commands are matched using keywords, so exact wording may affect which feature is triggered.

## 🔌 API Endpoints

The Flask backend exposes the following endpoints:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Serve the main dashboard |
| `GET` | `/system` | Retrieve system resource statistics |
| `POST` | `/chat` | Process assistant messages |
| `POST` | `/weather` | Retrieve weather for a city |
| `GET` | `/news` | Return the configured technology news list |
| `GET` | `/analytics` | Retrieve usage analytics |
| `GET` | `/notes` | Retrieve saved notes |
| `GET` | `/todos` | Retrieve tasks |
| `GET` | `/reminders` | Retrieve reminders |
| `GET` | `/history` | Retrieve in-memory conversation history |
| `POST` | `/clear` | Clear conversation history |

Example request to the chat endpoint:

```javascript
fetch("/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    message: "What time is it?"
  })
})
  .then(response => response.json())
  .then(data => console.log(data.response));
```

## 🔐 Privacy and Data Storage

J.A.R.V.I.S uses local JSON files for persistent memory, tasks, notes, reminders, and analytics. Conversation history is maintained in the running Flask process.

AI messages are sent to the configured Groq API, and weather requests are sent to OpenWeatherMap when that functionality is used. Review the respective providers' privacy policies before entering sensitive information.

For production deployment, additional safeguards are recommended, including authentication, input validation, secure error handling, and restricted access to system-monitoring endpoints.

## ⚠️ Current Limitations

- **Internet connection:** AI and live weather features require external API access.
- **API configuration:** AI responses require a valid Groq API key.
- **Voice support:** Browser speech recognition availability varies; Chrome is recommended by the interface.
- **Weather:** Current conditions require a valid OpenWeatherMap API key.
- **News:** The current backend returns a predefined list of technology-news links rather than fetching live headlines.
- **Web search:** Search commands open Google results; the backend does not independently retrieve or summarize search results.
- **Reminders:** Reminders are stored and displayed, but a background scheduler or operating-system notification service is not implemented in the provided backend.
- **Local storage:** JSON files are suitable for a personal prototype, but a database would be more appropriate for concurrent users or larger datasets.
- **Conversation history:** Chat history is held in memory and does not persist across server restarts.

## 🔮 Future Improvements

- [ ] Add real-time news retrieval from a news API.
- [ ] Implement scheduled reminders and notifications.
- [ ] Introduce a database such as SQLite or PostgreSQL.
- [ ] Add authentication and user profiles.
- [ ] Improve multilingual voice input and voice selection.
- [ ] Add streaming AI responses.
- [ ] Implement automated tests for API endpoints.
- [ ] Add Docker support and deployment documentation.
- [ ] Improve mobile responsiveness and accessibility.
- [ ] Add configurable AI models and assistant personalities.

## 🎯 Project Goals

This project explores how AI, backend development, APIs, browser technologies, and system monitoring can work together in a unified personal assistant.

It was built as a hands-on software engineering project to practice full-stack development, API integration, persistent data handling, and interactive UI design.

## 👨‍💻 Author

**Keonho Wang**

Software Engineering Student · Full-Stack Developer · AI/ML Enthusiast

- GitHub: [@KeonhoWang](https://github.com/KeonhoWang)
- Portfolio: [keonho-portfolio.netlify.app](https://keonho-portfolio.netlify.app/)

## 📄 License

No license has been specified yet. Add a `LICENSE` file before distributing the project if you want others to use, modify, or redistribute it under defined terms.

---

*“At your service, sir.”* 🤖
