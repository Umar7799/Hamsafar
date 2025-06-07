import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';

const BookingDetail = () => {

  const { user } = useAuth();


  const { rideId } = useParams();
  const [ride, setRide] = useState(null);
  const [driverRating, setDriverRating] = useState(null); // { rating, comment }





  useEffect(() => {
    const fetchRide = async () => {
      try {
        const res = await api.get(`/rides/${rideId}`);
        setRide(res.data.ride);

        const ratings = res.data.ride.ratings || [];
        const driverRating = ratings.find(r => r.toUserId === res.data.ride.driver.id);
        if (driverRating) {
          setDriverRating({ rating: driverRating.score, comment: driverRating.comment });
        }
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to load ride');
      }
    };

    fetchRide();
  }, [rideId]);

  const handleRateDriver = async (rating, comment) => {
    try {
      await api.post('/ratings', {
        toUserId: ride.driver.id,
        rideId: ride.id,
        score: Number(rating),
        comment,
      });
      setDriverRating({ rating, comment });
      alert('Driver rated successfully.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to rate driver');
    }
  };

  const hasAcceptedBooking = ride?.bookings?.some(
    b => b.user.id === user?.id && b.status === 'ACCEPTED'
  );
  



  if (!ride) return <p className="text-center mt-10 text-gray-500">Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto py-10 px-6 bg-white shadow-xl rounded-2xl">
      <h1 className="text-3xl font-bold text-center text-blue-700 mb-6">
        {ride.from} → {ride.to}
      </h1>

      <div className="space-y-4 text-gray-700 text-lg">
        <p><span className="font-semibold">🗓 Date:</span> {ride.date.slice(0, 10)} at {ride.time}</p>
        <p><span className="font-semibold">💰 Price:</span> {ride.price} so'm</p>
        <p><span className="font-semibold">🪑 Seats:</span> {ride.bookings.length} / {ride.seats}</p>

        {hasAcceptedBooking && (
          <div className="border-t pt-4">
            <p className="font-semibold text-gray-800 mb-1">⭐ Rate Your Driver:</p>
            {driverRating ? (
              <p className="text-green-700">You rated: {driverRating.rating} ⭐ — {driverRating.comment}</p>
            ) : (
              <form
                onSubmit={e => {
                  e.preventDefault();
                  const form = e.target;
                  const rating = form.rating.value;
                  const comment = form.comment.value.trim();
                  handleRateDriver(rating, comment);
                }}
                className="flex flex-col gap-2 max-w-sm"
              >
                <select name="rating" required className="px-2 py-1 border rounded">
                  <option value="">Rate</option>
                  {[1, 2, 3, 4, 5].map(star => (
                    <option key={star} value={star}>{star} ⭐</option>
                  ))}
                </select>
                <input
                  name="comment"
                  type="text"
                  placeholder="Optional comment"
                  className="px-2 py-1 border rounded"
                />
                <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 text-sm">
                  Submit Rating
                </button>
              </form>
            )}
          </div>
        )}




        <div className="border-t pt-4">
          <p className="font-semibold text-gray-800 mb-1">👨‍✈️ Driver Information:</p>
          <p><span className="font-medium">Name:</span> {ride.driver.name}</p>
          <p><span className="font-medium">Email:</span> {ride.driver.email}</p>
          <p><span className="font-medium">Phone:</span> {ride.driver.phone}</p>
        </div>

        {ride.bookings.length > 0 && (
          <div className="border-t pt-4">
            <p className="font-semibold text-gray-800 mb-2">🧍‍♂️ Passengers:</p>
            <ul className="space-y-3">
              {ride.bookings.map((booking) => (
                <li
                  key={booking.id}
                  className="border border-gray-200 rounded-lg p-3 bg-gray-50 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${booking.user.name}`}
                      alt="Passenger avatar"
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-medium text-gray-800">{booking.user.name}</p>
                      <p className="text-sm text-gray-500">{booking.user.email}</p>
                      <p className="text-sm text-gray-500">{booking.user.phone}</p>
                    </div>
                    <span className={`ml-auto px-3 py-1 text-sm rounded-full 
                      ${booking.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                        booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'}`}>
                      {booking.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingDetail;
