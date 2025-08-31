import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import socket from '../socket';

// ✅ NEW: import useNotification
import { useNotification } from '../context/useNotification';

const Messages = () => {
    const { otherUserId } = useParams();
    const { user } = useAuth();
    const { fetchUnreadCount } = useNotification(); // ✅ NEW

    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [typingUser, setTypingUser] = useState(false);
    const scrollRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    useEffect(() => {
        if (user?.id) {
            socket.emit('join_user_room', user.id);
        }
    }, [user]);

    useEffect(() => {
        const initConversation = async () => {
            if (!user?.id || !otherUserId) return;

            try {
                const res = await api.post('/conversations', {
                    participantIds: [parseInt(user.id, 10), parseInt(otherUserId, 10)],
                });
                setConversation(res.data);
            } catch (err) {
                console.error('🔴 initConversation error:', err);
                alert(err.response?.data?.message || 'Failed to create conversation');
            }
        };

        initConversation();
    }, [user, otherUserId]);

    useEffect(() => {
        const fetchMessages = async () => {
            if (!conversation?.id) return;

            try {
                const res = await api.get(`/conversations/${conversation.id}/messages`);
                setMessages(res.data);
                scrollRef.current?.scrollIntoView({ behavior: 'smooth' });

                // ✅ NEW: Mark as read and update unread count
                await api.post(`/conversations/${conversation.id}/mark-as-read`);
                fetchUnreadCount(); // ✅
            } catch (err) {
                console.error('🔴 fetchMessages error:', err);
                alert('Could not load messages');
            }
        };

        fetchMessages();
    }, [conversation, fetchUnreadCount]); // ✅ Add dependency

    useEffect(() => {
        if (!conversation?.id) return;

        socket.emit('join_conversation', conversation.id);

        const handleNewMessage = async (msg) => {
            setMessages((prev) => [...prev, msg]);
            scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
          
            // 🔥 If message is from the other user, mark as read immediately
            if (msg.sender.id !== user?.id) {
              try {
                await api.post(`/conversations/${conversation.id}/mark-as-read`);
                fetchUnreadCount(); // ✅ Update navbar
                window.dispatchEvent(new Event('messagesRead')); // ✅ in case Chats.jsx listens
              } catch (err) {
                console.error('Failed to mark as read:', err);
              }
            }
          };
          

        const handleTyping = ({ userId }) => {
            if (userId !== user?.id) setTypingUser(true);
        };

        const handleStopTyping = ({ userId }) => {
            if (userId !== user?.id) setTypingUser(false);
        };

        socket.on('new_message', handleNewMessage);
        socket.on('typing', handleTyping);
        socket.on('stop_typing', handleStopTyping);

        return () => {
            socket.off('new_message', handleNewMessage);
            socket.off('typing', handleTyping);
            socket.off('stop_typing', handleStopTyping);
            socket.emit('leave_conversation', conversation.id);
        };
    }, [conversation, user, fetchUnreadCount]); // ✅ Add dependency

    useEffect(() => {
        if (!conversation?.id || !user?.id) return;

        const handleTyping = () => {
            socket.emit('typing', { conversationId: conversation.id, userId: user.id });

            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                socket.emit('stop_typing', { conversationId: conversation.id, userId: user.id });
            }, 1500);
        };

        const handleKeyDown = () => handleTyping();

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            clearTimeout(typingTimeoutRef.current);
        };
    }, [conversation, user]);

    const handleSend = async () => {
        if (!text.trim() || !conversation?.id) return;

        try {
            await api.post('/conversations/messages', {
                conversationId: conversation.id,
                text,
            });
            setText('');
        } catch (err) {
            console.error('🔴 handleSend error:', err);
            alert('Message failed to send');
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            <h2 className="text-2xl font-bold mb-4">💬 Chat</h2>
            <div className="border rounded-lg h-[400px] overflow-y-auto p-4 bg-gray-50 space-y-2">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`p-2 max-w-[75%] rounded-lg ${
                            msg.sender.id === user.id
                                ? 'bg-blue-500 text-white ml-auto'
                                : 'bg-gray-200 text-gray-900'
                        }`}
                    >
                        <div className="text-sm">{msg.text}</div>
                    </div>
                ))}
                {typingUser && (
                    <div className="text-sm text-gray-500 mt-1">Typing...</div>
                )}
                <div ref={scrollRef} />
            </div>
            <div className="mt-4 flex">
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="flex-1 border px-3 py-2 rounded-l-lg"
                    placeholder="Type a message..."
                />
                <button
                    onClick={handleSend}
                    className="bg-blue-500 text-white px-4 rounded-r-lg hover:bg-blue-600"
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default Messages;
