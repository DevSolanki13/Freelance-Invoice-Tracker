import { useContext } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';

const Landing = () => {
  const { token } = useContext(AuthContext);

  // If already logged in, redirect straight to dashboard
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="app-container landing-page">
      <Navbar />

      <div className="landing-glow-1"></div>
      <div className="landing-glow-2"></div>

      <main className="landing-container">
        <section className="landing-hero">
          <h1 className="landing-title">
            Track, Manage & Forecast <span>Your Freelance Invoices</span>
          </h1>

          <div className="landing-cta">
            <Link to="/register" className="btn btn-primary btn-cta">
              Create Account
            </Link>
            <Link to="/login" className="btn btn-secondary btn-cta-outline">
              Sign In
            </Link>
          </div>
        </section>


        {/* CSS mockup of the application's dashboard */}
        <section className="landing-preview">
          <div className="mockup-window">
            <div className="mockup-header">
              <span className="mockup-dot red"></span>
              <span className="mockup-dot yellow"></span>
              <span className="mockup-dot green"></span>
              <span className="mockup-window-title">invoice_dashboard_preview</span>
            </div>
            
            <div className="mockup-body">
              {/* Mini metrics cards */}
              <div className="mockup-metrics">
                <div className="mockup-metric-card text-paid">
                  <span className="m-label">Paid Earnings</span>
                  <span className="m-value">₹1,50,000</span>
                </div>
                <div className="mockup-metric-card text-pending">
                  <span className="m-label">Pending</span>
                  <span className="m-value">₹45,000</span>
                </div>
                <div className="mockup-metric-card text-overdue">
                  <span className="m-label">Overdue</span>
                  <span className="m-value">₹15,000</span>
                </div>
              </div>

              {/* Mini mockup invoices list */}
              <div className="mockup-table">
                <div className="table-row table-head">
                  <span>Client</span>
                  <span>Project</span>
                  <span>Amount</span>
                  <span>Status</span>
                </div>
                <div className="table-row">
                  <span className="t-client">Acme Corporation</span>
                  <span className="t-project">E-commerce Redesign</span>
                  <span className="t-amount">₹50,000</span>
                  <span className="t-badge t-badge-paid">Paid</span>
                </div>
                <div className="table-row">
                  <span className="t-client">Stark Industries</span>
                  <span className="t-project">AI Analytics Portal</span>
                  <span className="t-amount">₹15,000</span>
                  <span className="t-badge t-badge-overdue">Overdue</span>
                </div>
                <div className="table-row">
                  <span className="t-client">Wayne Enterprises</span>
                  <span className="t-project">Mobile App Prototype</span>
                  <span className="t-amount">₹30,000</span>
                  <span className="t-badge t-badge-sent">Sent</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Short professional tagline description at the bottom */}
        <section className="landing-footer-desc">
          <p>
            InvoiceTracker is a lightweight, secure billing management application designed for freelance software developers.
            Track paid earnings, monitor outstanding invoices and keep an automated, visual track of overdue invoices.
          </p>
        </section>
      </main>
    </div>
  );
};

export default Landing;
