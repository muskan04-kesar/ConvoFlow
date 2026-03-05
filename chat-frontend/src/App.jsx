import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { api } from "./api";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const socket = io(SOCKET_URL, {
  withCredentials: true,
  transports: ["websocket", "polling"],
});


function App() {
  const [users, setUsers] = useState([
    { id: "muskan", name: "Muskan", online: false },
    { id: "dan", name: "Dan", online: false },
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

  const senderIdRef = useRef(senderId);
  const receiverIdRef = useRef(receiverId);

  useEffect(() => {
    senderIdRef.current = senderId;
    receiverIdRef.current = receiverId;
  }, [senderId, receiverId]);

  const loadMessages = async () => {
    try {
      const res = await api.get(`/messages/${senderId}/${receiverId}`);
      setMessages(res.data);
    } catch (err) {
      console.error("Load failed", err);
    }
  };

  // Effect for User Status (Independent)
  useEffect(() => {
    socket.on("user_status", (onlineUserIds) => {
      setUsers((prev) =>
        prev.map((u) => ({ ...u, online: onlineUserIds.includes(u.id) }))
      );
    });
    return () => socket.off("user_status");
  }, []);

  // Effect for Chat Messages & Typing
  useEffect(() => {
    socket.on("typing", ({ senderId: typingSid }) => {
      const user = users.find((u) => u.id === typingSid);
      setTypingUser(user ? user.name : typingSid);
    });

    socket.on("stop_typing", () => {
      setTypingUser(null);
    });

    socket.emit("join", senderId);

    socket.on("new_message", (msg) => {
      if (!msg || !msg.content) return;

      const isRelevant =
        (msg.senderId === senderIdRef.current && msg.receiverId === receiverIdRef.current) ||
        (msg.senderId === receiverIdRef.current && msg.receiverId === senderIdRef.current);

      if (isRelevant) {
        setMessages((prev) => {
          const exists = prev.some(existing =>
            existing.messageId === msg.messageId ||
            (existing.content === msg.content && Math.abs(new Date(existing.timestamp) - new Date(msg.timestamp)) < 2000)
          );
          return exists ? prev : [...prev, msg];
        });
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

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket.emit("stop_typing", { senderId, receiverId });

    const payload = {
      messageId: crypto.randomUUID(),
      senderId,
      receiverId,
      content: message,
      timestamp: new Date().toISOString(),
      status: "sent",
    };

    try {
      setMessages((prev) => [...prev, payload]);
      setMessage("");
      await api.post("/send-message", payload);
    } catch (err) {
      console.error("Send failed", err);
    }
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    if (e.target.value === "") {
      socket.emit("stop_typing", { senderId, receiverId });
    } else {
      socket.emit("typing", { senderId, receiverId });
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stop_typing", { senderId, receiverId });
      }, 2000);
    }
  };

  const formatDateLabel = (date) => {
    const msgDate = new Date(date);
    const today = new Date();
    if (msgDate.toDateString() === today.toDateString()) return "Today";
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (msgDate.toDateString() === yesterday.toDateString()) return "Yesterday";
    return msgDate.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div style={styles.page}>
      <div style={styles.app}>
        <Sidebar
          users={users}
          senderId={senderId}
          receiverId={receiverId}
          onSelectUser={setReceiverId}
          onSenderChange={setSenderId}
          styles={styles}
        />
        <ChatWindow
          receiverId={receiverId}
          messages={messages}
          senderId={senderId}
          bottomRef={bottomRef}
          formatDateLabel={formatDateLabel}
          typingUser={typingUser}
          message={message}
          onTyping={handleTyping}
          onSendMessage={sendMessage}
          styles={styles}
        />
      </div>
    </div>
  );
}

export default App;

const styles = {
  page: {
    height: "100vh",
    width: "100vw",
    background: "var(--bg-deep)",
    display: "flex",
    overflow: "hidden",
  },
  app: {
    display: "flex",
    flex: 1,
    height: "100%",
    width: "100%",
    background: "var(--bg-surface)",
    position: "relative",
  },
  sidebar: {
    width: 320,
    background: "var(--bg-surface)",
    borderRight: "1px solid var(--glass-border)",
    color: "var(--text-main)",
    display: "flex",
    flexDirection: "column",
  },
  sidebarHeader: {
    padding: "24px 20px 12px 20px",
    fontSize: 24,
    fontWeight: 800,
    color: "var(--primary)",
    letterSpacing: "-0.03em",
  },
  userItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 18px",
    borderRadius: "var(--radius-md)",
    cursor: "pointer",
    margin: "0 8px 4px 8px",
    transition: "var(--transition)",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 600,
    color: "white",
    fontSize: 18,
    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)",
  },
  username: {
    fontWeight: 600,
    fontSize: 15,
  },
  chatArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "rgba(15, 23, 42, 0.4)",
    position: "relative",
  },
  header: {
    padding: "18px 24px",
    background: "var(--glass-bg)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid var(--glass-border)",
    color: "var(--text-main)",
    fontWeight: 600,
    fontSize: 16,
    display: "flex",
    alignItems: "center",
    gap: 12,
    zIndex: 10,
  },
  messages: {
    flex: 1,
    padding: "24px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  bubble: {
    maxWidth: "70%",
    padding: "12px 16px",
    borderRadius: "var(--radius-md)",
    fontSize: 14,
    lineHeight: "1.5",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    position: "relative",
  },
  dateSeparator: {
    textAlign: "center",
    margin: "24px 0",
    fontSize: 11,
    fontWeight: 700,
    color: "var(--text-dim)",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },
  meta: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 6,
    fontSize: 10,
    marginTop: 6,
    opacity: 0.8,
  },
  tick: {
    fontSize: 11,
    color: "var(--primary)",
    fontWeight: 700,
  },
  inputBar: {
    display: "flex",
    gap: 12,
    padding: "20px 24px",
    background: "rgba(15, 23, 42, 0.8)",
    backdropFilter: "blur(20px)",
    borderTop: "1px solid var(--glass-border)",
  },
  input: {
    flex: 1,
    padding: "14px 22px",
    borderRadius: "var(--radius-full)",
    background: "var(--bg-surface-light)",
    border: "1px solid var(--glass-border)",
    color: "var(--text-main)",
    outline: "none",
    fontSize: 14,
    transition: "var(--transition)",
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    border: "none",
    background: "var(--primary)",
    color: "white",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "var(--transition)",
    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
  },
  typing: {
    fontSize: 12,
    color: "var(--primary)",
    marginLeft: 24,
    marginBottom: 12,
    fontWeight: 500,
    fontStyle: "italic",
  },
};
