import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useEffect, useState } from 'react';
import api from '../api/axios'; // Make sure this exists and is configured
import socket from '../socket'; // <-- added import

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    if (!user) return;
  
    const fetchUnread = async () => {
      try {
        const res = await api.get('/conversations/unread-count');
        setUnreadCount(res.data.unreadCount || 0);
      } catch (err) {
        console.error('🔴 Failed to fetch unread count:', err);
      }
    };
  
    fetchUnread();
  
    const interval = setInterval(fetchUnread, 1000);
  
    const handleNewMessage = (msg) => {
      if (msg.sender.id !== user.id) {
        fetchUnread(); // update on new message
      }
    };
  
    const handleMessagesRead = () => {
      fetchUnread(); // 🔥 update when messages are marked as read
    };
  
    socket.on('new_message', handleNewMessage);
    window.addEventListener('messagesRead', handleMessagesRead); // ✅
  
    return () => {
      clearInterval(interval);
      socket.off('new_message', handleNewMessage);
      window.removeEventListener('messagesRead', handleMessagesRead); // ✅
    };
  }, [user]);
  

  return (
    <nav style={styles.navbar}>
      <Link to="/" style={styles.logo}>Hamsafar</Link>

      <div style={styles.links}>
        {user ? (
          <>
            {user.role === 'DRIVER' && (
              <>
                <Link to="/create-ride" style={styles.link}>Create Ride</Link>
                <Link to="/my-rides" style={styles.link}>My Rides</Link>

                <div className="relative">
                  <Link to="/chats" style={styles.link}>Chats</Link>
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>

                <Link to="/profile" className="hover:text-blue-600 font-medium">Profile</Link>
              </>
            )}
            {user.role === 'PASSENGER' && (
              <>
                <Link to="/search" style={styles.link}>Search Rides</Link>
                <Link to="/my-bookings" style={styles.link}>My Bookings</Link>

                <div className="relative">
                  <Link to="/chats" style={styles.link}>Chats</Link>
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>

                <Link to="/profile" className="hover:text-blue-600 font-medium">Profile</Link>
              </>
            )}

            <button onClick={handleLogout} style={styles.button}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" style={styles.link}>Login</Link>
            <Link to="/register" style={styles.link}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

const styles = {
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    backgroundColor: '#222',
    color: '#fff',
  },
  logo: {
    fontWeight: 'bold',
    fontSize: '1.3rem',
    color: '#fff',
    textDecoration: 'none',
  },
  links: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
  },
  link: {
    color: '#fff',
    textDecoration: 'none',
    position: 'relative',
  },
  button: {
    padding: '0.5rem 1rem',
    backgroundColor: '#f44336',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
};

export default Navbar;
