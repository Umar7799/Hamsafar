// src/pages/RideDetail.jsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';

const RideDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [ride, setRide] = useState(null);
    const [booked, setBooked] = useState(false);
    const [loading, setLoading] = useState(true);
    const [ratings, setRatings] = useState({}); // { [userId]: { rating, comment } }

    useEffect(() => {
        const fetchRide = async () => {
            try {
                const res = await api.get(`/rides/${id}`);
                setRide(res.data.ride);

                if (user?.role === 'PASSENGER') {
                    const bookings = res.data.ride.bookings || [];
                    const alreadyBooked = bookings.some(b => b.user.id === user.id);
                    setBooked(alreadyBooked);
                }

                const ratingsMap = {};
                (res.data.ride.ratings || []).forEach(r => {
                    ratingsMap[r.toUserId] = { rating: r.score, comment: r.comment };
                });
                setRatings(ratingsMap);
            } catch (err) {
                alert(err.response?.data?.message || 'Failed to load ride');
            } finally {
                setLoading(false);
            }
        };

        fetchRide();
    }, [id, user]);

    const handleBooking = async () => {
        try {
            await api.post(`/bookings`, { rideId: ride.id });
            setBooked(true);
            alert('Ride booked!');
        } catch (err) {
            alert(err.response?.data?.message || 'Booking failed');
        }
    };

    const handleCancel = async () => {
        try {
            const booking = ride.bookings.find(b => b.user.id === user.id);
            if (booking) {
                await api.delete(`/bookings/${booking.id}`);
                setBooked(false);
                alert('Booking canceled');
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Cancellation failed');
        }
    };

    const handleRemovePassenger = async (bookingId) => {
        if (!confirm('Are you sure you want to remove this passenger?')) return;

        try {
            await api.delete(`/bookings/${bookingId}`);
            setRide(prev => ({
                ...prev,
                bookings: prev.bookings.filter(b => b.id !== bookingId),
            }));
            alert('Passenger removed from the ride.');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to remove passenger');
        }
    };

    const handleRatePassenger = async (passengerId, rating, comment) => {
        const score = Number(rating); // Convert it to number explicitly
    
        console.log({ rideId: ride.id, toUserId: passengerId, score, comment });
    
        try {
            await api.post('/ratings', {
                toUserId: passengerId,
                rideId: ride.id,
                score, // ✅ send as "score", not "rating"
                comment,
            });
    
            setRatings(prev => ({
                ...prev,
                [passengerId]: { rating: score, comment },
            }));
    
            alert('Passenger rated successfully.');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to submit rating');
        }
    };
    

    if (loading) return <p className="text-center mt-10">Loading...</p>;
    if (!ride) return <p className="text-center text-red-500">Ride not found.</p>;

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <h2 className="text-3xl font-bold mb-4 text-center">🚗 Ride Details</h2>

            <div className="bg-white p-6 shadow-lg rounded-2xl border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-xl font-semibold">{ride.from} → {ride.to}</h3>
                        <p className="text-sm text-gray-500">
                            {new Date(ride.date).toLocaleDateString()} @ {ride.time}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-bold text-green-600">{ride.price} so'm</p>
                        <p className="text-sm text-gray-500">
                            Seats: {ride.bookings?.filter(b => b.status === 'ACCEPTED').length || 0}/{ride.seats}
                        </p>
                    </div>
                </div>

                <div className="mb-4">
                    <h4 className="font-medium text-gray-700">Driver</h4>
                    <div className="flex items-center gap-3 mt-1">
                        <img
                            src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${ride.driver.name}`}
                            alt="Driver avatar"
                            className="w-10 h-10 rounded-full"
                        />
                        <div>
                            <p className="font-medium">{ride.driver.name}</p>
                            <p className="text-sm text-gray-500">{ride.driver.email}</p>
                        </div>
                    </div>
                </div>

                {ride.bookings?.length > 0 && (
                    <div className="mb-4">
                        <h4 className="font-medium text-gray-700">Passengers</h4>
                        <ul className="list-disc pl-6 text-gray-700">
                            {ride.bookings
                                .filter((b) => b.status === 'ACCEPTED')
                                .map((b) => (
                                    <li key={b.id} className="mb-2">
                                        <div className="flex justify-between items-center">
                                            <span>{b.user.name} ({b.user.phone})</span>
                                            {user?.role === 'DRIVER' && (
                                                <button
                                                    onClick={() => handleRemovePassenger(b.id)}
                                                    className="ml-4 px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                        {user?.role === 'DRIVER' && !ratings[b.user.id] && (
                                            <div className="mt-2 ml-2">
                                                <form
                                                    onSubmit={e => {
                                                        e.preventDefault();
                                                        const form = e.target;
                                                        const rating = parseInt(form.rating.value);
                                                        const comment = form.comment.value.trim();
                                                        handleRatePassenger(b.user.id, rating, comment);
                                                    }}
                                                    className="flex flex-col gap-1"
                                                >
                                                    <select name="rating" required className="w-24 px-2 py-1 border rounded">
                                                        <option value="">Rate</option>
                                                        {[1, 2, 3, 4, 5].map(star => (
                                                            <option key={star} value={star}>{star} ⭐</option>
                                                        ))}
                                                    </select>
                                                    <input
                                                        type="text"
                                                        name="comment"
                                                        placeholder="Optional comment"
                                                        className="px-2 py-1 border rounded w-full"
                                                    />
                                                    <button
                                                        type="submit"
                                                        className="mt-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                                                    >
                                                        Submit Rating
                                                    </button>
                                                </form>
                                            </div>
                                        )}
                                        {ratings[b.user.id] && (
                                            <p className="text-sm text-green-600 ml-2">
                                                Rated: {ratings[b.user.id].rating} ⭐ - {ratings[b.user.id].comment}
                                            </p>
                                        )}
                                    </li>
                                ))}
                        </ul>
                    </div>
                )}

                {user?.role === 'PASSENGER' && (
                    <div className="mt-6">
                        {booked ? (
                            <button
                                onClick={handleCancel}
                                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                            >
                                Cancel Booking
                            </button>
                        ) : (
                            <button
                                onClick={handleBooking}
                                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                            >
                                Book Ride
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="mt-10 h-[300px] rounded-xl overflow-hidden">
                <MapContainer center={[41.3111, 69.2797]} zoom={6} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[41.3111, 69.2797]}>
                        <Popup>{ride.from} (Start)</Popup>
                    </Marker>
                    <Marker position={[40.3777, 71.7880]}>
                        <Popup>{ride.to} (Destination)</Popup>
                    </Marker>
                </MapContainer>
            </div>
        </div>
    );
};

export default RideDetail;
