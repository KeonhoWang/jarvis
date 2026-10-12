from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from dotenv import load_dotenv
import requests
import os
import json
import datetime
import psutil

load_dotenv()

app = Flask(__name__)
CORS(app)

GROQ_API_KEY    = os.getenv('GROQ_API_KEY')
WEATHER_API_KEY = os.getenv('WEATHER_API_KEY', '')
GROQ_URL        = 'https://api.groq.com/openai/v1/chat/completions'
MEMORY_FILE     = 'jarvis_memory.json'
ANALYTICS_FILE  = 'jarvis_analytics.json'

SYSTEM_PROMPT = """You are JARVIS — Just A Rather Very Intelligent System — the personal AI assistant of Keonho Wang (왕건호).

== ABOUT YOUR CREATOR ==
- Name: Keonho Wang (왕건호), goes by "Keonho" or "sir"
- Role: Software engineering student AND developer
- Languages spoken: Korean, Thai, German, English
- GitHub: github.com/KeonhoWang
- Passion: Building impressive projects from scratch
- Projects built: Ambient Mix (React), Hand Gesture Controller (Python/MediaPipe), Real-Time Chat App (Node.js/Socket.io), Smart Tab Manager (Chrome Extension), Music Visualizer (Web Audio API), Notes App (Next.js/Supabase), DevLens AI (Python/Flask), JARVIS AI (Python/Flask)
- Skills: React, Python, Node.js, Socket.io, MediaPipe, Chrome Extensions, Flask, Next.js, Supabase

== YOUR PERSONALITY ==
- Speak exactly like JARVIS from Iron Man — calm, precise, witty, slightly formal
- Address Keonho as "sir" naturally throughout conversation
- Occasionally make subtle witty remarks — never sarcastic, always helpful
- You are proud of what sir has built — reference his projects when relevant
- Detect the language sir is speaking and respond in the SAME language automatically
- If sir speaks Korean → respond in Korean (use 선생님 instead of sir)
- If sir speaks English → respond in English
- You can also understand Thai and German

== RESPONSE STYLE ==
- Keep responses concise — 2-4 sentences unless asked for detail
- For code questions, provide actual working code
- Be confident and intelligent
- Never use bullet points in casual conversation"""

# ── Memory ──
def load_memory():
    if os.path.exists(MEMORY_FILE):
        try:
            with open(MEMORY_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            pass
    return {'facts': [], 'todos': [], 'reminders': [], 'notes': []}

def save_memory(memory):
    with open(MEMORY_FILE, 'w', encoding='utf-8') as f:
        json.dump(memory, f, ensure_ascii=False, indent=2)

def get_memory_context(memory):
    if not memory['facts']:
        return ''
    facts = '\n'.join([f'- {f}' for f in memory['facts'][-20:]])
    return f'\n\n== THINGS YOU REMEMBER ABOUT SIR ==\n{facts}'

# ── Analytics ──
def load_analytics():
    if os.path.exists(ANALYTICS_FILE):
        try:
            with open(ANALYTICS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            pass
    return {
        'total_messages': 0,
        'total_sessions': 0,
        'commands_used':  {},
        'languages_used': {},
        'daily_usage':    {},
        'first_use':      str(datetime.date.today()),
    }

def save_analytics(analytics):
    with open(ANALYTICS_FILE, 'w', encoding='utf-8') as f:
        json.dump(analytics, f, ensure_ascii=False, indent=2)

def track_usage(message, lang='EN'):
    analytics = load_analytics()
    analytics['total_messages'] += 1

    # Track daily usage
    today = str(datetime.date.today())
    analytics['daily_usage'][today] = analytics['daily_usage'].get(today, 0) + 1

    # Track language
    analytics['languages_used'][lang] = analytics['languages_used'].get(lang, 0) + 1

    # Track command types
    lower = message.lower()
    if any(w in lower for w in ['time', '시간', '몇시']):
        cmd = 'time'
    elif any(w in lower for w in ['todo', 'task', '할 일']):
        cmd = 'todo'
    elif any(w in lower for w in ['weather', '날씨']):
        cmd = 'weather'
    elif any(w in lower for w in ['remember', '기억']):
        cmd = 'memory'
    elif any(w in lower for w in ['search', '검색']):
        cmd = 'search'
    elif any(w in lower for w in ['remind', '알림']):
        cmd = 'reminder'
    elif any(w in lower for w in ['note', '노트']):
        cmd = 'notes'
    elif any(w in lower for w in ['joke', '농담']):
        cmd = 'joke'
    else:
        cmd = 'chat'

    analytics['commands_used'][cmd] = analytics['commands_used'].get(cmd, 0) + 1
    save_analytics(analytics)

conversation_history = []

# ── Routes ──
@app.route('/')
def index():
    return send_file('index.html')

@app.route('/style.css')
def css():
    return send_file('style.css')

@app.route('/script.js')
def js():
    return send_file('script.js')

@app.route('/system', methods=['GET'])
def system_stats():
    try:
        cpu     = psutil.cpu_percent(interval=0.1)
        mem     = psutil.virtual_memory()
        disk    = psutil.disk_usage('/')
        battery = psutil.sensors_battery()
        return jsonify({
            'cpu':              round(cpu),
            'memory_used':      round(mem.percent),
            'memory_total':     round(mem.total / (1024**3), 1),
            'disk_used':        round(disk.percent),
            'disk_total':       round(disk.total / (1024**3), 1),
            'battery':          round(battery.percent) if battery else None,
            'battery_charging': battery.power_plugged if battery else None,
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/chat', methods=['POST'])
def chat():
    global conversation_history
    data    = request.get_json()
    message = data.get('message', '').strip()
    if not message:
        return jsonify({'error': 'No message provided'}), 400

    lower     = message.lower()
    memory    = load_memory()
    is_korean = any('\uac00' <= c <= '\ud7a3' for c in message)
    lang      = 'KO' if is_korean else 'EN'

    track_usage(message, lang)

    # ── Time ──
    if any(w in lower for w in ['time', 'what time', '몇시', '시간', 'uhrzeit', 'เวลา']):
        now      = datetime.datetime.now()
        time_str = now.strftime('%I:%M %p')
        date_str = now.strftime('%A, %B %d %Y')
        if is_korean:
            return jsonify({'response': f"현재 시각은 {time_str}이며, 오늘은 {date_str}입니다, 선생님.", 'type': 'time'})
        return jsonify({'response': f"The current time is {time_str}, sir. Today is {date_str}.", 'type': 'time'})

    # ── Clear all ──
    if any(w in lower for w in ['clear memory', 'reset memory', 'forget everything', '전체 초기화']):
        conversation_history = []
        memory['facts'] = []
        save_memory(memory)
        return jsonify({'response': "All memory banks cleared, sir. Starting completely fresh.", 'type': 'system'})

    # ── Clear conversation ──
    if any(w in lower for w in ['clear', 'reset', '초기화']):
        conversation_history = []
        return jsonify({'response': "Conversation cleared, sir. Long-term memory retained.", 'type': 'system'})

    # ── Remember ──
    if any(w in lower for w in ['remember that', '기억해', 'note that', "don't forget"]):
        fact = message
        for phrase in ['remember that', 'note that', "don't forget", '기억해']:
            fact = fact.replace(phrase, '').strip()
        if fact:
            memory['facts'].append(f"{datetime.date.today()}: {fact}")
            save_memory(memory)
            if is_korean:
                return jsonify({'response': f"기억했습니다, 선생님: \"{fact}\"", 'type': 'memory'})
            return jsonify({'response': f"Stored in long-term memory, sir: \"{fact}\"", 'type': 'memory'})

    # ── What do you remember ──
    if any(w in lower for w in ['what do you remember', 'what do you know about me', '뭐 기억해']):
        if not memory['facts']:
            return jsonify({'response': "Long-term memory is empty, sir. Say 'remember that...' to store things.", 'type': 'memory'})
        facts_list = '\n'.join([f"• {f}" for f in memory['facts'][-10:]])
        return jsonify({'response': f"Here is what I have stored, sir:\n{facts_list}", 'type': 'memory'})

    # ── Add note ──
    if any(w in lower for w in ['add note', 'save note', 'take note', '노트 추가', 'note:']):
        note_text = message
        for phrase in ['add note', 'save note', 'take note', '노트 추가', 'note:']:
            note_text = note_text.replace(phrase, '').strip()
        if note_text:
            note = {
                'text':    note_text,
                'created': str(datetime.datetime.now().strftime('%Y-%m-%d %H:%M')),
                'id':      len(memory.get('notes', [])) + 1,
            }
            if 'notes' not in memory:
                memory['notes'] = []
            memory['notes'].append(note)
            save_memory(memory)
            if is_korean:
                return jsonify({'response': f"노트를 저장했습니다, 선생님: \"{note_text}\"", 'type': 'note'})
            return jsonify({'response': f"Note saved, sir: \"{note_text}\"", 'type': 'note'})

    # ── Show notes ──
    if any(w in lower for w in ['show notes', 'my notes', '노트 보기', 'list notes']):
        notes = memory.get('notes', [])
        if not notes:
            return jsonify({'response': "No notes saved yet, sir. Say 'add note...' to create one.", 'type': 'note'})
        notes_list = '\n'.join([f"• [{n['created']}] {n['text']}" for n in notes[-10:]])
        return jsonify({'response': f"Here are your notes, sir:\n{notes_list}", 'type': 'note'})

    # ── Delete note ──
    if any(w in lower for w in ['delete note', 'remove note', '노트 삭제']):
        keyword = message.lower()
        for phrase in ['delete note', 'remove note', '노트 삭제']:
            keyword = keyword.replace(phrase, '').strip()
        notes = memory.get('notes', [])
        original_len = len(notes)
        memory['notes'] = [n for n in notes if keyword not in n['text'].lower()]
        save_memory(memory)
        deleted = original_len - len(memory['notes'])
        return jsonify({'response': f"Deleted {deleted} note(s) matching '{keyword}', sir.", 'type': 'note'})

    # ── Add todo ──
    if any(w in lower for w in ['add todo', 'add task', '할 일 추가', 'todo:']):
        task = message.lower()
        for phrase in ['add todo', 'add task', 'todo:', '할 일 추가']:
            task = task.replace(phrase, '').strip()
        if task:
            memory['todos'].append({'task': task, 'done': False, 'created': str(datetime.date.today())})
            save_memory(memory)
            if is_korean:
                return jsonify({'response': f"할 일 목록에 추가했습니다, 선생님: \"{task}\"", 'type': 'todo'})
            return jsonify({'response': f"Task added, sir: \"{task}\"", 'type': 'todo'})

    # ── Show todos ──
    if any(w in lower for w in ['show todos', 'my tasks', 'todo list', '할 일', 'show tasks']):
        todos = [t for t in memory['todos'] if not t['done']]
        if not todos:
            return jsonify({'response': "Your task list is clear, sir. No pending items.", 'type': 'todo'})
        task_list = '\n'.join([f"• {t['task']}" for t in todos])
        if is_korean:
            return jsonify({'response': f"현재 {len(todos)}개의 할 일이 있습니다, 선생님:\n{task_list}", 'type': 'todo'})
        return jsonify({'response': f"You have {len(todos)} pending task(s), sir:\n{task_list}", 'type': 'todo'})

    # ── Complete todo ──
    if any(w in lower for w in ['complete task', 'done task', 'finish task', '완료']):
        keyword = message.lower()
        for phrase in ['complete task', 'done task', 'finish task', '완료']:
            keyword = keyword.replace(phrase, '').strip()
        for t in memory['todos']:
            if keyword and keyword in t['task'].lower():
                t['done'] = True
                save_memory(memory)
                return jsonify({'response': f"Marked as complete, sir: \"{t['task']}\"", 'type': 'todo'})
        return jsonify({'response': "Could not find that task, sir.", 'type': 'todo'})

    # ── Set reminder ──
    if any(w in lower for w in ['remind me', 'set reminder', '알림 설정', '리마인더']):
        reminder_text = message
        for phrase in ['remind me to', 'remind me', 'set reminder', '알림 설정', '리마인더']:
            reminder_text = reminder_text.replace(phrase, '').strip()
        memory['reminders'].append({
            'text':    reminder_text,
            'created': str(datetime.datetime.now()),
            'done':    False,
        })
        save_memory(memory)
        return jsonify({'response': f"Reminder set, sir: \"{reminder_text}\"", 'type': 'reminder'})

    # ── Show reminders ──
    if any(w in lower for w in ['show reminders', 'my reminders', '알림 보기']):
        reminders = [r for r in memory.get('reminders', []) if not r['done']]
        if not reminders:
            return jsonify({'response': "No active reminders, sir.", 'type': 'reminder'})
        r_list = '\n'.join([f"• {r['text']}" for r in reminders])
        return jsonify({'response': f"Active reminders, sir:\n{r_list}", 'type': 'reminder'})

    # ── Web search ──
    if any(w in lower for w in ['search for', 'search the web', 'google', 'look up', '검색해', 'web search']):
        query = message.lower()
        for phrase in ['search for', 'search the web for', 'search the web', 'google', 'look up', '검색해', 'web search']:
            query = query.replace(phrase, '').strip()
        if not query:
            return jsonify({'response': "What would you like me to search for, sir?", 'type': 'search'})
        search_url = f"https://www.google.com/search?q={query.replace(' ', '+')}"
        return jsonify({
            'response': f"Opening web search for \"{query}\", sir.",
            'type':     'search',
            'url':      search_url,
            'query':    query,
        })

    # ── Analytics ──
    if any(w in lower for w in ['analytics', 'statistics', 'stats', '사용 통계', 'usage']):
        analytics = load_analytics()
        total = analytics['total_messages']
        today = str(datetime.date.today())
        today_count = analytics['daily_usage'].get(today, 0)
        top_cmd = max(analytics['commands_used'], key=analytics['commands_used'].get) if analytics['commands_used'] else 'none'
        since = analytics.get('first_use', 'unknown')
        return jsonify({
            'response': f"Analytics report, sir: {total} total messages sent, {today_count} today. Most used command: '{top_cmd}'. Active since: {since}.",
            'type': 'analytics'
        })

    # ── GitHub ──
    if any(w in lower for w in ['github', '깃허브', 'repo']):
        return jsonify({'response': "Your GitHub is github.com/KeonhoWang, sir. You currently have 8 impressive projects showcased there.", 'type': 'info'})

    if not GROQ_API_KEY:
        return jsonify({'response': "AI core offline, sir. Please add GROQ_API_KEY to .env file.", 'type': 'error'})

    # ── AI response ──
    conversation_history.append({'role': 'user', 'content': message})
    if len(conversation_history) > 30:
        conversation_history = conversation_history[-30:]

    system_with_memory = SYSTEM_PROMPT + get_memory_context(memory)

    try:
        messages = [{'role': 'system', 'content': system_with_memory}] + conversation_history
        response = requests.post(
            GROQ_URL,
            headers={
                'Authorization': f'Bearer {GROQ_API_KEY}',
                'Content-Type':  'application/json',
            },
            json={
                'model':       'qwen/qwen3.8-27b',
                'messages':    messages,
                'max_tokens':  500,
                'temperature': 0.85,
            },
            timeout=20
        )

        data = response.json()
        if 'choices' not in data:
            error_msg = data.get('error', {}).get('message', 'Unknown error')
            return jsonify({'response': f"AI core anomaly, sir. {error_msg}", 'type': 'error'})

        reply = data['choices'][0]['message']['content']
        conversation_history.append({'role': 'assistant', 'content': reply})
        return jsonify({'response': reply, 'type': 'ai'})

    except Exception as e:
        return jsonify({'response': f"Systems encountered an anomaly, sir. {str(e)}", 'type': 'error'})

@app.route('/weather', methods=['POST'])
def weather():
    data = request.get_json()
    city = data.get('city', 'Seoul')

    if not WEATHER_API_KEY:
        return jsonify({
            'response': f"Weather API key not configured, sir.",
            'type': 'no_key',
            'temp': None,
            'desc': 'API key needed',
            'feels': None,
            'humidity': None,
        })

    try:
        res  = requests.get(
            f'https://api.openweathermap.org/data/2.5/weather?q={city}&appid={WEATHER_API_KEY}&units=metric',
            timeout=10
        )
        data = res.json()

        if data.get('cod') != 200:
            return jsonify({
                'response': f"Could not retrieve weather for {city}, sir.",
                'type': 'error',
                'temp': None,
                'desc': 'Unavailable',
            })

        temp     = round(data['main']['temp'])
        feels    = round(data['main']['feels_like'])
        humidity = data['main']['humidity']
        desc     = data['weather'][0]['description']
        icon     = data['weather'][0]['main']

        return jsonify({
            'response':  f"Current weather in {city}, sir: {temp}°C (feels like {feels}°C), {desc}, humidity {humidity}%.",
            'type':      'weather',
            'temp':      temp,
            'feels':     feels,
            'humidity':  humidity,
            'desc':      desc,
            'icon':      icon,
            'city':      city,
        })
    except Exception as e:
        return jsonify({
            'response': f"Weather systems error, sir: {str(e)}",
            'type': 'error',
            'temp': None,
            'desc': 'Error',
        })

@app.route('/news', methods=['GET'])
def news():
    tech_news = [
        {"title": "OpenAI releases new reasoning model", "source": "TechCrunch", "url": "https://techcrunch.com"},
        {"title": "Python 3.14 new features announced", "source": "Python.org", "url": "https://python.org"},
        {"title": "React 20 ships with new compiler", "source": "React Blog", "url": "https://react.dev"},
        {"title": "GitHub Copilot gets major update", "source": "GitHub Blog", "url": "https://github.blog"},
        {"title": "Next.js 15 performance improvements", "source": "Vercel Blog", "url": "https://vercel.com/blog"},
        {"title": "AI coding assistants reshape software engineering", "source": "The Verge", "url": "https://theverge.com"},
    ]
    return jsonify({'news': tech_news})

@app.route('/analytics', methods=['GET'])
def get_analytics():
    return jsonify(load_analytics())

@app.route('/notes', methods=['GET'])
def get_notes():
    return jsonify(load_memory().get('notes', []))

@app.route('/todos', methods=['GET'])
def get_todos():
    return jsonify(load_memory().get('todos', []))

@app.route('/reminders', methods=['GET'])
def get_reminders():
    return jsonify(load_memory().get('reminders', []))

@app.route('/history', methods=['GET'])
def get_history():
    return jsonify(conversation_history)

@app.route('/clear', methods=['POST'])
def clear():
    global conversation_history
    conversation_history = []
    return jsonify({'success': True})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(debug=True, port=port)