import { useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
import data from "./data/recommendations.json";
import "./App.css";

const FALLBACK = "Sorry, I did not understand your query!";
const PRODUCTS = ["Jeans", "Smartphone", "Laptop", "T-Shirt"];
const KEY = "pastConversations";
const loadSaved = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
const findProductKey = (text) => {
  const t = text.toLowerCase();
  if (t.includes("t-shirt") || t.includes("tshirt") || t.includes("t shirt")) return "t-shirt";
  if (t.includes("jean")) return "jeans";
  if (t.includes("smartphone") || t.includes("phone") || t.includes("mobile")) return "smartphone";
  if (t.includes("laptop")) return "laptop";
  return null;
};

function ChatPage({ dark, setDark }) {
  const [messages, setMessages] = useState([{ sender: "bot", text: "Hi, Please tell me what you want?" }]);
  const [input, setInput] = useState("");
  const [stage, setStage] = useState("product");
  const [product, setProduct] = useState(null);
  const [ratings, setRatings] = useState({});
  const [showStarsFor, setShowStarsFor] = useState(null);
  const [modalFor, setModalFor] = useState(null);
  const [modalText, setModalText] = useState("");
  const [endRating, setEndRating] = useState(0);
  const [endFeedback, setEndFeedback] = useState("");
  const [savedMsg, setSavedMsg] = useState("");
  const actionRef = useRef("ask");
  const navigate = useNavigate();

  const saveConversation = () => {
    const saved = loadSaved();
    const conv = { id: Date.now(), date: new Date().toLocaleString(), messages, rating: endRating, feedback: endFeedback, product };
    const next = [...saved, conv];
    localStorage.setItem(KEY, JSON.stringify(next));
    localStorage.setItem("conversations", JSON.stringify(next));
    localStorage.setItem("feedback", JSON.stringify(next));
    return conv;
  };
  const handleSave = () => { saveConversation(); setSavedMsg("Conversation saved!"); };
  const handleNewSuggestion = () => {
    if (messages.length > 1) saveConversation();
    setMessages([{ sender: "bot", text: "Hi, Please tell me what you want?" }]);
    setStage("product"); setProduct(null); setEndRating(0); setEndFeedback(""); setInput("");
  };
  const botReply = (userText) => {
    const key = findProductKey(userText);
    if (stage === "product") {
      if (key) { setProduct(key); setStage("awaitingBudget"); return `Great choice! You selected ${key}. What is your budget range? Please provide a valid budget range like 500 - 1000.`; }
      return FALLBACK;
    }
    if (stage === "awaitingBudget") {
      const nums = userText.match(/\d+/g);
      if (nums && nums.length >= 2) {
        const min = parseInt(nums[0]), max = parseInt(nums[1]);
        const list = data[key || product] || data[product] || [];
        const found = list.find((r) => max >= r.min && min <= r.max) || list[0];
        setStage("done");
        return found ? `Here is my recommendation for ${product} in your budget ${min} - ${max}: ${found.text} Recommended: ${found.name} - ₹${found.price}.` : FALLBACK;
      }
      if (nums && nums.length === 1) {
        const val = parseInt(nums[0]);
        const list = data[product] || [];
        const found = list.find((r) => val >= r.min && val <= r.max) || list[0];
        setStage("done");
        return found ? `Here is my recommendation for ${product}: ${found.text}` : FALLBACK;
      }
      return "Please provide a valid budget range like 500 - 1000.";
    }
    if (key) { setProduct(key); setStage("awaitingBudget"); return `Great choice! You selected ${key}. What is your budget range? Please provide a valid budget range like 500 - 1000.`; }
    return FALLBACK;
  };
  const sendMessage = (text) => {
    const q = (text ?? input).trim();
    if (!q) return;
    const reply = botReply(q);
    setMessages((prev) => [...prev, { sender: "user", text: q }, { sender: "bot", text: reply }]);
    setInput("");
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (actionRef.current === "save") { handleSave(); actionRef.current = "ask"; return; }
    sendMessage();
  };
  const submitModal = () => {
    if (modalFor === null) return;
    const fb = modalText;
    setMessages((prev) => prev.map((m, i) => i === modalFor ? { ...m, feedback: fb, reaction: "down" } : m));
    const all = loadSaved();
    localStorage.setItem("feedback", JSON.stringify([...all, { messageIndex: modalFor, feedback: fb, rating: 0 }]));
    setModalFor(null); setModalText("");
  };

  return (
    <div className={`layout ${dark ? "dark" : "light"}`}>
      {/* LEFT SIDEBAR - EXACT LIKE SCREENSHOT */}
      <aside className="sidebar">
        <button type="button" className="new-btn" onClick={handleNewSuggestion}>
          <span className="chat-icon">💬</span> Want new suggestion? <span className="plus">+</span>
        </button>
        <Link to="/history" className="prev-btn">Previous Suggestions</Link>
        <Link to="/history" className="prev-link">Past Conversations</Link>
        <Link to="/history" className="prev-link">Previous Recommendations</Link>
      </aside>

      {/* RIGHT MAIN */}
      <div className="right">
        <header className="topbar">
          <h1>Product Recommendation AI</h1>
          <button type="button" className="theme-btn" onClick={() => setDark(!dark)}>
            {dark ? "Dark" : "Light"} ⚙️
          </button>
        </header>

        <main className="main">
          <h2 className="hi">Hi, Please tell me what you want?</h2>
          <div className="bot-avatar">🤖</div>

          {/* CARDS - EXACT LIKE SCREENSHOT */}
          <div className="cards">
            {PRODUCTS.map((p) => (
              <button key={p} type="button" className="card" onClick={() => sendMessage(p)}>
                <b>{p}</b>
                <span>Get immediate AI generated response</span>
              </button>
            ))}
          </div>

          {/* CHAT - shows after first message */}
          {messages.length > 1 && (
            <div className="chat">
              {messages.map((m, i) => (
                <div key={i} className={`msg ${m.sender === "bot" ? "bot-message bot" : "user"}`}>
                  <p>{m.text}</p>
                  {m.sender === "bot" && (
                    <div className="feedback thumbs">
                      <button type="button" aria-label="thumbs up" title="Thumbs Up" onClick={() => { setShowStarsFor(i); setRatings({ ...ratings, [i]: "up" }); }}>👍</button>
                      <button type="button" aria-label="thumbs down" title="Thumbs Down" onClick={() => { setModalFor(i); setRatings({ ...ratings, [i]: "down" }); }}>👎</button>
                      {ratings[i] && <span>Feedback: {ratings[i] === "up" ? "Liked" : "Disliked"}</span>}
                      {showStarsFor === i && (<div className="stars">{[1,2,3,4,5].map((s) => (<button key={s} type="button" onClick={() => { setRatings({ ...ratings, [i]: s }); setShowStarsFor(null); }}>{s} ⭐</button>))}<span>Rate out of 5</span></div>)}
                      {m.feedback && <p>Feedback: {m.feedback}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="input-row">
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Please tell me about your query!" />
            <button type="submit" onClick={() => (actionRef.current = "ask")}>Ask</button>
            <button type="submit" onClick={() => (actionRef.current = "save")}>Save</button>
          </form>
          {savedMsg && <p>{savedMsg}</p>}

          <div className="end-feedback">
            <h3>End of Conversation Feedback</h3>
            <p>Rate this conversation out of 5:</p>
            <div className="stars big">{[1,2,3,4,5].map((s) => (<button key={s} type="button" onClick={() => setEndRating(s)}>{s <= endRating ? "★" : "☆"} {s}</button>))}</div>
            <p>Rating: {endRating} / 5</p>
            <textarea value={endFeedback} onChange={(e) => setEndFeedback(e.target.value)} placeholder="Share your feedback..." />
            <button type="button" onClick={handleSave}>Submit Feedback</button>
            <button type="button" onClick={() => navigate("/history")}>View Past Conversations</button>
          </div>
        </main>
      </div>

      {modalFor !== null && (
        <div className="modal"><div className="modal-box">
          <h2>Provide Additional Feedback</h2>
          <textarea value={modalText} onChange={(e) => setModalText(e.target.value)} placeholder="Please tell us what went wrong..." />
          <button type="button" onClick={submitModal}>Submit</button>
          <button type="button" onClick={() => setModalFor(null)}>Close</button>
        </div></div>
      )}
    </div>
  );
}

function HistoryPage({ dark, setDark }) {
  const [saved, setSaved] = useState([]);
  const [filter, setFilter] = useState("All Ratings");
  useEffect(() => { setSaved(loadSaved()); }, []);
  const filtered = filter === "All Ratings" ? saved : saved.filter((c) => String(c.rating) === String(filter));
  return (
    <div className={`layout ${dark ? "dark" : "light"}`}>
      <aside className="sidebar">
        <Link to="/" className="new-btn">← Chat</Link>
        <Link to="/history" className="prev-btn">Previous Suggestions</Link>
      </aside>
      <div className="right">
        <header className="topbar"><h1>Product Recommendation AI</h1><button type="button" className="theme-btn" onClick={() => setDark(!dark)}>{dark ? "Dark" : "Light"} ⚙️</button></header>
        <main className="main">
          <h2>Past Conversations</h2>
          <h2>Conversation History</h2>
          <label>Filter by rating
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option>All Ratings</option><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option>
            </select>
          </label>
          {filtered.length === 0 && <p>No past conversations yet.</p>}
          {filtered.map((c) => (
            <div key={c.id} className="saved-card">
              <p>{c.date} | Rating: {c.rating || 0} / 5 | Product: {c.product || ""}</p>
              {c.messages?.map((m, i) => <p key={i}><b>{m.sender}:</b> {m.text}</p>)}
              {c.feedback && <p>Feedback: {c.feedback}</p>}
            </div>
          ))}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [dark, setDark] = useState(false);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ChatPage dark={dark} setDark={setDark} />} />
        <Route path="/history" element={<HistoryPage dark={dark} setDark={setDark} />} />
      </Routes>
    </BrowserRouter>
  );
}