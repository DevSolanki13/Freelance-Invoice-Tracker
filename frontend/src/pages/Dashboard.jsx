import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../hooks/useAxios';

const defaultMockInvoices = [
  {
    _id: 'mock-1',
    clientName: 'Acme Corporation',
    projectTitle: 'E-commerce Redesign',
    amount: 3500.00,
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Sent',
    notes: 'Includes CMS setup'
  },
  {
    _id: 'mock-2',
    clientName: 'Stark Industries',
    projectTitle: 'AI Analytics Portal',
    amount: 7200.00,
    dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Sent', // resolves to Overdue dynamically
    notes: 'Awaiting clean data feeds.'
  },
  {
    _id: 'mock-3',
    clientName: 'Wayne Enterprises',
    projectTitle: 'Mobile App Prototype',
    amount: 4800.00,
    dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Paid',
    notes: 'Paid in full.'
  },
  {
    _id: 'mock-4',
    clientName: 'LexCorp',
    projectTitle: 'Security System Audit',
    amount: 1500.00,
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Draft',
    notes: 'Initial scope proposal.'
  }
];

const computeSummary = (invList) => {
  const currentDate = new Date();
  let totalEarnings = 0;
  let pendingPayments = 0;
  let overdueAmounts = 0;

  invList.forEach((inv) => {
    let status = inv.status;
    if (status !== 'Paid' && status !== 'Overdue' && new Date(inv.dueDate) < currentDate) {
      status = 'Overdue';
    }

    if (status === 'Paid') {
      totalEarnings += Number(inv.amount);
    } else if (status === 'Sent') {
      pendingPayments += Number(inv.amount);
    } else if (status === 'Overdue') {
      overdueAmounts += Number(inv.amount);
    }
  });

  return { totalEarnings, pendingPayments, overdueAmounts };
};

const Dashboard = () => {
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState({ totalEarnings: 0, pendingPayments: 0, overdueAmounts: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currency, setCurrency] = useState(localStorage.getItem('currency') || 'INR');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('currency', currency);
  }, [currency]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      if (localStorage.getItem('token') === 'mock-token') {
        let localMock = localStorage.getItem('mockInvoices');
        if (!localMock) {
          localStorage.setItem('mockInvoices', JSON.stringify(defaultMockInvoices));
          localMock = defaultMockInvoices;
        } else {
          localMock = JSON.parse(localMock);
        }
        setInvoices(localMock);
        setSummary(computeSummary(localMock));
        setError('Demo Mode: Showing mock testing data (Backend offline)');
        setLoading(false);
        return;
      }

      const [invoicesRes, summaryRes] = await Promise.all([
        api.get('/invoices'),
        api.get('/invoices/summary')
      ]);
      setInvoices(invoicesRes.data.invoices);
      setSummary(summaryRes.data);
    } catch (err) {
      let localMock = localStorage.getItem('mockInvoices');
      if (!localMock) {
        localStorage.setItem('mockInvoices', JSON.stringify(defaultMockInvoices));
        localMock = defaultMockInvoices;
      } else {
        localMock = JSON.parse(localMock);
      }
      setInvoices(localMock);
      setSummary(computeSummary(localMock));
      setError('Demo Mode: Showing mock testing data (Backend offline)');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    
    if (localStorage.getItem('token') === 'mock-token' || error.includes('Demo Mode')) {
      const updatedList = invoices.filter(inv => inv._id !== id);
      localStorage.setItem('mockInvoices', JSON.stringify(updatedList));
      setInvoices(updatedList);
      setSummary(computeSummary(updatedList));
      return;
    }

    try {
      await api.delete(`/invoices/${id}`);
      fetchData(); // Refetch after delete
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to delete invoice.');
    }
  };

  const handleSeedMockData = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (localStorage.getItem('token') === 'mock-token' || (error && error.includes('Demo Mode'))) {
        localStorage.setItem('mockInvoices', JSON.stringify(defaultMockInvoices));
        setInvoices(defaultMockInvoices);
        setSummary(computeSummary(defaultMockInvoices));
        setError('Demo Mode: Showing mock testing data (Backend offline)');
        setLoading(false);
        return;
      }

      // Seed mock invoices to real backend DB
      await Promise.all(defaultMockInvoices.map(inv => {
        const { clientName, projectTitle, amount, dueDate, status, notes } = inv;
        return api.post('/invoices', { clientName, projectTitle, amount, dueDate, status, notes });
      }));
      
      // Fetch fresh data
      const [invoicesRes, summaryRes] = await Promise.all([
        api.get('/invoices'),
        api.get('/invoices/summary')
      ]);
      setInvoices(invoicesRes.data.invoices);
      setSummary(summaryRes.data);
    } catch (err) {
      setError('Failed to seed demo data. Please verify your backend server connection.');
    } finally {
      setLoading(false);
    }
  };
  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.clientName.toLowerCase().includes(search.toLowerCase()) ||
      invoice.projectTitle.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount) => {
    const localeMap = {
      INR: 'en-IN',
      USD: 'en-US',
      EUR: 'en-IE',
      GBP: 'en-GB'
    };
    const locale = localeMap[currency] || 'en-IN';
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
  };


  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="app-container">
      <Navbar />

      <main className="dashboard-main">
        {error && <div className="form-error">{error}</div>}

        <div className="dashboard-header">
          <h1 className="dashboard-title">Overview</h1>
          <Link to="/invoices/new" className="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Invoice
          </Link>
        </div>

        {/* Stats Grid */}
        <section className="stats-grid">
          <div className="stat-card" style={{ borderLeft: '4px solid #16a34a' }}>
            <span className="stat-label">Total Paid Earnings</span>
            <span className="stat-value">{formatCurrency(summary.totalEarnings)}</span>
          </div>
          <div className="stat-card" style={{ borderLeft: '4px solid #0284c7' }}>
            <span className="stat-label">Pending Payments</span>
            <span className="stat-value">{formatCurrency(summary.pendingPayments)}</span>
          </div>
          <div className="stat-card" style={{ borderLeft: '4px solid #dc2626' }}>
            <span className="stat-label">Overdue Balance</span>
            <span className="stat-value">{formatCurrency(summary.overdueAmounts)}</span>
          </div>
        </section>

        {/* Table Toolbar & Filters */}
        <div className="table-card">
          <div className="table-toolbar">
            <div className="filter-group">
              <input
                type="text"
                className="form-input search-input"
                placeholder="Search by client or project..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className="form-input"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: '150px' }}
              >
                <option value="All">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
              </select>
              <select
                className="form-input"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                style={{ width: '120px' }}
                title="Select Currency"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

          </div>

          {loading ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Loading invoices...
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="empty-state-title">No invoices found</h3>
              <p style={{ marginBottom: '1.25rem' }}>Create a new invoice or seed testing values to inspect the dashboard layout.</p>
              <button onClick={handleSeedMockData} className="btn btn-secondary">
                Load Demo Invoices
              </button>
            </div>

          ) : (
            <div className="invoice-table-wrapper">
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Project</th>
                    <th>Amount</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice._id}>
                      <td style={{ fontWeight: '500' }}>{invoice.clientName}</td>
                      <td>{invoice.projectTitle}</td>
                      <td style={{ fontWeight: '600' }}>{formatCurrency(invoice.amount)}</td>
                      <td>{formatDate(invoice.dueDate)}</td>
                      <td>
                        <span className={`badge badge-${invoice.status.toLowerCase()}`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <Link to={`/invoices/edit/${invoice._id}`} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }}>
                          Edit
                        </Link>
                        <button onClick={() => handleDelete(invoice._id)} className="btn btn-danger" style={{ padding: '0.25rem 0.5rem' }}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
