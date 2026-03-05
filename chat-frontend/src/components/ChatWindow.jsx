import React from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

const ChatWindow = ({
  receiverId,
  messages,
  senderId,
  bottomRef,
  formatDateLabel,
  typingUser,
  message,
  onTyping,
  onSendMessage,
  styles
}) => {
  return (
    <div style={styles.chatArea}>
      <div style={styles.header}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "var(--bg-surface-light)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          fontWeight: 700,
          color: "var(--primary)",
          border: "1px solid var(--glass-border)"
        }}>
          {receiverId[0].toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{receiverId.charAt(0).toUpperCase() + receiverId.slice(1)}</div>
          <div style={{ fontSize: 11, color: "var(--primary)", display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--primary)", boxShadow: "0 0 6px var(--primary)" }}></span>
            SECURE CONNECTION
          </div>
        </div>
      </div>

      <MessageList
        messages={messages}
        senderId={senderId}
        bottomRef={bottomRef}
        formatDateLabel={formatDateLabel}
        styles={styles}
      />

      {typingUser && typingUser !== senderId && (
        <div style={styles.typing}>
          <span className="animate-pulse">{typingUser} is typing...</span>
        </div>
      )}

      <MessageInput
        message={message}
        onTyping={onTyping}
        onSendMessage={onSendMessage}
        styles={styles}
      />
    </div>
  );
};


export default ChatWindow;
