// ── Theme ──
let isDark = true;

function toggleTheme() {
  isDark = !isDark;
  document.documentElement.setAttribute(
    "data-theme",
    isDark ? "dark" : "light",
  );
  document.querySelector(".theme-btn").textContent = isDark ? "🌙" : "☀️";
}

// ── Particles ──
const canvas = document.getElementById("bg-canvas");
const ctx = canvas.getContext("2d");
let particles = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

function createParticle() {
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 1.5 + 0.5,
    speedX: (Math.random() - 0.5) * 0.3,
    speedY: (Math.random() - 0.5) * 0.3,
    opacity: Math.random() * 0.3 + 0.1,
  };
}

for (let i = 0; i < 60; i++) particles.push(createParticle());

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const color = isDark ? "0,212,255" : "0,136,204";
  particles.forEach((p) => {
    p.x += p.speedX;
    p.y += p.speedY;
    if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
    if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${color},${p.opacity})`;
    ctx.fill();
  });
  particles.forEach((p1, i) => {
    particles.slice(i + 1).forEach((p2) => {
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      if (dist < 100) {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(${color},${0.05 * (1 - dist / 100)})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    });
  });
  requestAnimationFrame(animateParticles);
}

animateParticles();

// ── Clock ──
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");
  document.getElementById("header-time").textContent = `${h}:${m}:${s}`;

  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  const el = document.getElementById("sys-date");
  if (el)
    el.textContent = `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

setInterval(updateClock, 1000);
updateClock();

// ── Tabs ──
function switchTab(tab) {
  document
    .querySelectorAll(".tab-btn")
    .forEach((b) => b.classList.remove("active"));
  document
    .querySelectorAll(".tab-pane")
    .forEach((p) => p.classList.add("hidden"));
  document.getElementById(`tab-${tab}`).classList.add("active");
  document.getElementById(`tab-${tab}-content`).classList.remove("hidden");

  if (tab === "notes") loadNotesPanel();
  if (tab === "news") loadNews();
  if (tab === "analytics") loadAnalytics();
}

// ── System Monitor ──
async function updateSystemStats() {
  try {
    const res = await fetch("/system");
    const data = await res.json();
    if (data.error) return;

    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.style.width = `${val}%`;
    };
    const txt = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    set("cpu-fill", data.cpu);
    txt("cpu-val", `${data.cpu}%`);
    set("ram-fill", data.memory_used);
    txt("ram-val", `${data.memory_used}%`);
    set("disk-fill", data.disk_used);
    txt("disk-val", `${data.disk_used}%`);

    const batteryRow = document.getElementById("battery-row");
    const batteryFill = document.getElementById("battery-fill");
    const batteryVal = document.getElementById("battery-val");

    if (data.battery !== null && batteryRow) {
      batteryRow.style.display = "flex";
      if (batteryFill) {
        batteryFill.style.width = `${data.battery}%`;
        batteryFill.style.background =
          data.battery > 50
            ? "linear-gradient(90deg, #00ff88, #00cc66)"
            : data.battery > 20
              ? "linear-gradient(90deg, #ffc800, #ff9900)"
              : "linear-gradient(90deg, #ff4466, #cc0033)";
      }
      if (batteryVal) {
        batteryVal.textContent = `${data.battery}%${data.battery_charging ? " ⚡" : ""}`;
        batteryVal.style.color =
          data.battery > 50
            ? "#00ff88"
            : data.battery > 20
              ? "#ffc800"
              : "#ff4466";
      }
    } else if (batteryRow) {
      batteryRow.style.display = "none";
    }
  } catch (e) {}
}

setInterval(updateSystemStats, 2000);
updateSystemStats();

// ── Speech Recognition ──
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isListening = false;
let isSpeaking = false;
let msgCount = 0;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  recognition.onstart = () => {
    isListening = true;
    document.getElementById("voice-btn").classList.add("listening");
    document.getElementById("voice-visualizer").classList.remove("hidden");
    setReactorState("listening", "LISTENING", "Speak your command, sir");
    setStatus("LISTENING");
  };

  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map((r) => r[0].transcript)
      .join("");
    document.getElementById("user-input").value = transcript;
    if (event.results[0].isFinal) sendMessage();
  };

  recognition.onend = () => {
    isListening = false;
    document.getElementById("voice-btn").classList.remove("listening");
    document.getElementById("voice-visualizer").classList.add("hidden");
    if (!isSpeaking) {
      setReactorState("", "READY", "Awaiting command, sir");
      setStatus("ONLINE");
    }
  };

  recognition.onerror = () => {
    isListening = false;
    document.getElementById("voice-btn").classList.remove("listening");
    document.getElementById("voice-visualizer").classList.add("hidden");
  };
}

function toggleVoice() {
  if (!recognition) {
    alert("Voice recognition not supported. Use Chrome!");
    return;
  }
  if (isListening) recognition.stop();
  else recognition.start();
}

// ── Speech Synthesis ──
function speak(text) {
  if (!window.speechSynthesis) return;
  const clean = text.replace(/[*_#`>•]/g, "").trim();
  const utterance = new SpeechSynthesisUtterance(clean);
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(
    (v) =>
      v.name.includes("Google UK English Male") ||
      v.name.includes("Daniel") ||
      v.name.includes("Alex") ||
      v.lang === "en-GB",
  );
  if (preferred) utterance.voice = preferred;
  utterance.rate = 0.9;
  utterance.pitch = 0.85;
  utterance.volume = 1;

  isSpeaking = true;
  setReactorState("speaking", "SPEAKING", "Processing response...");
  setStatus("SPEAKING");

  utterance.onend = () => {
    isSpeaking = false;
    setReactorState("", "READY", "Awaiting command, sir");
    setStatus("ONLINE");
  };

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

// ── Language Detection ──
function detectLang(text) {
  if (/[\uac00-\ud7a3]/.test(text)) return "KO";
  if (/[\u0e00-\u0e7f]/.test(text)) return "TH";
  if (/[äöüÄÖÜß]/.test(text)) return "DE";
  return "EN";
}

// ── Reactor ──
function setReactorState(state, label, sub) {
  const reactor = document.getElementById("arc-reactor");
  reactor.className = "arc-reactor" + (state ? ` ${state}` : "");
  document.getElementById("arc-label").textContent = label;
  document.getElementById("arc-sub").textContent = sub;
}

function setStatus(text) {
  document.getElementById("status-text").textContent = text;
}

// ── Messages ──
function addMessage(role, text) {
  const messages = document.getElementById("messages");
  const isJarvis = role === "jarvis";

  msgCount++;
  document.getElementById("mem-count").textContent = Math.floor(msgCount / 2);

  const div = document.createElement("div");
  div.classList.add("message", isJarvis ? "jarvis" : "user");

  const formatted = text
    .replace(/```(\w*)\n?([\s\S]*?)```/g, "<pre><code>$2</code></pre>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");

  div.innerHTML = `
    <div class="message-icon">${isJarvis ? "J" : "K"}</div>
    <div class="message-content">
      <div class="message-name">${isJarvis ? "JARVIS" : "SIR"}</div>
      <div class="message-text">${formatted}</div>
    </div>
  `;

  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function showTyping() {
  const messages = document.getElementById("messages");
  const div = document.createElement("div");
  div.classList.add("message", "jarvis");
  div.id = "typing-indicator";
  div.innerHTML = `
    <div class="message-icon">J</div>
    <div class="message-content">
      <div class="message-name">JARVIS</div>
      <div class="message-text">
        <div class="typing-dots">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    </div>
  `;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function removeTyping() {
  const t = document.getElementById("typing-indicator");
  if (t) t.remove();
}

// ── Send Message ──
async function sendMessage() {
  const input = document.getElementById("user-input");
  const message = input.value.trim();
  if (!message) return;

  input.value = "";

  const lang = detectLang(message);
  document.getElementById("lang-detect").textContent = lang;
  document.getElementById("mode-display").textContent = "CHAT";

  // Switch to chat tab if not there
  switchTab("chat");

  addMessage("user", message);
  showTyping();
  setReactorState("thinking", "PROCESSING", "Analyzing request...");
  setStatus("THINKING");

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const data = await res.json();
    removeTyping();

    const reply = data.response || "Systems error, sir.";
    addMessage("jarvis", reply);
    speak(reply);

    if (data.type === "search" && data.url) {
      setTimeout(() => {
        window.open(data.url, "_blank");
      }, 1000);
    }

    if (data.type === "todo") loadTodos();
    if (data.type === "reminder") loadReminders();
    if (data.type === "note") loadNotesPanel();
  } catch (err) {
    removeTyping();
    const errMsg = "Unable to connect to core systems, sir.";
    addMessage("jarvis", errMsg);
    speak(errMsg);
    setReactorState("", "READY", "Awaiting command, sir");
    setStatus("ONLINE");
  }
}

function quickCmd(cmd) {
  document.getElementById("user-input").value = cmd;
  sendMessage();
}

document.getElementById("user-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

// ── Todos ──
async function loadTodos() {
  try {
    const res = await fetch("/todos");
    const todos = await res.json();
    renderTodos(todos);
  } catch (e) {}
}

function renderTodos(todos) {
  const list = document.getElementById("todo-list");
  const active = todos.filter((t) => !t.done);
  const badge = document.getElementById("todo-badge");
  const count = document.getElementById("task-count");
  if (badge) badge.textContent = active.length;
  if (count) count.textContent = active.length;

  if (!todos.length) {
    list.innerHTML = '<div class="panel-empty">No tasks, sir</div>';
    return;
  }

  list.innerHTML = "";
  todos.forEach((todo, i) => {
    if (todo.done) return;
    const div = document.createElement("div");
    div.classList.add("todo-item");
    div.innerHTML = `
      <div class="todo-check" onclick="completeTodo(${i})"></div>
      <span class="todo-task">${todo.task}</span>
    `;
    list.appendChild(div);
  });

  if (!active.length)
    list.innerHTML = '<div class="panel-empty">All done, sir! 🎉</div>';
}

async function addTodo() {
  const input = document.getElementById("todo-input");
  const task = input.value.trim();
  if (!task) return;
  input.value = "";
  await fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: `add todo ${task}` }),
  });
  loadTodos();
}

async function completeTodo(index) {
  try {
    const res = await fetch("/todos");
    const todos = await res.json();
    if (todos[index]) {
      await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: `complete task ${todos[index].task}` }),
      });
      loadTodos();
    }
  } catch (e) {}
}

document.getElementById("todo-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTodo();
});

// ── Reminders ──
async function loadReminders() {
  try {
    const res = await fetch("/reminders");
    const reminders = await res.json();
    renderReminders(reminders);
  } catch (e) {}
}

function renderReminders(reminders) {
  const list = document.getElementById("reminder-list");
  const active = reminders.filter((r) => !r.done);
  const badge = document.getElementById("reminder-badge");
  if (badge) badge.textContent = active.length;

  if (!active.length) {
    list.innerHTML = '<div class="panel-empty">No reminders, sir</div>';
    return;
  }

  list.innerHTML = "";
  active.forEach((r, i) => {
    const div = document.createElement("div");
    div.classList.add("reminder-item");
    div.innerHTML = `
      <div class="reminder-dismiss" onclick="dismissReminder(${i})" title="Dismiss">✓</div>
      <span>${r.text}</span>
    `;
    list.appendChild(div);
  });
}

async function addReminder() {
  const input = document.getElementById("reminder-input");
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  await fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: `remind me to ${text}` }),
  });
  loadReminders();
}

async function dismissReminder(index) {
  try {
    const res = await fetch("/reminders");
    const reminders = await res.json();
    const active = reminders.filter((r) => !r.done);
    if (active[index]) {
      active[index].done = true;
      await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `complete task ${active[index].text}`,
        }),
      });
      loadReminders();
    }
  } catch (e) {}
}

document.getElementById("reminder-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") addReminder();
});

// ── Notes ──
let localNotes = [];

async function loadNotesPanel() {
  try {
    const res = await fetch("/notes");
    localNotes = await res.json();
    renderNotesPanel();
    document.getElementById("notes-count").textContent = localNotes.length;
  } catch (e) {}
}

function renderNotesPanel() {
  const list = document.getElementById("notes-list");
  if (!localNotes.length) {
    list.innerHTML =
      '<div class="panel-empty" style="padding:20px">No notes yet, sir</div>';
    return;
  }

  list.innerHTML = "";
  localNotes
    .slice()
    .reverse()
    .forEach((note, i) => {
      const div = document.createElement("div");
      div.classList.add("note-card");
      const title = note.title || note.text?.substring(0, 30) + "..." || "Note";
      const body = note.body || note.text || "";
      div.innerHTML = `
      <button class="note-delete" onclick="deleteNote(${localNotes.length - 1 - i})">✕</button>
      <div class="note-card-title">${title}</div>
      <div class="note-card-body">${body}</div>
      <div class="note-card-date">${note.created || ""}</div>
    `;
      list.appendChild(div);
    });
}

async function saveNoteFromPanel() {
  const title = document.getElementById("note-title-input").value.trim();
  const body = document.getElementById("note-body-input").value.trim();
  if (!title && !body) return;

  const text = title ? `${title}: ${body}` : body;
  await fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: `add note ${text}` }),
  });

  document.getElementById("note-title-input").value = "";
  document.getElementById("note-body-input").value = "";
  loadNotesPanel();
}

async function deleteNote(index) {
  if (!localNotes[index]) return;
  const keyword = localNotes[index].text?.substring(0, 20) || "";
  await fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: `delete note ${keyword}` }),
  });
  loadNotesPanel();
}

// ── Weather ──
let currentCity = "Seoul";

function setCity(city) {
  currentCity = city;
  document.getElementById("weather-city").textContent = city;
  fetchWeather();
}

async function fetchWeather() {
  document.getElementById("weather-temp").textContent = "--°C";
  document.getElementById("weather-desc").textContent = "Loading...";
  document.getElementById("weather-detail").textContent = "";

  try {
    const res = await fetch("/weather", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ city: currentCity }),
    });
    const data = await res.json();

    if (data.type === "no_key") {
      document.getElementById("weather-temp").textContent = "--°C";
      document.getElementById("weather-desc").textContent =
        "Add WEATHER_API_KEY to .env";
      return;
    }

    if (data.temp !== null && data.temp !== undefined) {
      document.getElementById("weather-temp").textContent = `${data.temp}°C`;
      document.getElementById("weather-desc").textContent = data.desc || "";
      if (data.feels && data.humidity) {
        document.getElementById("weather-detail").textContent =
          `Feels ${data.feels}°C · Humidity ${data.humidity}%`;
      }
    } else {
      document.getElementById("weather-temp").textContent = "--°C";
      document.getElementById("weather-desc").textContent =
        data.desc || "Unavailable";
    }
  } catch (e) {
    document.getElementById("weather-temp").textContent = "--°C";
    document.getElementById("weather-desc").textContent = "Unavailable";
  }
}

// ── News ──
async function loadNews() {
  const list = document.getElementById("news-list");
  list.innerHTML = '<div class="panel-empty">Loading news, sir...</div>';

  try {
    const res = await fetch("/news");
    const data = await res.json();
    const news = data.news;

    if (!news.length) {
      list.innerHTML = '<div class="panel-empty">No news available</div>';
      return;
    }

    list.innerHTML = "";
    news.forEach((item) => {
      const a = document.createElement("a");
      a.classList.add("news-item");
      a.href = item.url;
      a.target = "_blank";
      a.innerHTML = `
        <div class="news-title">${item.title}</div>
        <div class="news-source">${item.source}</div>
      `;
      list.appendChild(a);
    });
  } catch (e) {
    list.innerHTML = '<div class="panel-empty">News unavailable, sir</div>';
  }
}

// ── Analytics ──
async function loadAnalytics() {
  const wrap = document.getElementById("analytics-content");
  try {
    const res = await fetch("/analytics");
    const data = await res.json();

    const today = new Date().toISOString().split("T")[0];
    const todayCount = data.daily_usage?.[today] || 0;
    const topCmd = Object.entries(data.commands_used || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const topLang = Object.entries(data.languages_used || {}).sort(
      (a, b) => b[1] - a[1],
    );
    const maxCmd = topCmd.length ? topCmd[0][1] : 1;

    wrap.innerHTML = `
      <div class="analytics-card">
        <div class="analytics-title">📊 USAGE OVERVIEW</div>
        <div class="analytics-stat">
          <span class="analytics-stat-label">Total Messages</span>
          <span class="analytics-stat-val">${data.total_messages || 0}</span>
        </div>
        <div class="analytics-stat">
          <span class="analytics-stat-label">Today</span>
          <span class="analytics-stat-val">${todayCount}</span>
        </div>
        <div class="analytics-stat">
          <span class="analytics-stat-label">Active Since</span>
          <span class="analytics-stat-val">${data.first_use || "Today"}</span>
        </div>
      </div>

      <div class="analytics-card">
        <div class="analytics-title">🔥 TOP COMMANDS</div>
        ${topCmd
          .map(
            ([cmd, count]) => `
          <div class="analytics-bar-row">
            <div class="analytics-bar-label">${cmd}</div>
            <div class="analytics-bar">
              <div class="analytics-bar-fill" style="width:${(count / maxCmd) * 100}%"></div>
            </div>
            <div class="analytics-bar-num">${count}</div>
          </div>
        `,
          )
          .join("")}
        ${topCmd.length === 0 ? '<div class="panel-empty">No data yet</div>' : ""}
      </div>

      <div class="analytics-card">
        <div class="analytics-title">🌐 LANGUAGES USED</div>
        ${topLang
          .map(
            ([lang, count]) => `
          <div class="analytics-stat">
            <span class="analytics-stat-label">${lang}</span>
            <span class="analytics-stat-val">${count} msgs</span>
          </div>
        `,
          )
          .join("")}
        ${topLang.length === 0 ? '<div class="panel-empty">No data yet</div>' : ""}
      </div>
    `;
  } catch (e) {
    wrap.innerHTML =
      '<div class="panel-empty">Analytics unavailable, sir</div>';
  }
}

// ── Web Search ──
function triggerSearch() {
  document.getElementById("search-modal").classList.remove("hidden");
  document.getElementById("search-input").focus();
}

function closeSearch() {
  document.getElementById("search-modal").classList.add("hidden");
  document.getElementById("search-results").innerHTML = "";
  document.getElementById("search-input").value = "";
}

async function doSearch() {
  const query = document.getElementById("search-input").value.trim();
  if (!query) return;

  const resultsDiv = document.getElementById("search-results");
  const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  const ddgUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
  const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  const ghUrl = `https://github.com/search?q=${encodeURIComponent(query)}`;

  resultsDiv.innerHTML = `
    <div style="font-size:0.72rem;color:var(--text2);margin-bottom:10px">Results for: <span style="color:var(--primary)">"${query}"</span></div>
    <a href="${googleUrl}" target="_blank" class="search-link">🔍 Google</a>
    <a href="${ddgUrl}"    target="_blank" class="search-link">🦆 DuckDuckGo</a>
    <a href="${ytUrl}"     target="_blank" class="search-link">📺 YouTube</a>
    <a href="${ghUrl}"     target="_blank" class="search-link">🐙 GitHub</a>
  `;

  switchTab("chat");
  addMessage("jarvis", `Opening search results for "${query}", sir.`);
  speak(`Searching for ${query}, sir.`);
}

document.getElementById("search-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") doSearch();
  if (e.key === "Escape") closeSearch();
});

document.getElementById("search-modal").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) closeSearch();
});

// ── Music ──
let playlist = [];
let trackIndex = 0;
let isPlaying = false;

const audioPlayer = document.getElementById("audio-player");

function loadMusic(files) {
  playlist = Array.from(files).map((f) => ({
    name: f.name.replace(/\.[^.]+$/, ""),
    url: URL.createObjectURL(f),
  }));
  if (playlist.length > 0) {
    trackIndex = 0;
    loadTrack(0);
    togglePlay();
    addMessage(
      "jarvis",
      `Music loaded, sir. ${playlist.length} track(s) ready. Now playing: "${playlist[0].name}".`,
    );
    speak(`Music loaded. Now playing ${playlist[0].name}.`);
  }
}

function loadTrack(index) {
  if (!playlist[index]) return;
  audioPlayer.src = playlist[index].url;
  document.getElementById("music-title").textContent = playlist[index].name;
  document.getElementById("music-sub").textContent =
    `Track ${index + 1} of ${playlist.length}`;
}

function togglePlay() {
  const btn = document.getElementById("play-btn");
  if (isPlaying) {
    audioPlayer.pause();
    isPlaying = false;
    btn.textContent = "▶";
    btn.classList.remove("playing");
  } else {
    audioPlayer.play();
    isPlaying = true;
    btn.textContent = "⏸";
    btn.classList.add("playing");
  }
}

function nextTrack() {
  if (!playlist.length) return;
  trackIndex = (trackIndex + 1) % playlist.length;
  loadTrack(trackIndex);
  if (isPlaying) audioPlayer.play();
}

function prevTrack() {
  if (!playlist.length) return;
  trackIndex = (trackIndex - 1 + playlist.length) % playlist.length;
  loadTrack(trackIndex);
  if (isPlaying) audioPlayer.play();
}

function setVolume(val) {
  audioPlayer.volume = parseFloat(val);
}
function seekTrack(val) {
  if (audioPlayer.duration)
    audioPlayer.currentTime = (val / 100) * audioPlayer.duration;
}

audioPlayer.addEventListener("ended", nextTrack);

audioPlayer.addEventListener("timeupdate", () => {
  if (!audioPlayer.duration) return;
  const pct = (audioPlayer.currentTime / audioPlayer.duration) * 100;
  const sl = document.getElementById("progress-slider");
  const cur = document.getElementById("music-current");
  const dur = document.getElementById("music-duration");
  if (sl) sl.value = pct;
  if (cur) cur.textContent = formatTime(audioPlayer.currentTime);
  if (dur) dur.textContent = formatTime(audioPlayer.duration);
});

function formatTime(sec) {
  if (isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ── Init ──
window.speechSynthesis.onvoiceschanged = () => {
  window.speechSynthesis.getVoices();
};

loadTodos();
loadReminders();
fetchWeather();

setTimeout(() => {
  speak(
    "Good day, sir. All systems are fully operational. I am at your service, Keonho.",
  );
}, 1200);
