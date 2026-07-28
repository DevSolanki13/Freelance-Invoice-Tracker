import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../hooks/useAxios';


const EXCHANGE_RATE = 97;
const convertCurrency = (amount, fromCurrency = 'INR', toCurrency = 'INR') => {
  const from = fromCurrency || 'INR';
  const to = toCurrency || 'INR';
  if (from === to) return amount;
  if (from === 'USD' && to === 'INR') return amount * EXCHANGE_RATE;
  if (from === 'INR' && to === 'USD') return amount / EXCHANGE_RATE;
  return amount;
};

const computeSummary = (invList, targetCurrency = 'INR') => {
  const currentDate = new Date();
  let totalEarnings = 0;
  let pendingPayments = 0;
  let overdueAmounts = 0;

  invList.forEach((inv) => {
    let status = inv.status;
    if (status !== 'Paid' && status !== 'Overdue' && new Date(inv.dueDate) < currentDate) {
      status = 'Overdue';
    }

    const convertedAmt = convertCurrency(Number(inv.amount), inv.currency || 'INR', targetCurrency);

    if (status === 'Paid') {
      totalEarnings += convertedAmt;
    } else if (status === 'Sent') {
      pendingPayments += convertedAmt;
    } else if (status === 'Overdue') {
      overdueAmounts += convertedAmt;
    }
  });

  return { totalEarnings, pendingPayments, overdueAmounts };
};

const Dashboard = () => {
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState({ totalEarnings: 0, pendingPayments: 0, overdueAmounts: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('dateDesc');
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

      const [invoicesRes, summaryRes] = await Promise.all([
        api.get('/invoices'),
        api.get(`/invoices/summary?currency=${currency}`)
      ]);
      setInvoices(invoicesRes.data.invoices);
      setSummary(summaryRes.data);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to fetch invoices. Please check your backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currency]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;

    try {
      await api.delete(`/invoices/${id}`);
      fetchData(); // Refetch after delete
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to delete invoice.');
    }
  };
  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.clientName.toLowerCase().includes(search.toLowerCase()) ||
      invoice.projectTitle.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    switch (sortBy) {
      case 'dateDesc':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'dateAsc':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'amountDesc': {
        const amtA = convertCurrency(Number(a.amount), a.currency, currency);
        const amtB = convertCurrency(Number(b.amount), b.currency, currency);
        return amtB - amtA;
      }
      case 'amountAsc': {
        const amtA = convertCurrency(Number(a.amount), a.currency, currency);
        const amtB = convertCurrency(Number(b.amount), b.currency, currency);
        return amtA - amtB;
      }
      case 'dueDate':
        return new Date(a.dueDate) - new Date(b.dueDate);
      case 'statusOrder': {
        const statusPriority = {
          'Overdue': 1,
          'Sent': 2,
          'Draft': 3,
          'Paid': 4
        };
        const pA = statusPriority[a.status] || 5;
        const pB = statusPriority[b.status] || 5;
        return pA - pB;
      }
      default:
        return 0;
    }
  });

  const formatCurrency = (amount) => {
    const localeMap = {
      INR: 'en-IN',
      USD: 'en-US'
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
            <span className="stat-value text-paid">{formatCurrency(summary.totalEarnings)}</span>
          </div>
          <div className="stat-card" style={{ borderLeft: '4px solid #0284c7' }}>
            <span className="stat-label">Pending Payments</span>
            <span className="stat-value text-pending">{formatCurrency(summary.pendingPayments)}</span>
          </div>
          <div className="stat-card" style={{ borderLeft: '4px solid #dc2626' }}>
            <span className="stat-label">Overdue Balance</span>
            <span className="stat-value text-overdue">{formatCurrency(summary.overdueAmounts)}</span>
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
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ width: '180px' }}
                title="Sort Invoices"
              >
                <option value="dateDesc">Newest Created</option>
                <option value="dateAsc">Oldest Created</option>
                <option value="dueDate">Due Date (Soonest)</option>
                <option value="amountDesc">Amount (High to Low)</option>
                <option value="amountAsc">Amount (Low to High)</option>
                <option value="statusOrder">Status (Overdue → Sent → Paid)</option>
              </select>
              <div className="currency-toggle" title="Select Currency">
                <button
                  type="button"
                  className={`toggle-btn ${currency === 'INR' ? 'active' : ''}`}
                  onClick={() => setCurrency('INR')}
                >
                  INR
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${currency === 'USD' ? 'active' : ''}`}
                  onClick={() => setCurrency('USD')}
                >
                  USD
                </button>
              </div>
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
              <p style={{ marginBottom: '1.25rem' }}>Create a new invoice to get started.</p>
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
                  {sortedInvoices.map((invoice) => (
                    <tr key={invoice._id}>
                      <td style={{ fontWeight: '500' }}>{invoice.clientName}</td>
                      <td>{invoice.projectTitle}</td>
                      <td style={{ fontWeight: '600' }}>{formatCurrency(convertCurrency(invoice.amount, invoice.currency, currency))}</td>
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
