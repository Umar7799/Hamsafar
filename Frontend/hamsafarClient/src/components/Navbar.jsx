// src/components/Navbar.jsx
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
              <Link to="/profile" className="hover:text-blue-600 font-medium">Profile</Link>
            </>
            )}
            {user.role === 'PASSENGER' && (
              <>
                <Link to="/search" style={styles.link}>Search Rides</Link>
                <Link to="/my-bookings" style={styles.link}>My Bookings</Link>
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
