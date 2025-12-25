import { Routes, Route } from 'react-router-dom';
import Login from './Admin/Login/Login';
import Inventory from './Admin/Inventory/Inventory';
import List from './Admin/List/List';
import { ProtectedRoute } from './ProtectedRoute';
import Booking from './Admin/Booking/Booking';
import AllBookings from './Admin/Booking/Allbookings';
import Company from './Admin/Company/Company';
import View from './Admin/Company/View';


const AllRoutes = () => {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Login />} />

      {/* Any logged-in user */}
      <Route element={<ProtectedRoute />}>
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/listing" element={<List />} />
        <Route path="/book" element={<Booking />} />
        <Route path="/company" element={<Company />} />
        <Route path="/view" element={<View />} />
        <Route path='/allbookings' element={<AllBookings/>}/>
      </Route>
    </Routes>
  );
};

export default AllRoutes;