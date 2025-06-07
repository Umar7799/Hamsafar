import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Home from './pages/Home';
import AuthProvider from './context/AuthProvider';
import CreateRide from './pages/CreateRide';
import SearchRides from './pages/SearchRides';
import MyBookings from './pages/MyBookings';
import Navbar from './components/Navbar';
import MyRides from './pages/MyRides';
import EditRide from './pages/EditRide';
import RideDetail from './pages/RideDetail';
import BookingDetail from './pages/BookingDetail';
import Profile from './pages/Profile';



const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Navbar />
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
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;
