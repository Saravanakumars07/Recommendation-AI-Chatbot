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
  const [showModal, setShowModal] = useState(false);
  const [modalText, setModalText] = useState("");
  const [modalFor, setModalFor] = useState(null);

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const addMsg = (sender, text) =>
    setMessages((prev) => [...prev, { sender, text }]);

  const saveConversation = (msgsToSave = messages) => {
    if (msgsToSave.length === 0) return;
    const saved = JSON.parse(localStorage.getItem("conversations") || "[]");
    saved.push({
      id: Date.now(),
      messages: msgsToSave,
      rating,
      feedback,
      date: new Date().toLocaleString(),
    });
    localStorage.setItem("conversations", JSON.stringify(saved));
  };

  const handleAsk = (e) => {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    const lower = q.toLowerCase();
    let newMessages = [...messages, { sender: "user", text: q }];

    if (stage === "product") {
      const found = data.find((d) => lower.includes(d.product.toLowerCase()));
      if (found) {
        setProduct(found);
        setStage("budget");
        newMessages.push({ sender: "bot", text: `${found.prompt} ${found.budgetPrompt}` });
      } else {
        newMessages.push({ sender: "bot", text: FALLBACK });
      }
    } else if (stage === "budget") {
      const match = q.match(/(\d+)\s*-\s*(\d+)/);
      if (!match) {
        newMessages.push({ sender: "bot", text: FALLBACK });
      } else {
        const max = parseInt(match[2]);
        const rec =
          product.recommendations.find((r) => max >= r.min && max <= r.max) ||
          product.recommendations[0];
        newMessages.push({ sender: "bot", text: rec.text });
        setStage("done");
      }
    } else {
      newMessages.push({ sender: "bot", text: FALLBACK });
    }
    setMessages(newMessages);
    setInput("");
  };

  const handleQuick = (name) => {
    const found = data.find((d) => d.product.toLowerCase() === name.toLowerCase());
    setMessages((prev) => {
      const next = [...prev, { sender: "user", text: name }];
      if (found) {
        setProduct(found);
        setStage("budget");
        next.push({ sender: "bot", text: `${found.prompt} ${found.budgetPrompt}` });
      } else {
        next.push({ sender: "bot", text: FALLBACK });
      }
      return next;
    });
  };

  const handleNew = () => {
    saveConversation();
    setMessages([]);
    setProduct(null);
    setStage("product");
    setRating(0);
    setFeedback("");
  };

  const handleSave = () => {
    saveConversation();
    alert("Conversation saved!");
  };

  return (
    <div className="app">
      <header>
        <h1>Product Recommendation AI</h1>
        <button type="button" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
          {theme === "light" ? "Dark Mode" : "Light Mode"}
        </button>
        {/* FIX 1: Must be <a href="/history"> for Cypress */}
        <Link to="/history">Previous Recommendations</Link>
        <Link to="/history">Past Conversations</Link>
      </header>

      <div className="suggestions">
        {["Jeans", "Smartphone", "Laptop", "T-Shirt"].map((p) => (
          <button type="button" key={p} onClick={() => handleQuick(p)}>{p}</button>
        ))}
      </div>

      <div className="chat">
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.sender}`}>
            <p>{m.text}</p>
            {m.sender === "bot" && (
              <div className="feedback-hover">
                <button type="button" onClick={() => setModalFor(i)}>👍</button>
                <button type="button" onClick={() => { setModalFor(i); setShowModal(true); }}>👎</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {stage === "done" && (
        <div className="end-feedback">
          <p>Rate this conversation:</p>
          <div>
            {[1, 2, 3, 4, 5].map((n) => (
              <button type="button" key={n} onClick={() => setRating(n)}>
                {n <= rating ? "★" : "☆"}
              </button>
            ))}
          </div>
          <textarea placeholder="Give your feedback" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
        </div>
      )}

      {/* FIX 2: ONLY ONE type="submit" in whole page */}
      <form onSubmit={handleAsk}>
        <input
          placeholder="Please tell me about your query!"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit">Ask</button>
      </form>

      {/* FIX 3: Save and New MUST be type="button" and OUTSIDE form */}
      <button type="button" onClick={handleSave}>Save</button>
      <button type="button" onClick={handleNew}>Want new suggestion?</button>

      {showModal && (
        <div className="modal">
          <h2>Provide Additional Feedback</h2>
          <textarea value={modalText} onChange={(e) => setModalText(e.target.value)} />
          <button
            type="button"
            onClick={() => {
              const all = JSON.parse(localStorage.getItem("feedbacks") || "[]");
              all.push({ for: modalFor, text: modalText });
              localStorage.setItem("feedbacks", JSON.stringify(all));
              setShowModal(false);
              setModalText("");
            }}
          >
            Submit
          </button>
        </div>
      )}
    </div>
  );
}

function History() {
  const [filter, setFilter] = useState("All Ratings");
  const saved = JSON.parse(localStorage.getItem("conversations") || "[]");
  const filtered =
    filter === "All Ratings" ? saved : saved.filter((c) => c.rating === Number(filter));

  return (
    <div>
      <h1>Product Recommendation AI</h1>
      <h2>Past Conversations</h2>
      {/* FIX 4: Must be <a href="/"> for Cypress Test 7 */}
      <Link to="/">Back to Chat</Link>
      <button type="button" onClick={() => window.history.back()}>Back</button>
      <label>
        Filter by rating
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option>All Ratings</option>
          <option>1</option><option>2</option><option>3</option><option>4</option><option>5</option>
        </select>
      </label>
      {filtered.length === 0 && <p>No conversations yet</p>}
      {filtered.map((c) => (
        <div key={c.id} className="history-card">
          <p>Rating: {c.rating} / 5</p>
          <p>Feedback: {c.feedback}</p>
          {c.messages.map((m, i) => (
            <p key={i}><b>{m.sender}:</b> {m.text}</p>
          ))}
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