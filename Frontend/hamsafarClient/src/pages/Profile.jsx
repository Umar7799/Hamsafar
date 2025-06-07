import { useAuth } from "../hooks/useAuth";
import { useEffect, useState } from "react";
import api from "../api/axios";

const Profile = () => {
  const { user } = useAuth();
  const [ratings, setRatings] = useState([]);

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const res = await api.get(`/ratings/user/${user.id}`);
        setRatings(res.data.ratings);
      } catch (err) {
        console.error("Failed to load ratings", err);
      }
    };

    if (user) {
      fetchRatings();
    }
  }, [user]);

  const averageRating =
    ratings.length > 0
      ? (ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length).toFixed(1)
      : null;

  if (!user) {
    return (
      <div className="max-w-xl mx-auto text-center py-10">
        <h2 className="text-xl text-gray-600">You must be logged in to view your profile.</h2>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-2xl p-6 mt-10">
      <h1 className="text-3xl font-bold text-blue-700 mb-6 text-center">👤 My Profile</h1>

      <div className="flex items-center gap-6 mb-6">
        <img
          src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${user.name}`}
          alt="Avatar"
          className="w-20 h-20 rounded-full shadow-md"
        />
        <div>
          <h2 className="text-xl font-semibold">{user.name}</h2>
          <p className="text-gray-500">{user.role}</p>
        </div>
      </div>

      <div className="space-y-4 text-gray-700">
        <p><span className="font-medium">📧 Email:</span> {user.email}</p>
        <p><span className="font-medium">📱 Phone:</span> {user.phone || "N/A"}</p>
        <p><span className="font-medium">🆔 User ID:</span> {user.id}</p>
        <p><span className="font-medium">🔐 Role:</span> <span className="uppercase">{user.role}</span></p>
      </div>

      {ratings.length > 0 && (
        <div className="mt-8 border-t pt-6">
          <h3 className="text-xl font-semibold mb-3 text-gray-800">⭐ Received Ratings</h3>
          <p className="text-gray-600 mb-4">Average: <strong>{averageRating} / 5</strong></p>
          <ul className="space-y-4">
            {ratings.map((r, i) => (
              <li key={i} className="bg-gray-100 p-4 rounded-lg">
                <p className="font-medium">From: {r.fromUser?.name || "Someone"}</p>
                <p>Ride: {r.ride?.from} → {r.ride?.to} on {new Date(r.ride?.date).toLocaleDateString()}</p>
                <p>Rating: {r.score} ⭐</p>
                <p className="text-gray-700 italic">"{r.comment}"</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Profile;
