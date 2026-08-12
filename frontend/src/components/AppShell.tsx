import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { clearSession, getStoredUser } from '../lib/api';

function AppShell() {
  const user = getStoredUser();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] },
    { path: '/dashboard/customers', label: 'Customers', roles: ['ADMIN', 'SALES', 'ACCOUNTS'] },
    { path: '/dashboard/products', label: 'Products', roles: ['ADMIN', 'WAREHOUSE'] },
    { path: '/dashboard/inventory', label: 'Inventory', roles: ['ADMIN', 'WAREHOUSE'] },
    { path: '/dashboard/stock-movements', label: 'Stock Movements', roles: ['ADMIN', 'WAREHOUSE'] },
    { path: '/dashboard/challans', label: 'Challans', roles: ['ADMIN', 'SALES', 'ACCOUNTS'] },
  ];

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>Mini ERP</h1>
        </div>
        <nav className="sidebar-nav">
          {navItems
            .filter((item) => !item.roles || item.roles.includes(user?.role ?? ''))
            .map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                {item.label}
              </NavLink>
            ))}
        </nav>
        <div className="sidebar-footer">
          <div style={{ marginBottom: '12px', fontSize: '13px', color: '#9ca3af' }}>
            {user?.name}
            <br />
            <span style={{ fontSize: '12px' }}>{user?.role}</span>
          </div>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </aside>

      <main className="main-content">
        <div className="header">
          <h1>
            {navItems.find((item) => item.path === location.pathname)?.label || 'Dashboard'}
          </h1>
        </div>
        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AppShell;
