import React from 'react';

const MessageInput = ({ message, onTyping, onSendMessage, styles }) => {
    return (
        <div style={styles.inputBar}>
            <input
                value={message}
                onChange={onTyping}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        onSendMessage();
                    }
                }}
                placeholder="Write your message..."
                style={styles.input}
            />
            <button
                onClick={onSendMessage}
                style={styles.button}
                className="send-button"
            >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
            </button>
        </div>
    );
};


export default MessageInput;
