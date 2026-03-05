import React from 'react';

const Sidebar = ({ users, senderId, receiverId, onSelectUser, onSenderChange, styles }) => {
    const currentUser = users.find(u => u.id === senderId);

    return (
        <div style={styles.sidebar}>
            <div style={styles.sidebarHeader}>ConvoFlow</div>

            {/* Profile Section */}
            <div style={{ padding: "12px 20px", marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 700, letterSpacing: "0.05em", marginBottom: 8 }}>
                    YOUR ACCOUNT
                </div>
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px",
                    background: "var(--bg-surface-light)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--glass-border)"
                }}>
                    <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: "var(--primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        color: "white",
                        fontSize: 14
                    }}>
                        {currentUser?.name[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                        <select
                            value={senderId}
                            onChange={(e) => onSenderChange(e.target.value)}
                            style={{
                                background: "transparent",
                                border: "none",
                                color: "var(--text-main)",
                                fontSize: 14,
                                fontWeight: 600,
                                width: "100%",
                                outline: "none",
                                cursor: "pointer"
                            }}
                        >
                            {users.map(u => (
                                <option key={u.id} value={u.id} style={{ background: "var(--bg-surface)" }}>
                                    {u.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 700, letterSpacing: "0.05em", padding: "0 22px 12px 22px" }}>
                CHATS
            </div>

            <div style={{ flex: 1, overflowY: "auto" }}>
                {users
                    .filter((u) => u.id !== senderId)
                    .map((user) => (
                        <div
                            key={user.id}
                            onClick={() => onSelectUser(user.id)}
                            style={{
                                ...styles.userItem,
                                background: receiverId === user.id ? "var(--bg-surface-light)" : "transparent",
                                border: receiverId === user.id ? "1px solid var(--glass-border)" : "1px solid transparent",
                            }}
                        >
                            <div style={{ position: "relative" }}>
                                <div style={styles.avatar}>{user.name[0]}</div>
                                {user.online && (
                                    <div style={{
                                        position: "absolute",
                                        bottom: 2,
                                        right: 2,
                                        width: 12,
                                        height: 12,
                                        borderRadius: "50%",
                                        background: "#10b981",
                                        border: "2px solid var(--bg-surface)",
                                        boxShadow: "0 0 8px rgba(16, 185, 129, 0.5)"
                                    }} />
                                )}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={styles.username}>{user.name}</div>
                                <div
                                    style={{
                                        fontSize: 12,
                                        fontWeight: 500,
                                        color: user.online ? "var(--primary)" : "var(--text-dim)",
                                        marginTop: 2
                                    }}
                                >
                                    {user.online ? "Active Now" : "Offline"}
                                </div>
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
};



export default Sidebar;
