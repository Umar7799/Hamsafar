import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import RatingForm from '../components/RatingForm';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await api.get('/bookings/me');
        setBookings(res.data.bookings);
      } catch (err) {
        alert(err.response?.data?.message || 'Could not fetch bookings');
      }
    };

    if (user?.role === 'PASSENGER') {
      fetchBookings();
    }
  }, [user]);

  const cancelBooking = async (bookingId) => {
    if (!confirm('Cancel this booking?')) return;
    try {
      await api.delete(`/bookings/${bookingId}`);
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
      alert('Booking cancelled');
    } catch (err) {
      alert(err.response?.data?.message || 'Cancel failed');
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h2 className="text-3xl font-bold mb-6 text-center">📖 My Bookings</h2>
      {bookings.length === 0 ? (
        <p className="text-gray-600 text-center">No bookings yet.</p>
      ) : (
        <ul className="space-y-4">
          {bookings.map((b) => {

            return (
              <li
                key={b.id}
                className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm"
              >
                <div>
                  <strong>Route:</strong>{' '}
                  <Link
                    to={`/bookings/ride/${b.ride.id}`}
                    className="text-blue-600 underline"
                  >
                    {b.ride.from} → {b.ride.to}
                  </Link>
                </div>

                <div>
                  <strong>Date:</strong> {b.ride.date.slice(0, 10)} @ {b.ride.time}
                </div>
                <div>
                  <strong>Price:</strong> {b.ride.price} so'm
                </div>

                <div>
                  <strong>Driver:</strong>{' '}
                  {b.ride.driver?.name ?? <em className="text-gray-500">Not assigned</em>}
                  {b.status === 'ACCEPTED' && b.ride.driver?.phone && ` (${b.ride.driver.phone})`}
                </div>


                {b.status === 'ACCEPTED'
                  ? (
                    b.ride.driver?.id
                      ? <Link className='underline' to={`/messages/${b.ride.driver.id}`}>💬 Message Driver</Link>
                      : <div className="text-sm text-red-600">No driver ID</div>
                  )
                  : <div className="text-sm text-gray-400">Not accepted</div>
                }




                <div className="mt-2">
                  <strong>Status:</strong>{' '}
                  <span
                    className={
                      'inline-block px-2 py-1 rounded text-sm font-medium ' +
                      (b.status === 'ACCEPTED'
                        ? 'bg-green-100 text-green-800'
                        : b.status === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800')
                    }
                  >
                    {b.status}
                  </span>
                </div>

                <button
                  onClick={() => cancelBooking(b.id)}
                  className="mt-3 bg-red-500 hover:bg-red-600 text-white py-1 px-4 rounded-lg transition"
                >
                  Cancel Booking
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default MyBookings;
