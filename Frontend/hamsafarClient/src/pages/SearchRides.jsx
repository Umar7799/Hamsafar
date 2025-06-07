import { useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';

const SearchRides = () => {
    const [form, setForm] = useState({
        from: '',
        to: '',
        dateFrom: '',
        dateTo: '',
        priceMin: '',
        priceMax: ''
    });

    const [rides, setRides] = useState([]);
    const { user } = useAuth();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const searchRides = async (e) => {
        e.preventDefault();
        try {
            const res = await api.get('/rides/search', { params: form });
            setRides(res.data.rides);
        } catch (err) {
            alert(err.response?.data?.message || 'Search failed');
        }
    };

    const bookRide = async (rideId) => {
        try {
            await api.post('/bookings', { rideId });
            alert('Booked successfully!');
        } catch (err) {
            alert(err.response?.data?.message || 'Booking failed');
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-4">
            <h2 className="text-2xl font-bold mb-4">Search Rides</h2>
            <form onSubmit={searchRides} className="space-y-4 mb-6">
                <input
                    name="from"
                    placeholder="From"
                    value={form.from}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border rounded"
                />
                <input
                    name="to"
                    placeholder="To"
                    value={form.to}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border rounded"
                />
                <div className="flex gap-2">
                    <input
                        name="dateFrom"
                        type="date"
                        value={form.dateFrom}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                    />
                    <input
                        name="dateTo"
                        type="date"
                        value={form.dateTo}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                    />
                </div>
                <div className="flex gap-2">
                    <input
                        name="priceMin"
                        type="number"
                        placeholder="Min Price"
                        value={form.priceMin}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                    />
                    <input
                        name="priceMax"
                        type="number"
                        placeholder="Max Price"
                        value={form.priceMax}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                    />
                </div>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
                    Search
                </button>
            </form>

            {rides.length > 0 ? (
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Available Rides</h3>
                    {rides.map((ride) => {
                        const isFull = ride.bookings.length >= ride.seats;
                        return (
                            <li key={ride.id} className="border p-4 my-2 rounded shadow-sm list-none">
                                <strong>{ride.from} → {ride.to}</strong> on {ride.date.slice(0, 10)} at {ride.time} <br />
                                Price: {ride.price} so'm | Driver: {ride.driver.name} <br />
                                Seats: {ride.bookings.length} / {ride.seats} {isFull && <span style={{ color: 'red' }}> (Full)</span>}
                                <br />
                                {user?.role === 'PASSENGER' && (
                                    <button
                                        onClick={() => bookRide(ride.id)}
                                        disabled={isFull}
                                        style={{
                                            marginTop: '6px',
                                            padding: '6px 12px',
                                            backgroundColor: isFull ? 'gray' : '#4CAF50',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: isFull ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        {isFull ? 'Full' : 'Book'}
                                    </button>
                                )}
                            </li>
                        );
                    })}
                </div>
            ) : (
                <p>No rides found. Try searching above.</p>
            )}
        </div>
    );
};

export default SearchRides;
