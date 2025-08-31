import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import socket from '../socket';

const Chats = () => {
  const [conversations, setConversations] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  // 🔧 Helper: sort by last message timestamp
  const sortConversationsByLastMessage = useCallback((convos) => {
    return [...convos].sort((a, b) => {
      const aTime = new Date(a.messages?.[0]?.createdAt || 0).getTime();
      const bTime = new Date(b.messages?.[0]?.createdAt || 0).getTime();
      return bTime - aTime;
    });
  }, []);

  // ✅ useCallback to fix ESLint dependency warning
  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get('/conversations');
      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.conversations)
          ? res.data.conversations
          : [];

      setConversations(sortConversationsByLastMessage(data));
    } catch (err) {
      console.error('Error loading chats:', err);
    }
  }, [sortConversationsByLastMessage]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    const handleNewMessage = (msg) => {
      if (!msg?.conversationId) return;

      setConversations(prev => {
        const existingIndex = prev.findIndex(c => c.id === msg.conversationId);

        if (existingIndex === -1) {
          fetchConversations(); // fallback for unknown convo
          return prev;
        }

        const updatedConversations = prev.map(convo => {
          if (convo.id !== msg.conversationId) return convo;

          return {
            ...convo,
            messages: [msg, ...(convo.messages || [])],
            unreadCount:
              msg.sender.id !== user.id
                ? (convo.unreadCount || 0) + 1
                : convo.unreadCount || 0,
          };
        });

        // ✅ Apply sort again after updating
        return sortConversationsByLastMessage(updatedConversations);
      });

    };

    socket.on('new_message', handleNewMessage);
    return () => socket.off('new_message', handleNewMessage);
  }, [user, fetchConversations, sortConversationsByLastMessage]);

  const getOtherParticipant = (participants) =>
    participants.find(p => p.id !== user?.id);

  const handleChatClick = async (convoId, otherId) => {
    try {
      await api.post(`/conversations/${convoId}/mark-as-read`);

      setConversations(prev =>
        prev.map(c =>
          c.id === convoId ? { ...c, unreadCount: 0 } : c
        )
      );

      window.dispatchEvent(new Event('messagesRead'));
      navigate(`/messages/${otherId}`);
    } catch (err) {
      console.error('Failed to mark conversation as read:', err);
      navigate(`/messages/${otherId}`);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 font-sans">
      <h2 className="mb-6 text-2xl font-semibold text-[#075E54]">My Chats</h2>

      {conversations.length === 0 ? (
        <p className="text-gray-600">No conversations yet.</p>
      ) : (
        <ul className="space-y-4">
          {conversations.map(convo => {
            const other = getOtherParticipant(convo.participants || []);
            const lastMessage = convo.messages?.[0];

            return (
              <li
                key={convo.id}
                onClick={() => handleChatClick(convo.id, other?.id)}
                className="flex items-center p-4 bg-gray-100 rounded-lg shadow-sm hover:bg-gray-200 transition-colors cursor-pointer"
              >
                {/* Avatar */}
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center font-bold text-xl uppercase mr-4 select-none">
                  {other?.name?.charAt(0) || '?'}
                </div>

                <div className="flex-grow min-w-0">
                  <div className="block font-semibold text-[#075E54] text-lg truncate">
                    {other?.name || 'Unknown'}
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <p className="text-gray-700 text-sm truncate">
                      {lastMessage?.text || 'No messages yet.'}
                    </p>


                  </div>
                </div>

                {/* Timestamp */}
                <div>

                  <div className='flex justify-center'>
                    {convo.unreadCount > 0 && (
                      <span className="text-xs py-0.5 px-1.5 font-bold text-white bg-red-600 rounded-full">
                        {convo.unreadCount}
                      </span>
                    )}
                  </div>

                  <div className="pt-4 text-gray-500 text-xs whitespace-nowrap">
                    {lastMessage?.createdAt
                      ? new Date(lastMessage.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                      : ''}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Chats;
