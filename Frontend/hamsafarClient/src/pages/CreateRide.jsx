import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const CreateRide = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    from: '',
    to: '',
    date: '',
    time: '',
    price: '',
    seats: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      alert('You must be logged in to create a ride.');
      return;
    }

    if (user?.role !== 'DRIVER') {
      alert('Only drivers can create rides.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/rides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price),
          seats: parseInt(form.seats, 10),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Ride created successfully!');
        navigate('/');
      } else {
        alert(data.message || 'Failed to create ride');
      }
    } catch (error) {
      console.error('Ride creation error:', error);
      alert('Something went wrong while creating the ride.');
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-semibold mb-4">Create a Ride</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="from"
          value={form.from}
          placeholder="From"
          onChange={handleChange}
          required
          className="w-full border rounded px-3 py-2"
        />
        <input
          name="to"
          value={form.to}
          placeholder="To"
          onChange={handleChange}
          required
          className="w-full border rounded px-3 py-2"
        />
        <input
          name="date"
          type="date"
          value={form.date}
          onChange={handleChange}
          required
          className="w-full border rounded px-3 py-2"
        />
        <input
          name="time"
          type="time"
          value={form.time}
          onChange={handleChange}
          required
          className="w-full border rounded px-3 py-2"
        />
        <input
          name="price"
          type="number"
          value={form.price}
          placeholder="Price"
          onChange={handleChange}
          required
          className="w-full border rounded px-3 py-2"
        />
        <input
          name="seats"
          type="number"
          value={form.seats}
          placeholder="Seats"
          onChange={handleChange}
          required
          className="w-full border rounded px-3 py-2"
        />
        <button
          type="submit"
          className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Create Ride
        </button>
      </form>
    </div>
  );
};

export default CreateRide;
