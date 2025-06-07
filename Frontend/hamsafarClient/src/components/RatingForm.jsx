import React, { useState } from 'react';
import axios from 'axios';

const RatingForm = ({ rideId, toUserId, onRated }) => {
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await axios.post('/api/ratings', {
        rideId,
        toUserId,
        score,
        comment,
      });

      setSubmitted(true);
      if (onRated) onRated();
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to submit rating');
      }
    }
  };

  if (submitted) {
    return <p className="text-green-600">Thanks for your feedback!</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md p-4 border rounded shadow bg-white">
      <h3 className="text-lg font-semibold mb-2">Rate the user</h3>

      <label className="block mb-2">
        <span>Score:</span>
        <select
          value={score}
          onChange={(e) => setScore(Number(e.target.value))}
          className="mt-1 block w-full border rounded px-2 py-1"
          required
        >
          {[1, 2, 3, 4, 5].map((val) => (
            <option key={val} value={val}>
              {val} Star{val > 1 ? 's' : ''}
            </option>
          ))}
        </select>
      </label>

      <label className="block mb-2">
        <span>Comment (optional):</span>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="mt-1 block w-full border rounded px-2 py-1"
          rows={3}
        />
      </label>

      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      >
        Submit Rating
      </button>
    </form>
  );
};

export default RatingForm;
