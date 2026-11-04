import { Routes, Route } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoutes } from './components/ProtectedRoutes.jsx';
import { RoleBasedRedirect } from './components/RoleBasedRedirect.jsx';
import { Snackbar } from './components/Snackbar.jsx';
import Home from './pages/Home.jsx';
import Destinations from './pages/Destinations.jsx';
import PlaceDetails from './pages/PlaceDetails.jsx';
import Account from './pages/Account.jsx';
import ConfirmPayment from './pages/ConfirmPayment.jsx';
import { LoginN } from './components/auth/LoginN.jsx';
import { SignUpN } from './components/auth/SignUpN.jsx';
import { HostN } from './pages/Host.jsx';
import { ConfirmBooking } from './pages/HostConfirmBooking.jsx';
import { HostViewPropertyPage } from './pages/HostViewPropertyDetails.jsx';
import { HostMyProfilePage } from './pages/HostProfilePage.jsx';
import { HostEditPropertyPage } from './pages/HostEditProperty.jsx';
import { Admin } from './pages/Admin.jsx';
import { AdminPropertyDetailsPage } from './pages/AdminPropertyDetailsPage.jsx';
import { AdminReservationDetailsPage } from './pages/AdminReservationDetailsPage.jsx';
import { AdminReviewDetailsPage } from './pages/AdminReviewDetailsPage.jsx';
import { AdminProfilePage } from './pages/AdminProfile.jsx';
import './App.css';

function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <Snackbar />
        <Routes>
          {import.meta.env.DEV && (
            <>
              <Route path="/admin-preview" element={<Admin preview />} />
              <Route path="/admin-preview/properties/:id" element={<AdminPropertyDetailsPage preview />} />
              <Route path="/admin-preview/reservations/:id" element={<AdminReservationDetailsPage preview />} />
              <Route path="/admin-preview/reviews/:id" element={<AdminReviewDetailsPage preview />} />
              <Route path="/admin-profile-preview" element={<AdminProfilePage preview />} />
              <Route path="/host-preview/*" element={<HostN preview />} />
              <Route path="/host-profile-preview" element={<HostMyProfilePage preview />} />
            </>
          )}

          {/* Root route with auto-redirect for Admin */}
          <Route
            path="/"
            element={
              <RoleBasedRedirect>
                <Home />
              </RoleBasedRedirect>
            }
          />

          <Route path="/destination" element={<Destinations />} />
          <Route path="/resorts/:id" element={<PlaceDetails />} />
          <Route path="/destinationdetails" element={<PlaceDetails />} />
          <Route path="/pay" element={<ConfirmPayment />} />
          <Route path="/login" element={<LoginN />} />
          <Route path="/signup" element={<SignUpN />} />

          {/* Customer & Host accessible pages */}
          <Route element={<ProtectedRoutes allowedRoles={["customer", "host"]} />}>
            <Route path="/account" element={<Account />} />
          </Route>

          {/* Host specific routes */}
          <Route element={<ProtectedRoutes allowedRoles={["host"]} />}>
            <Route path="/host/profile" element={<HostMyProfilePage />} />
            <Route path="/host/*" element={<HostN />} />
          </Route>

          {/* Admin specific routes */}
          <Route element={<ProtectedRoutes allowedRoles={['admin']} />}>
            <Route path="/admin/profile" element={<AdminProfilePage />} />
            <Route path="/admin/properties/:id" element={<AdminPropertyDetailsPage />} />
            <Route path="/admin/reservations/:id" element={<AdminReservationDetailsPage />} />
            <Route path="/admin/reviews/:id" element={<AdminReviewDetailsPage />} />
            <Route path="/admin/*" element={<Admin />} />
          </Route>
        </Routes>
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App;