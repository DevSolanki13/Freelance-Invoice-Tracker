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

  const handleDemoLogin = () => {
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('user', JSON.stringify({ name: 'Demo Freelancer' }));
    window.location.href = '/dashboard';
  };

  return (
    <div className="app-container">
      <Navbar />

      <main className="landing-hero">
        <h1 className="landing-title">
          Manage Freelance Invoices <span>With Confidence</span>
        </h1>
        <p className="landing-desc">
          A professional, clean, and secure tracker for freelance software developers. 
          Monitor earnings, keep track of pending bills, and automatically flag overdue accounts in real-time.
        </p>

        <div className="landing-cta">
          <Link to="/login" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
            Sign In
          </Link>
          <button onClick={handleDemoLogin} className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', cursor: 'pointer' }}>
            Try Demo Mode
          </button>
        </div>
      </main>
    </div>
  );
};


export default Landing;
