import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const MyRides = () => {
  const [rides, setRides] = useState([]);

  useEffect(() => {
    const fetchRides = async () => {
      try {
        const res = await api.get('/rides');
        setRides(res.data.rides);
      } catch (err) {
        alert(err.response?.data?.message || 'Could not fetch rides');
      }
    };
    fetchRides();
  }, []);

  const deleteRide = async (rideId) => {
    if (!confirm('Are you sure you want to delete this ride?')) return;
    try {
      await api.delete(`/rides/${rideId}`);
      setRides(prev => prev.filter(r => r.id !== rideId));
      alert('Ride deleted');
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleBookingAction = async (bookingId, action) => {
    try {
      await api.patch(`/bookings/${bookingId}/${action}`);
      setRides((prev) =>
        prev.map((ride) => ({
          ...ride,
          bookings: ride.bookings.map((b) =>
            b.id === bookingId ? { ...b, status: action.toUpperCase() } : b
          ),
        }))
      );
      alert(`Booking ${action}ed`);
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${action} booking`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h2 className="text-3xl font-bold mb-6 text-center">🚗 My Rides</h2>

      {rides.length === 0 ? (
        <p className="text-gray-600 text-center">You haven't created any rides yet.</p>
      ) : (
        <div className="space-y-6">
          {rides.map((ride) => (
            <div className="bg-white shadow-md rounded-2xl p-6 border border-gray-200" key={ride.id}>
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h3 className="text-xl font-semibold">
                    {ride.from} → {ride.to}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date(ride.date).toLocaleDateString()} @ {ride.time}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">
                    {ride.price} so'm
                  </p>
                  <p className="text-sm text-gray-500">
                    Seats: {ride.bookings?.filter(b => b.status === 'ACCEPTED').length || 0}/{ride.seats}
                  </p>

                </div>
              </div>

              {ride.bookings?.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Passengers:</h4>
                  <ul className="space-y-2 pl-4 list-disc text-gray-700">
                    {ride.bookings.map((b) => (
                      <li key={b.id}>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                          <span>{b.user?.name}</span>
                          <span className="text-sm font-semibold">Status: {b.status}</span>
                        </div>

                        {/* Show phone number only if booking is accepted */}
                        {b.status === 'ACCEPTED' && b.user?.phone && (
                          <div className="text-sm text-gray-600">📞 {b.user.phone}</div>
                        )}

                        {/* Action buttons for pending bookings */}
                        {b.status === 'PENDING' && (
                          <div className="mt-2 flex gap-2">
                            <button
                              onClick={() => handleBookingAction(b.id, 'accept')}
                              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleBookingAction(b.id, 'reject')}
                              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-4 flex space-x-4">
                <Link
                  to={`/edit-ride/${ride.id}`}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  Edit
                </Link>
                <Link
                  to={`/rides/${ride.id}`}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                >
                  View
                </Link>
                <button
                  onClick={() => deleteRide(ride.id)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRides;
