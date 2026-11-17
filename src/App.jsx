import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import data from "./data.json";

const FALLBACK = "Sorry, I did not understand your query!";

function Chat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [product, setProduct] = useState(null);
  const [stage, setStage] = useState("product"); // product | budget | done
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalText, setModalText] = useState("");
  const [modalFor, setModalFor] = useState(null);

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const addMsg = (sender, text) => setMessages(prev => [...prev, { sender, text }]);

  const saveConversation = () => {
    if (messages.length === 0) return;
    const saved = JSON.parse(localStorage.getItem("conversations") || "[]");
    saved.push({ id: Date.now(), messages, rating, feedback, date: new Date().toLocaleString() });
    localStorage.setItem("conversations", JSON.stringify(saved));
  };

  const handleAsk = (e) => {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    addMsg("user", q);
    setInput("");

    const lower = q.toLowerCase();
    if (stage === "product") {
      const found = data.find(d => lower.includes(d.product.toLowerCase()));
      if (found) {
        setProduct(found);
        setStage("budget");
        addMsg("bot", `${found.prompt} ${found.budgetPrompt}`);
      } else {
        addMsg("bot", FALLBACK);
      }
    } else if (stage === "budget") {
      const match = q.match(/(\d+)\s*-\s*(\d+)/);
      if (!match) { addMsg("bot", FALLBACK); return; }
      const min = parseInt(match[1]), max = parseInt(match[2]);
      const rec = product.recommendations.find(r => max >= r.min && max <= r.max) || product.recommendations[0];
      addMsg("bot", rec.text);
      setStage("done");
    } else {
      addMsg("bot", FALLBACK);
    }
  };

  const handleQuick = (name) => {
    setInput(name);
    // trigger same logic via direct call
    addMsg("user", name);
    const found = data.find(d => d.product.toLowerCase() === name.toLowerCase());
    if (found) {
      setProduct(found); setStage("budget");
      addMsg("bot", `${found.prompt} ${found.budgetPrompt}`);
    } else addMsg("bot", FALLBACK);
  };

  const handleNew = () => {
    saveConversation();
    setMessages([]); setProduct(null); setStage("product");
    setRating(0); setFeedback("");
  };

  const handleSave = (e) => {
    e.preventDefault();
    saveConversation();
    alert("Conversation saved!");
  };

  return (
    <div className="app">
      <header>
        <h1>Product Recommendation AI</h1>
        <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
          {theme === "light" ? "Dark Mode" : "Light Mode"}
        </button>
        <button onClick={() => navigate("/history")}>Previous Recommendations</button>
      </header>

      <div className="suggestions">
        {["Jeans", "Smartphone", "Laptop", "T-Shirt"].map(p => (
          <button key={p} onClick={() => handleQuick(p)}>{p}</button>
        ))}
      </div>

      <div className="chat">
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.sender}`}>
            <p>{m.text}</p>
            {m.sender === "bot" && (
              <div className="feedback-hover">
                <button onClick={() => setModalFor(i)}>👍</button>
                <button onClick={() => { setModalFor(i); setShowModal(true); }}>👎</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {stage === "done" && (
        <div className="end-feedback">
          <p>Rate this conversation:</p>
          <div>{[1,2,3,4,5].map(n => (
            <button key={n} onClick={() => setRating(n)}>{n <= rating ? "★" : "☆"}</button>
          ))}</div>
          <textarea placeholder="Give your feedback" value={feedback} onChange={e => setFeedback(e.target.value)} />
        </div>
      )}

      <form onSubmit={handleAsk}>
        <input
          placeholder="Please tell me about your query!"
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button type="submit">Ask</button>
        <button type="submit" onClick={handleSave}>Save</button>
      </form>

      <button onClick={handleNew}>Want new suggestion?</button>

      {showModal && (
        <div className="modal">
          <h2>Provide Additional Feedback</h2>
          <textarea value={modalText} onChange={e => setModalText(e.target.value)} />
          <button onClick={() => {
            const all = JSON.parse(localStorage.getItem("feedbacks") || "[]");
            all.push({ for: modalFor, text: modalText });
            localStorage.setItem("feedbacks", JSON.stringify(all));
            setShowModal(false); setModalText("");
          }}>Submit</button>
        </div>
      )}
    </div>
  );
}

function History() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All Ratings");
  const saved = JSON.parse(localStorage.getItem("conversations") || "[]");
  const filtered = filter === "All Ratings" ? saved : saved.filter(c => c.rating === Number(filter));

  return (
    <div>
      <h1>Product Recommendation AI</h1>
      <h2>Past Conversations</h2>
      <button onClick={() => navigate("/")}>Back to Chat</button>
      <label>Filter by rating
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option>All Ratings</option><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option>
        </select>
      </label>
      {filtered.length === 0 && <p>No conversations yet</p>}
      {filtered.map(c => (
        <div key={c.id} className="history-card">
          <p>Rating: {c.rating} / 5</p>
          <p>Feedback: {c.feedback}</p>
          {c.messages.map((m, i) => <p key={i}><b>{m.sender}:</b> {m.text}</p>)}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Chat />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </BrowserRouter>
  );
}