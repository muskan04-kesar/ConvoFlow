import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

// Mock API for demo
const api = {
  get: async () => ({ data: [] }),
  post: async () => ({})
};



function App() {
  const [users, setUsers] = useState([
    { id: "muskan", name: "Muskan", online: true },
    { id: "dan", name: "Dan", online: true },
    { id: "alex", name: "Alex", online: false },
    { id: "sam", name: "Sam", online: false },
  ]);

  const [senderId, setSenderId] = useState("muskan");
  const [receiverId, setReceiverId] = useState("dan");



  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const bottomRef = useRef(null);
  const [typingUser, setTypingUser] = useState(null);
  const typingTimeoutRef = useRef(null);

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
    socket.on("typing", ({ senderId }) => {
      setTypingUser(senderId);
    });


    socket.on("stop_typing", () => {
      setTypingUser(null);
    });

    socket.emit("join", senderId);

    socket.on("new_message", (msg) => {
      if (
        msg.senderId === senderId ||
        msg.senderId === receiverId
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    });
    loadMessages();

    return () => {
      socket.off("new_message");
      socket.off("typing");
      socket.off("stop_typing");
    };
  }, [senderId, receiverId]);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    // Clear typing timeout and emit stop_typing
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket.emit("stop_typing", { senderId, receiverId });

    const payload = {
      senderId,
      receiverId,
      content: message,
      timestamp: new Date().toISOString(),
      status: "sent", // sent | delivered | read
    };


    try {
      await api.post("/send-message", payload);
      setMessages((prev) => [...prev, payload]);
      setMessage("");
    } catch (err) {
      console.error("Send failed", err);
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (e.target.value === "") {
      console.log("🛑 emitting stop_typing (empty)");
      socket.emit("stop_typing", { senderId, receiverId });
    } else {
      console.log("⌨️ emitting typing");
      socket.emit("typing", { senderId, receiverId });

      // Set timeout to emit stop_typing after 2 seconds of no typing
      typingTimeoutRef.current = setTimeout(() => {
        console.log("🛑 emitting stop_typing (timeout)");
        socket.emit("stop_typing", { senderId, receiverId });
      }, 2000);
    }
  };

  const formatDateLabel = (date) => {
    const msgDate = new Date(date);
    const today = new Date();

    const isToday =
      msgDate.toDateString() === today.toDateString();

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isYesterday =
      msgDate.toDateString() === yesterday.toDateString();

    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";

    return msgDate.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <>
      <div style={{ position: "fixed", top: "20px", left: "20px", zIndex: 100 }}>
        <select
          value={senderId}
          onChange={(e) => setSenderId(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            fontSize: "14px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          }}
        >
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.page}>
        <div style={styles.app}>
          {/* Sidebar */}
          <div style={styles.sidebar}>
            <div style={styles.sidebarHeader}>Chats</div>
            {users
              .filter((u) => u.id !== senderId)
              .map((user) => (
                <div
                  key={user.id}
                  onClick={() => setReceiverId(user.id)}
                  style={{
                    ...styles.userItem,
                    background:
                      receiverId === user.id ? "#1e293b" : "transparent",
                  }}
                >
                  <div style={styles.avatar}>{user.name[0]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={styles.username}>{user.name}</div>
                    <div
                      style={{
                        fontSize: 12,
                        color: user.online ? "#22c55e" : "#94a3b8",
                      }}
                    >
                      {user.online ? "Online" : "Offline"}
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {/* Chat Area */}
          <div style={styles.chatArea}>
            <div style={styles.header}>
              ConvoFlow — chatting with {receiverId}
            </div>

            <div style={styles.messages}>
              {messages.map((m, i) => {
                const isMe = m.senderId === senderId;
                const prevMsg = messages[i - 1];

                const showDate =
                  !prevMsg ||
                  new Date(prevMsg.timestamp).toDateString() !==
                  new Date(m.timestamp).toDateString();

                return (
                  <div key={i}>
                    {showDate && (
                      <div style={styles.dateSeparator}>
                        {formatDateLabel(m.timestamp)}
                      </div>
                    )}

                    <div
                      style={{
                        display: "flex",
                        justifyContent: isMe ? "flex-end" : "flex-start",
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          ...styles.bubble,
                          background: isMe ? "#349c21ff" : "#ffffff",
                        }}
                      >
                        {m.content}
                        <div style={styles.meta}>
                          {new Date(m.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {isMe && (
                            <span style={styles.tick}>
                              {m.status === "read" ? "✓✓" : "✓"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {typingUser && typingUser !== senderId && (
              <div style={styles.typing}>
                {typingUser} is typing…
              </div>
            )}

            <div style={styles.inputBar}>
              <input
                value={message}
                onChange={handleTyping}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Type a message…"
                style={styles.input}
              />
              <button onClick={sendMessage} style={styles.button}>
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </>

  );
}

export default App;

const styles = {
  page: {
    height: "100vh",
    background: "#e5ddd5",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  app: {
    display: "flex",
    height: "90vh",
    width: 900,
    borderRadius: 12,
    overflow: "hidden",
    background: "#0f172a",
    boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
  },
  sidebar: {
    width: 280,
    background: "#020617",
    color: "#fff",
    padding: 16,
    display: "flex",
    flexDirection: "column",
  },
  sidebarHeader: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 16,
  },
  userItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 10,
    borderRadius: 10,
    cursor: "pointer",
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "#334155",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 600,
  },
  username: {
    fontWeight: 500,
  },
  chatArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "#f8fafc",
  },
  header: {
    padding: "12px 16px",
    background: "#075e54",
    color: "#fff",
    fontWeight: "bold",
  },
  messages: {
    flex: 1,
    padding: 12,
    overflowY: "auto",
  },
  bubble: {
    maxWidth: "65%",
    padding: "10px 14px",
    borderRadius: 16,
    fontSize: 14,
    lineHeight: "1.4",
    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
  },
  dateSeparator: {
    textAlign: "center",
    margin: "12px 0",
    fontSize: 12,
    color: "#667781",
  },
  meta: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 4,
    fontSize: 10,
    opacity: 0.6,
    marginTop: 4,
  },
  tick: {
    fontSize: 12,
  },
  inputBar: {
    display: "flex",
    gap: 10,
    padding: 14,
    background: "#ffffff",
    borderTop: "1px solid #e5e7eb",
  },
  input: {
    flex: 1,
    padding: "12px 16px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    outline: "none",
    fontSize: 14,
  },
  button: {
    padding: "0 16px",
    borderRadius: 20,
    border: "none",
    background: "#005c4b",
    color: "white",
    cursor: "pointer",
  },
  typing: {
    fontSize: 12,
    color: "#667781",
    marginLeft: 12,
    marginBottom: 4,
  },
};