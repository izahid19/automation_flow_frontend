import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Layout
import AppLayout from './components/layout/AppLayout';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import Quotes from './pages/Quotes';
import QuoteForm from './pages/QuoteForm';
import QuoteDetail from './pages/QuoteDetail';
import Manufacturers from './pages/Manufacturers';
import Users from './pages/Users';
import InvoiceLabel from './pages/InvoiceLabel';
import QuoteMailSettings from './pages/QuoteMailSettings';
import CompletedOrders from './pages/CompletedOrders';
import PurchaseOrderDetail from './pages/PurchaseOrderDetail';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public Route (redirect to dashboard if logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'oklch(0.18 0.005 285.885)',
              color: 'oklch(0.985 0 0)',
              border: '1px solid oklch(0.3 0.005 286)',
            },
            success: {
              iconTheme: {
                primary: 'var(--success)',
                secondary: 'white',
              },
            },
            error: {
              iconTheme: {
                primary: 'var(--error)',
                secondary: 'white',
              },
            },
          }}
        />
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="quotes" element={<Quotes />} />
            <Route path="quotes/new" element={<QuoteForm />} />
            <Route path="quotes/:id/edit" element={<QuoteForm />} />
            <Route path="quotes/:id" element={<QuoteDetail />} />
            <Route path="approvals" element={<Quotes />} />
            <Route path="purchase-orders" element={<CompletedOrders />} />
            <Route path="purchase-orders/:id" element={<PurchaseOrderDetail />} />
            <Route path="manufacturers" element={<Manufacturers />} />
            <Route
              path="users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Users />
                </ProtectedRoute>
              }
            />
            <Route
              path="invoice-label"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <InvoiceLabel />
                </ProtectedRoute>
              }
            />
            <Route
              path="quote-mail-settings"
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager']}>
                  <QuoteMailSettings />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
