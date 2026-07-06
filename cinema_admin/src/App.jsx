import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/admin/Login';
import { Toaster } from 'react-hot-toast';
import MainLayout from './component/MainLayout';
import { Dashboard } from './pages/admin/Dashboard';
import { Movies } from './pages/admin/Movies';
import { Showtimes } from './pages/admin/Showtimes';
import { CustomerManagement } from './pages/admin/Users';
import { Settings } from './pages/admin/Settings';
import { Bookings } from './pages/booking/Bookings';
import { Revenue } from './pages/admin/Revenue';
import Snacks from './pages/admin/Snacks';
import DiscountCodes from './pages/admin/DiscountCodes';
import TicketScanner from './pages/admin/TicketScanner';
import BannerManagement from './pages/admin/BannerManagement';
import Rooms from './pages/admin/Rooms';
import POS from './pages/admin/POS';
import Reviews from './pages/admin/Reviews';
import Achievements from './pages/admin/loyalty/Achievements';
import Tiers from './pages/admin/loyalty/Tiers';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" reverseOrder={false} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<MainLayout />}>
          <Route path="admin/movies" element={<Movies />} />
          <Route path="admin/showtimes" element={<Showtimes />} />
          <Route path="admin/dashboard" element={<Dashboard />} />
          <Route path="admin/customers" element={<CustomerManagement />} />
          <Route path="admin/revenue" element={<Revenue />} />
          <Route path="admin/settings" element={<Settings />} />
          <Route path="admin/bookings" element={<Bookings />} />
          <Route path="admin/snacks" element={<Snacks />} />
          <Route path="admin/discounts" element={<DiscountCodes />} />
          <Route path="admin/scanner" element={<TicketScanner />} />
          <Route path="admin/banner" element={<BannerManagement />} />
          <Route path="admin/rooms" element={<Rooms />} />
          <Route path="admin/pos" element={<POS />} />
          <Route path="admin/reviews" element={<Reviews />} />
          <Route path="admin/loyalty/achievements" element={<Achievements />} />
          <Route path="admin/loyalty/tiers" element={<Tiers />} />
          <Route index element={<Navigate to="admin/dashboard" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;