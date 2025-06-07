import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Welcome, {user?.name}!</h1>
      <ul className='my-4'>
        <li className='underline'>
          <Link to="/search">Search Rides</Link>
        </li>
        <li className='underline'>
          <Link to="/my-bookings">My Bookings</Link>
        </li>
      </ul>

      {user?.role === 'DRIVER' && (
        <>
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={() => navigate('/create-ride')}>
            + Create Ride</button>
        </>

      )}

      {/* Show rides or other homepage stuff here */}
    </div>
  );
};

export default Home;
