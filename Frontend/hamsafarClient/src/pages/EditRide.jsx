import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const EditRide = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ride, setRide] = useState(null);

  useEffect(() => {
    const fetchRide = async () => {
      try {
        const res = await api.get(`/rides/${id}`);
        setRide(res.data.ride);
      } catch (err) {
        alert('Could not fetch ride', err);
      }
    };

    fetchRide();
  }, [id]);

  const handleChange = (e) => {
    setRide({ ...ride, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/rides/${id}`, ride);
      alert('Ride updated');
      navigate('/my-rides');
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    }
  };

  if (!ride) return <p className="text-center mt-10 text-gray-600">Loading...</p>;

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow-lg rounded-2xl">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">✏️ Edit Ride</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="from"
          value={ride.from}
          onChange={handleChange}
          required
          placeholder="From"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          name="to"
          value={ride.to}
          onChange={handleChange}
          required
          placeholder="To"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="date"
          name="date"
          value={ride.date.slice(0, 10)}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="time"
          name="time"
          value={ride.time}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="number"
          name="price"
          value={ride.price}
          onChange={handleChange}
          required
          placeholder="Price"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="number"
          name="seats"
          value={ride.seats}
          onChange={handleChange}
          required
          placeholder="Seats"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-200"
        >
          ✅ Update Ride
        </button>
      </form>
    </div>
  );
};

export default EditRide;
