import { FormEvent, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ApiError, api, getStoredUser, setSession } from '../lib/api';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('admin@test.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fromPath = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/dashboard';

  useEffect(() => {
    if (getStoredUser()) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError('');
      const response = await api.login(email, password);
      setSession(response.token, response.user);
      navigate(fromPath, { replace: true });
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Mini ERP + CRM</h1>
        <p>Sign in to access the system</p>

        {error && <div className="error-message">{error}</div>}

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ marginTop: '16px', fontSize: '13px', color: '#6b7280' }}>
          Test accounts: admin@test.com, sales@test.com, warehouse@test.com, accounts@test.com
          <br />
          Password: password123
        </p>
      </div>
    </div>
  );
}

export default Login;
