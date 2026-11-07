import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoutes } from './components/ProtectedRoutes.jsx';
import { RoleBasedRedirect } from './components/RoleBasedRedirect.jsx';
import { Snackbar } from './components/Snackbar.jsx';
import './App.css';

const Home = lazy(() => import('./pages/Home.jsx'));
const Destinations = lazy(() => import('./pages/Destinations.jsx'));
const PlaceDetails = lazy(() => import('./pages/PlaceDetails.jsx'));
const Account = lazy(() => import('./pages/Account.jsx'));
const ConfirmPayment = lazy(() => import('./pages/ConfirmPayment.jsx'));
const LoginN = lazy(() => import('./components/auth/LoginN.jsx').then((module) => ({ default: module.LoginN })));
const SignUpN = lazy(() => import('./components/auth/SignUpN.jsx').then((module) => ({ default: module.SignUpN })));
const HostN = lazy(() => import('./pages/Host.jsx').then((module) => ({ default: module.HostN })));
const HostMyProfilePage = lazy(() => import('./pages/HostProfilePage.jsx').then((module) => ({ default: module.HostMyProfilePage })));
const Admin = lazy(() => import('./pages/Admin.jsx').then((module) => ({ default: module.Admin })));
const AdminPropertyDetailsPage = lazy(() => import('./pages/AdminPropertyDetailsPage.jsx').then((module) => ({ default: module.AdminPropertyDetailsPage })));
const AdminReservationDetailsPage = lazy(() => import('./pages/AdminReservationDetailsPage.jsx').then((module) => ({ default: module.AdminReservationDetailsPage })));
const AdminReviewDetailsPage = lazy(() => import('./pages/AdminReviewDetailsPage.jsx').then((module) => ({ default: module.AdminReviewDetailsPage })));
const AdminProfilePage = lazy(() => import('./pages/AdminProfile.jsx').then((module) => ({ default: module.AdminProfilePage })));

function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <Snackbar />
        <Suspense fallback={<div className="d-flex min-vh-100 align-items-center justify-content-center text-white">Loading page...</div>}>
          <Routes>
            

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

            <Route element={<ProtectedRoutes allowedRoles={["customer", "host"]} />}>
              <Route path="/account" element={<Account />} />
            </Route>

            <Route element={<ProtectedRoutes allowedRoles={["host"]} />}>
              <Route path="/host/profile" element={<HostMyProfilePage />} />
              <Route path="/host/*" element={<HostN />} />
            </Route>

            <Route element={<ProtectedRoutes allowedRoles={['admin']} />}>
              <Route path="/admin/profile" element={<AdminProfilePage />} />
              <Route path="/admin/properties/:id" element={<AdminPropertyDetailsPage />} />
              <Route path="/admin/reservations/:id" element={<AdminReservationDetailsPage />} />
              <Route path="/admin/reviews/:id" element={<AdminReviewDetailsPage />} />
              <Route path="/admin/*" element={<Admin />} />
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App;