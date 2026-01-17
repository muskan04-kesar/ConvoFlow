import { useEffect, useRef, useState } from "react";
import { api } from "./api";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

function App() {
  const senderId = "muskan";
  const receiverId = "dan";

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const bottomRef = useRef(null);

  // Load messages
  const loadMessages = async () => {
    try {
      const res = await api.get(`/messages/${senderId}/${receiverId}`);
      setMessages(res.data);
    } catch (err) {
      console.error("Load failed", err);
    }
  };

  useEffect(() => {
    loadMessages();

    socket.emit("join", senderId);

    socket.on("new_message", (msg) => {
      if (
        msg.senderId === senderId ||
        msg.senderId === receiverId
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => socket.off("new_message");
  }, []);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const payload = {
      senderId,
      receiverId,
      content: message,
      timestamp: new Date().toISOString(),
    };

    try {
      await api.post("/send-message", payload);
      setMessages((prev) => [...prev, payload]);
      setMessage("");
    } catch (err) {
      console.error("Send failed", err);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.chatBox}>
        <div style={styles.header}>
          <div style={styles.title}>ConvoFlow</div>
          <div style={styles.subtitle}>Chat with dan</div>
        </div>

        <div style={styles.messages}>
          {messages.map((m, i) => {
            const isMe = m.senderId === senderId;

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: isMe ? "flex-end" : "flex-start",
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    ...styles.bubble,
                    background: isMe ? "#397bd1" : "#b92b2b",
                  }}
                >
                  {m.content}
                  <div style={styles.time}>
                    {new Date(m.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div style={styles.inputBar}>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message…"
            style={styles.input}
          />
          <button onClick={sendMessage} style={styles.button}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;

// 🔹 CLEAN, MINIMAL STYLES
const styles = {
  page: {
    minHeight: "100vh",
    background: "#efeae2",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  chatBox: {
    width: 420,
    height: "90vh",
    background: "#f0f2f5",
    display: "flex",
    flexDirection: "column",
    borderRadius: 8,
    overflow: "hidden",
    boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
  },
  header: {
    background: "#005c4b",
    color: "white",
    padding: "12px 16px",
  },
  title: {
    fontWeight: 600,
  },
  subtitle: {
    fontSize: 12,
    opacity: 0.8,
  },
  messages: {
    flex: 1,
    padding: 16,
    overflowY: "auto",
  },
  bubble: {
    padding: "8px 12px",
    borderRadius: 8,
    maxWidth: "70%",
    fontSize: 14,
    boxShadow: "0 1px 1px rgba(0,0,0,0.1)",
  },
  time: {
    fontSize: 10,
    textAlign: "right",
    opacity: 0.5,
    marginTop: 4,
  },
  inputBar: {
    display: "flex",
    padding: 12,
    gap: 8,
    background: "#bcdb4c",
  },
  input: {
    flex: 1,
    padding: 10,
    borderRadius: 20,
    border: "none",
    outline: "none",
  },
  button: {
    padding: "0 16px",
    borderRadius: 20,
    border: "none",
    background: "#005c4b",
    color: "white",
    cursor: "pointer",
  },
};
