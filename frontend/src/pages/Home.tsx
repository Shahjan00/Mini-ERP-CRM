import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="marketing-shell">
      <section className="marketing-card">
        <p className="eyebrow">Mini ERP + CRM</p>
        <h1>Simple business operations for customers, stock, and challans.</h1>
        <p>
          Manage customer follow-ups, monitor live inventory, and use the backend sales
          challan workflow without relying on mock data.
        </p>
        <div className="hero-actions">
          <Link className="primary-button" to="/login">
            Sign in
          </Link>
          <Link className="secondary-button" to="/dashboard">
            Open dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Home;
