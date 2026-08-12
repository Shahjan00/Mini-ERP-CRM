import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell';
import RequireAuth from './components/RequireAuth';
import Home from './pages/Home';
import Login from './pages/Login';
import CustomersPage from './pages/CustomersPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import CustomerFormPage from './pages/CustomerFormPage';
import Dashboard from './pages/Dashboard';
import ProductFormPage from './pages/ProductFormPage';
import ProductHistoryPage from './pages/ProductHistoryPage';
import ProductsPage from './pages/ProductsPage';
import Inventory from './pages/Inventory';
import StockMovements from './pages/StockMovements';
import Challans from './pages/Challans';
import CreateChallan from './pages/CreateChallan';
import ChallanDetail from './pages/ChallanDetail';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route
            path="customers"
            element={
              <RequireAuth allowedRoles={['ADMIN', 'SALES', 'ACCOUNTS']}>
                <CustomersPage />
              </RequireAuth>
            }
          />
          <Route
            path="customers/new"
            element={
              <RequireAuth allowedRoles={['ADMIN', 'SALES']}>
                <CustomerFormPage />
              </RequireAuth>
            }
          />
          <Route
            path="customers/:customerId"
            element={
              <RequireAuth allowedRoles={['ADMIN', 'SALES', 'ACCOUNTS']}>
                <CustomerDetailPage />
              </RequireAuth>
            }
          />
          <Route
            path="customers/:customerId/edit"
            element={
              <RequireAuth allowedRoles={['ADMIN', 'SALES']}>
                <CustomerFormPage />
              </RequireAuth>
            }
          />
          <Route
            path="products"
            element={
              <RequireAuth allowedRoles={['ADMIN', 'SALES', 'WAREHOUSE']}>
                <ProductsPage />
              </RequireAuth>
            }
          />
          <Route
            path="products/new"
            element={
              <RequireAuth allowedRoles={['ADMIN', 'WAREHOUSE']}>
                <ProductFormPage />
              </RequireAuth>
            }
          />
          <Route
            path="products/:productId/edit"
            element={
              <RequireAuth allowedRoles={['ADMIN', 'WAREHOUSE']}>
                <ProductFormPage />
              </RequireAuth>
            }
          />
          <Route
            path="products/:productId/history"
            element={
              <RequireAuth allowedRoles={['ADMIN', 'SALES', 'WAREHOUSE']}>
                <ProductHistoryPage />
              </RequireAuth>
            }
          />
          <Route
            path="inventory"
            element={
              <RequireAuth allowedRoles={['ADMIN', 'WAREHOUSE']}>
                <Inventory />
              </RequireAuth>
            }
          />
          <Route
            path="stock-movements"
            element={
              <RequireAuth allowedRoles={['ADMIN', 'WAREHOUSE']}>
                <StockMovements />
              </RequireAuth>
            }
          />
          <Route
            path="challans"
            element={
              <RequireAuth allowedRoles={['ADMIN', 'SALES', 'ACCOUNTS']}>
                <Challans />
              </RequireAuth>
            }
          />
          <Route
            path="challans/new"
            element={
              <RequireAuth allowedRoles={['ADMIN', 'SALES']}>
                <CreateChallan />
              </RequireAuth>
            }
          />
          <Route
            path="challans/:challanId"
            element={
              <RequireAuth allowedRoles={['ADMIN', 'SALES', 'ACCOUNTS']}>
                <ChallanDetail />
              </RequireAuth>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
