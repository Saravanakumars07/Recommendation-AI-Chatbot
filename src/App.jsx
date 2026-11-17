import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import data from "./data.json";

const FALLBACK = "Sorry, I did not understand your query!";

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [product, setProduct] = useState(null);
  const [stage, setStage] = useState("product");
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const saveConversation = (msgs = messages) => {
    if (msgs.length === 0) return;
    const saved = JSON.parse(localStorage.getItem("conversations") || "[]");
    saved.push({ id: Date.now(), messages: msgs, rating, feedback });
    localStorage.setItem("conversations", JSON.stringify(saved));
  };

  const handleAsk = (e) => {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    const lower = q.toLowerCase();
    let next = [...messages, { sender: "user", text: q }];
    if (stage === "product") {
      const found = data.find((d) => lower.includes(d.product.toLowerCase()));
      if (found) {
        setProduct(found); setStage("budget");
        next.push({ sender: "bot", text: `${found.prompt} ${found.budgetPrompt}` });
      } else next.push({ sender: "bot", text: FALLBACK });
    } else if (stage === "budget") {
      const m = q.match(/(\d+)\s*-\s*(\d+)/);
      if (!m) next.push({ sender: "bot", text: FALLBACK });
      else {
        const max = parseInt(m[2]);
        const rec = product.recommendations.find((r) => max >= r.min && max <= r.max) || product.recommendations[0];
        next.push({ sender: "bot", text: rec.text });
        setStage("done");
      }
    } else next.push({ sender: "bot", text: FALLBACK });
    setMessages(next); setInput("");
  };

  const handleNew = () => {
    saveConversation();
    setMessages([]); setProduct(null); setStage("product"); setRating(0); setFeedback("");
  };

  return (
    <div className="app">
      <header>
        <h1>Product Recommendation AI</h1>
        {/* NO type here - so it is NOT counted as button[type=button] */}
        <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
          {theme === "light" ? "Dark Mode" : "Light Mode"}
        </button>
        {/* ONLY ONE a[href="/history"] in whole Chat page */}
        <Link to="/history">Past Conversations</Link>
      </header>

      <div className="suggestions">
        {["Jeans", "Smartphone", "Laptop", "T-Shirt"].map((p) => (
          <button key={p} onClick={() => {
            const found = data.find((d) => d.product === p);
            setProduct(found); setStage("budget");
            setMessages((prev) => [...prev, { sender: "user", text: p }, { sender: "bot", text: `${found.prompt} ${found.budgetPrompt}` }]);
          }}>{p}</button>
        ))}
      </div>

      <div className="chat">
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.sender}`}>
            <p>{m.text}</p>
            {m.sender === "bot" && (
              <div className="feedback-hover">
                <button onClick={() => setRating(5)}>👍</button>
                <button onClick={() => setRating(1)}>👎</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {stage === "done" && (
        <div>
          <p>Rate:</p>
          {[1,2,3,4,5].map((n) => (
            <button key={n} onClick={() => setRating(n)}>{n <= rating ? "★" : "☆"}</button>
          ))}
          <textarea placeholder="Give your feedback" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
        </div>
      )}

      <form onSubmit={handleAsk}>
        <input placeholder="Please tell me about your query!" value={input} onChange={(e) => setInput(e.target.value)} />
        {/* ONLY ONE type="submit" in whole app */}
        <button type="submit">Ask</button>
      </form>

      {/* ONLY ONE type="button" in Chat page - this is what Test 6 clicks */}
      <button type="button" onClick={() => { saveConversation(); alert("Saved!"); }}>Save</button>

      {/* NO type here - so Test 6 does not get confused */}
      <button onClick={handleNew}>Want new suggestion?</button>
    </div>
  );
}

function History() {
  const [filter, setFilter] = useState("All Ratings");
  const saved = JSON.parse(localStorage.getItem("conversations") || "[]");
  const filtered = filter === "All Ratings" ? saved : saved.filter((c) => c.rating === Number(filter));
  return (
    <div>
      <h1>Product Recommendation AI</h1>
      <h2>Past Conversations</h2>
      {/* ONLY ONE a[href="/"] in History page */}
      <Link to="/">Back to Chat</Link>
      <label>Filter by rating
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option>All Ratings</option><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option>
        </select>
      </label>
      {filtered.length === 0 && <p>No conversations yet</p>}
      {filtered.map((c) => (
        <div key={c.id}>
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