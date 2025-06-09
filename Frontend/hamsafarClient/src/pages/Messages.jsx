import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';

const Messages = () => {
    const { otherUserId } = useParams();
    const { user } = useAuth();
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const scrollRef = useRef(null);

    // ✅ Initialize or get existing conversation
    useEffect(() => {
        const initConversation = async () => {
            if (!user?.id || !otherUserId) return;

            try {
                const res = await api.post('/conversations', {
                    participantIds: [
                        parseInt(user.id, 10),
                        parseInt(otherUserId, 10),
                    ],
                });
                setConversation(res.data);
            } catch (err) {
                console.error('🔴 initConversation error:', err);
                alert(err.response?.data?.message || 'Failed to create conversation');
            }
        };

        initConversation();
    }, [user, otherUserId]);

    // ✅ Fetch messages for this conversation
    useEffect(() => {
        const fetchMessages = async () => {
            if (!conversation?.id) return;

            try {
                const res = await api.get(`/conversations/${conversation.id}/messages`);
                setMessages(res.data);
                scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
            } catch (err) {
                console.error('🔴 fetchMessages error:', err);
                alert('Could not load messages');
            }
        };

        fetchMessages();
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [conversation]);

    // ✅ Send a message
    const handleSend = async () => {
        if (!text.trim() || !conversation?.id) return;

        try {
            const res = await api.post('/conversations/messages', {
                conversationId: conversation.id,
                text,
            });
            setMessages((prev) => [...prev, res.data]);
            setText('');
            scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
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
