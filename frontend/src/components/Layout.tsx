import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { getStoredUser, clearSession } from '../lib/api';

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getStoredUser();

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/customers', label: 'Customers' },
    { path: '/products', label: 'Products' },
    { path: '/inventory', label: 'Inventory' },
    { path: '/stock-movements', label: 'Stock Movements' },
    { path: '/challans', label: 'Challans' },
  ];

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>Mini ERP</h1>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <a
              key={item.path}
              href={item.path}
              className={location.pathname === item.path ? 'active' : ''}
              onClick={(e) => {
                e.preventDefault();
                navigate(item.path);
              }}
            >
              {item.label}
            </a>
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
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
