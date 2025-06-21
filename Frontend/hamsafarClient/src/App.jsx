import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Register from './pages/Register';
import Login from './pages/Login';
import Home from './pages/Home';
import CreateRide from './pages/CreateRide';
import SearchRides from './pages/SearchRides';
import MyBookings from './pages/MyBookings';
import Navbar from './components/Navbar';
import MyRides from './pages/MyRides';
import EditRide from './pages/EditRide';
import RideDetail from './pages/RideDetail';
import BookingDetail from './pages/BookingDetail';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import socket from './socket';
import { useAuth } from './hooks/useAuth';
import AuthProvider from './context/AuthProvider'

const NotificationListener = () => {
  const { user } = useAuth(); // ✅ Always call hooks top-level
  const location = useLocation();

  useEffect(() => {
    if (!user?.id) return;

    socket.emit('join_user_room', user.id);
  }, [user]);

  useEffect(() => {
    const handleNotification = (payload) => {
      if (
        payload?.type === 'message' &&
        !location.pathname.includes(`/messages/${payload.data.sender.id}`)
      ) {
        alert(payload.message); // ✅ Replace with toast for better UX
      }
    };

    socket.on('notification', handleNotification);
    return () => {
      socket.off('notification', handleNotification);
    };
  }, [location, user]);

  return null;
};

const AppRoutes = () => (
  <>
    <Navbar />
    <NotificationListener />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/create-ride" element={<CreateRide />} />
      <Route path="/search" element={<SearchRides />} />
      <Route path="/my-bookings" element={<MyBookings />} />
      <Route path="/my-rides" element={<MyRides />} />
      <Route path="/edit-ride/:id" element={<EditRide />} />
      <Route path="/rides/:id" element={<RideDetail />} />
      <Route path="/bookings/ride/:rideId" element={<BookingDetail />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/messages/:otherUserId" element={<Messages />} />
    </Routes>
  </>
);

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </AuthProvider>
);

export default App;
