import React from 'react';

const UserSwitcher = ({ users, senderId, onSenderChange }) => {
    return (
        <div style={{ position: "fixed", top: "20px", left: "20px", zIndex: 100 }}>
            <select
                value={senderId}
                onChange={(e) => onSenderChange(e.target.value)}
                style={{
                    padding: "10px 16px",
                    borderRadius: "var(--radius-md)",
                    background: "rgba(15, 23, 42, 0.8)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid var(--glass-border)",
                    color: "var(--text-main)",
                    fontSize: "13px",
                    fontWeight: 600,
                    boxShadow: "var(--glass-shadow)",
                    cursor: "pointer",
                    outline: "none"
                }}
            >
                {users.map((user) => (
                    <option key={user.id} value={user.id} style={{ background: "#0f172a" }}>
                        As: {user.name}
                    </option>
                ))}
            </select>
        </div>
    );
};


export default UserSwitcher;
