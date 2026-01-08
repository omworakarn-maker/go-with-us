import React, { useState, useEffect, useRef } from 'react';
import { Message } from '../types';
import { messagesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface GroupChatProps {
    tripId: string;
    tripTitle: string;
    onClose?: () => void;
    embedded?: boolean;
}

export const GroupChat: React.FC<GroupChatProps> = ({ tripId, tripTitle, onClose, embedded = false }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch messages
    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds
        return () => clearInterval(interval);
    }, [tripId]);

    // Auto scroll to bottom
    useEffect(() => {
        if (!isMinimized) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isMinimized]);

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const response = await messagesAPI.getTripMessages(tripId);
            setMessages(response.messages || []);
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        try {
            setSending(true);
            await messagesAPI.sendTripMessage(tripId, newMessage.trim());
            setNewMessage('');
            await fetchMessages(); // Refresh messages
        } catch (error: any) {
            console.error('Failed to send message:', error);
            alert(error.message || 'ไม่สามารถส่งข้อความได้');
        } finally {
            setSending(false);
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    };

    // Minimized View - Small bar at bottom right
    if (isMinimized) {
        return (
            <div
                className="fixed bottom-4 right-4 z-50 bg-black text-white px-6 py-3 rounded-full shadow-2xl cursor-pointer hover:bg-gray-800 transition-all flex items-center gap-3 animate-in slide-in-from-bottom-2"
                onClick={() => setIsMinimized(false)}
            >
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-bold text-sm">แชทกลุ่ม ({messages.length})</span>
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                </svg>
            </div>
        );
    }

    const chatContent = (
        <div className={`flex flex-col bg-white ${embedded ? 'h-[600px] rounded-3xl border border-gray-100 shadow-sm' : 'w-full max-w-2xl h-[600px] rounded-3xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300'}`}>
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b border-gray-100 bg-black text-white ${embedded ? 'rounded-t-3xl' : 'rounded-t-3xl'}`}>
                <div>
                    <h2 className="text-xl font-bold">แชทกลุ่ม</h2>
                    <p className="text-sm text-gray-300 mt-1">{tripTitle}</p>
                </div>
                {!embedded && onClose && (
                    <div className="flex items-center gap-2">
                        {/* Minimize Button */}
                        <button
                            onClick={() => setIsMinimized(true)}
                            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-800 transition-colors"
                            title="ย่อหน้าต่าง"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                            </svg>
                        </button>
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-800 transition-colors"
                            title="ปิด"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {loading && messages.length === 0 && (
                    <div className="flex items-center justify-center py-8">
                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {messages.length === 0 && !loading && (
                    <div className="text-center py-8 text-gray-400">
                        <p>ยังไม่มีข้อความในกลุ่ม</p>
                        <p className="text-sm mt-1">เริ่มต้นการสนทนาเลย!</p>
                    </div>
                )}

                {messages.map((message) => {
                    const isOwnMessage = message.senderId === user?.id;
                    return (
                        <div
                            key={message.id}
                            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                                {!isOwnMessage && (
                                    <span className="text-[10px] text-gray-500 mb-1 px-2">{message.sender.name}</span>
                                )}
                                <div
                                    className={`rounded-2xl px-4 py-2 ${isOwnMessage
                                        ? 'bg-black text-white'
                                        : 'bg-gray-100 text-gray-900'
                                        }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                                    <span
                                        className={`text-[9px] mt-1 block text-right opacity-60`}
                                    >
                                        {formatTime(message.createdAt)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className={`p-4 border-t border-gray-100 ${embedded ? 'rounded-b-3xl' : 'rounded-b-3xl'}`}>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="พิมพ์ข้อความ..."
                        className="flex-1 px-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:border-black text-sm"
                        disabled={sending}
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="w-12 h-12 flex items-center justify-center bg-black text-white rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {sending ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );

    if (embedded) {
        return chatContent;
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in duration-200">
            {chatContent}
        </div>
    );
};
