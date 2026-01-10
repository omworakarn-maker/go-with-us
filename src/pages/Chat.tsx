import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { messagesAPI } from '../services/api';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface User {
    id: string;
    name: string;
    email: string;
}

interface Conversation {
    user: User;
    lastMessage: {
        id: string;
        content: string;
        createdAt: string;
        senderId: string;
    };
}

interface Message {
    id: string;
    content: string;
    senderId: string;
    recipientId?: string;
    createdAt: string;
    sender: { name: string };
}

const Chat: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const targetUserId = searchParams.get('userId'); // ?userId=... to start chat

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobileView(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Load Conversations List
    useEffect(() => {
        loadConversations();
    }, []);

    // If targetUserId is present (e.g. from profile or trip participant list)
    useEffect(() => {
        if (targetUserId) {
            startChatWithUser(targetUserId);
        }
    }, [targetUserId]);

    // Load Messages when active conversation changes
    useEffect(() => {
        if (activeConversation) {
            loadMessages(activeConversation.user.id);
            // Polling for real-time (simplified)
            const interval = setInterval(() => loadMessages(activeConversation.user.id), 3000);
            return () => clearInterval(interval);
        }
    }, [activeConversation]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadConversations = async () => {
        try {
            const data = await messagesAPI.getConversations();
            setConversations(data.conversations);
        } catch (error) {
            console.error('Failed to load conversations:', error);
        }
    };

    const loadMessages = async (userId: string) => {
        try {
            const data = await messagesAPI.getPrivateMessages(userId);
            setMessages(data.messages);
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    };

    const startChatWithUser = async (userId: string) => {
        // Check if conversation already exists in list
        const existing = conversations.find(c => c.user.id === userId);
        if (existing) {
            setActiveConversation(existing);
        } else {
            // If not in list, create a temporary conversation object
            // Ideally we should fetch user details first, but for MVP we might need an endpoint or pass name via state
            // For now, let's try to assume we can get it or reload conversations after sending first message
            // Wait, getPrivateMessages doesn't give us user info if no messages.

            // Hack: Just set active ID and let UI handle it?
            // Better: We need to fetch user info if not in list. 
            // Since we don't have getUserById API exposed yet, let's assume valid ID and we'll see empty chat
            // Adjust: Update backend or API to get user info. 
            // For MVP: Let's assume we clicked from a place that has user info (Participant List).
            // But URL param only has ID.

            // Workaround: Load messages. If there are messages, we get user info from message.sender/recipient
            try {
                const data = await messagesAPI.getPrivateMessages(userId);
                if (data.messages.length > 0) {
                    // Extract user info from messages
                    const firstMsg = data.messages[0];
                    const otherUser = firstMsg.senderId === user?.id ? firstMsg.recipient : firstMsg.sender;
                    setActiveConversation({
                        user: otherUser,
                        lastMessage: data.messages[data.messages.length - 1]
                    });
                } else {
                    // Empty chat. We need a way to show "New Chat" header.
                    // Let's create a dummy conversation for display
                    // We might need to pass name in URL too ?userId=123&name=John
                    const userName = searchParams.get('userName') || 'User';
                    setActiveConversation({
                        user: { id: userId, name: userName, email: '' },
                        lastMessage: { id: '', content: 'Start a conversation', createdAt: '', senderId: '' }
                    });
                }
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConversation) return;

        try {
            setLoading(true);
            await messagesAPI.sendPrivateMessage(activeConversation.user.id, newMessage);
            setNewMessage('');
            await loadMessages(activeConversation.user.id);
            await loadConversations(); // Refresh list order
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Navbar />

            <div className="flex-1 max-w-6xl mx-auto w-full pt-20 pb-4 px-4 flex gap-6 h-[calc(100vh-2rem)]">
                {/* Sidebar - Conversation List */}
                <div className={`w-full md:w-80 flex flex-col border-r border-gray-100 ${isMobileView && activeConversation ? 'hidden' : 'block'}`}>
                    <div className="py-4 px-2 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-2xl font-black">Messages</h2>
                    </div>
                    {/* Search Bar */}
                    <div className="p-2 border-b border-gray-100">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="ค้นหาบทสนทนา..."
                                className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-black outline-none transition-all"
                                onChange={(e) => {
                                    const query = e.target.value.toLowerCase();
                                    // Simple client-side filter for now
                                    const items = document.querySelectorAll('.conversation-item');
                                    items.forEach((item: any) => {
                                        const name = item.dataset.name?.toLowerCase() || '';
                                        if (name.includes(query)) {
                                            item.style.display = 'flex';
                                        } else {
                                            item.style.display = 'none';
                                        }
                                    });
                                }}
                            />
                            <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto no-scrollbar py-2">
                        {conversations.length === 0 ? (
                            <p className="text-center text-gray-400 mt-10 text-sm">ยังไม่มีข้อความ</p>
                        ) : (
                            conversations.map(conv => (
                                <button
                                    key={conv.user.id}
                                    onClick={() => setActiveConversation(conv)}
                                    className={`w-full text-left p-4 rounded-xl flex items-center gap-3 transition-all mb-2 conversation-item ${activeConversation?.user.id === conv.user.id
                                        ? 'bg-gray-50'
                                        : 'hover:bg-gray-50'
                                        }`}
                                    data-name={conv.user.name}
                                >
                                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg flex-shrink-0">
                                        {conv.user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-sm truncate">{conv.user.name}</h3>
                                        <p className="text-xs text-gray-500 truncate">{conv.lastMessage.content}</p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Window */}
                <div className={`flex-1 flex flex-col bg-gray-50 rounded-3xl overflow-hidden shadow-inner ${isMobileView && !activeConversation ? 'hidden' : 'flex'}`}>
                    {activeConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="bg-white p-4 border-b border-gray-100 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    {isMobileView && (
                                        <button onClick={() => setActiveConversation(null)} className="text-gray-500 hover:text-black">
                                            ←
                                        </button>
                                    )}
                                    <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold">
                                        {activeConversation.user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-bold">{activeConversation.user.name}</h3>
                                    </div>
                                </div>
                                <button
                                    onClick={async () => {
                                        if (window.confirm('คุณแน่ใจว่าต้องการลบประวัติการสนทนานี้?')) {
                                            try {
                                                await messagesAPI.deleteConversation(activeConversation.user.id);
                                                setActiveConversation(null); // Close chat
                                                loadConversations(); // Refresh list
                                            } catch (error) {
                                                console.error('Failed to delete conversation:', error);
                                                alert('ไม่สามารถลบการสนทนาได้');
                                            }
                                        }
                                    }}
                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
                                    title="ลบแชท"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {messages.map(msg => {
                                    const isMe = msg.senderId === user.id;
                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group hover:z-10 relative items-center gap-2`}>
                                            {/* Unsend Button (Only for me and on hover) */}
                                            {isMe && (
                                                <button
                                                    onClick={async () => {
                                                        if (window.confirm('ยกเลิกข้อความนี้?')) {
                                                            try {
                                                                await messagesAPI.deleteMessage(msg.id);
                                                                setMessages(prev => prev.filter(m => m.id !== msg.id));
                                                            } catch (error) {
                                                                console.error('Failed to delete message:', error);
                                                            }
                                                        }
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-500 transition-all scale-90 hover:scale-110"
                                                    title="ยกเลิกข้อความ"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            )}

                                            <div className={`max-w-[70%] px-5 py-3 rounded-2xl text-sm ${isMe
                                                ? 'bg-black text-white rounded-br-sm'
                                                : 'bg-white text-gray-800 shadow-sm rounded-bl-sm'
                                                }`}>
                                                <p>{msg.content}</p>
                                                <p className={`text-[9px] mt-1 text-right ${isMe ? 'text-gray-400' : 'text-gray-400'}`}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-4 bg-white border-t border-gray-100">
                                <form onSubmit={handleSendMessage} className="flex gap-3">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="พิมพ์ข้อความ..."
                                        className="flex-1 px-6 py-3 bg-gray-50 rounded-full focus:outline-none focus:bg-white focus:ring-2 focus:ring-black/5 transition-all"
                                        disabled={loading}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim() || loading}
                                        className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 disabled:opacity-50 transition-all font-bold"
                                    >
                                        ↑
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
                            <div className="mb-4">
                                <svg className="w-24 h-24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                                </svg>
                            </div>
                            <p className="font-bold text-gray-400">เลือกบทสนทนาเพื่อเริ่มคุย</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Chat;
