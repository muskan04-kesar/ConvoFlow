import React from 'react';

const MessageList = ({ messages, senderId, bottomRef, formatDateLabel, styles }) => {
    return (
        <div style={styles.messages}>
            {messages.map((m, i) => {
                const isMe = m.senderId === senderId;
                const prevMsg = messages[i - 1];

                const showDate =
                    !prevMsg ||
                    new Date(prevMsg.timestamp).toDateString() !==
                    new Date(m.timestamp).toDateString();

                return (
                    <div key={m.messageId || i} className="animate-fade-in">
                        {showDate && (
                            <div style={styles.dateSeparator}>
                                {formatDateLabel(m.timestamp)}
                            </div>
                        )}

                        <div
                            style={{
                                display: "flex",
                                justifyContent: isMe ? "flex-end" : "flex-start",
                                marginBottom: 12,
                            }}
                        >
                            <div
                                className={!isMe ? "glass" : ""}
                                style={{
                                    ...styles.bubble,
                                    background: isMe
                                        ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                                        : "rgba(30, 41, 59, 0.7)",
                                    color: "white",
                                    border: isMe ? "none" : "1px solid rgba(255, 255, 255, 0.1)",
                                    borderBottomRightRadius: isMe ? "4px" : "var(--radius-md)",
                                    borderBottomLeftRadius: !isMe ? "4px" : "var(--radius-md)",
                                }}
                            >
                                <div style={{ wordBreak: "break-word" }}>{m.content}</div>
                                <div
                                    style={{
                                        ...styles.meta,
                                        color: "rgba(255, 255, 255, 0.6)",
                                    }}
                                >
                                    {new Date(m.timestamp).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                    {isMe && (
                                        <span style={{ ...styles.tick, color: "#fff" }}>
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
    );
};

export default MessageList;
