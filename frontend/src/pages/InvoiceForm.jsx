import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../hooks/useAxios';

const InvoiceForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [clientName, setClientName] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('Draft');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      const fetchInvoice = async () => {
        if (localStorage.getItem('token') === 'mock-token') {
          const localMock = JSON.parse(localStorage.getItem('mockInvoices') || '[]');
          const invoice = localMock.find(inv => inv._id === id);
          if (invoice) {
            setClientName(invoice.clientName);
            setProjectTitle(invoice.projectTitle);
            setAmount(invoice.amount);
            
            // Format date to YYYY-MM-DD for date input
            const d = new Date(invoice.dueDate);
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const year = d.getFullYear();
            setDueDate(`${year}-${month}-${day}`);
            
            setStatus(invoice.status);
            setNotes(invoice.notes || '');
          } else {
            setError('Invoice not found in mock database.');
          }
          setFetchLoading(false);
          return;
        }

        try {
          const response = await api.get(`/invoices/${id}`);
          const invoice = response.data.invoice;
          setClientName(invoice.clientName);
          setProjectTitle(invoice.projectTitle);
          setAmount(invoice.amount);
          
          // Format date to YYYY-MM-DD for date input
          const d = new Date(invoice.dueDate);
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const year = d.getFullYear();
          setDueDate(`${year}-${month}-${day}`);
          
          setStatus(invoice.status);
          setNotes(invoice.notes || '');
        } catch (err) {
          setError(err.response?.data?.msg || 'Failed to fetch invoice details.');
        } finally {
          setFetchLoading(false);
        }
      };
      fetchInvoice();
    }
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const payload = {
      clientName,
      projectTitle,
      amount: Number(amount),
      dueDate,
      status,
      notes
    };

    if (localStorage.getItem('token') === 'mock-token') {
      const localMock = JSON.parse(localStorage.getItem('mockInvoices') || '[]');
      if (isEdit) {
        const updatedList = localMock.map(inv => inv._id === id ? { ...inv, ...payload } : inv);
        localStorage.setItem('mockInvoices', JSON.stringify(updatedList));
      } else {
        const newInvoice = {
          _id: 'mock-' + Math.random().toString(36).substr(2, 9),
          ...payload
        };
        const updatedList = [...localMock, newInvoice];
        localStorage.setItem('mockInvoices', JSON.stringify(updatedList));
      }
      setLoading(false);
      navigate('/dashboard');
      return;
    }

    try {
      if (isEdit) {
        await api.patch(`/invoices/${id}`, payload);
      } else {
        await api.post('/invoices', payload);
      }
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.msg || 'An error occurred while saving the invoice.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="app-container">
      <Navbar />

      <main className="dashboard-main">
        {fetchLoading ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading invoice details...
          </div>
        ) : (
          <div className="form-card">
            <h2 className="form-title">{isEdit ? 'Edit Invoice' : 'New Invoice'}</h2>

            {error && <div className="form-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="clientName">Client Name</label>
                <input
                  type="text"
                  id="clientName"
                  className="form-input"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                  placeholder="e.g. Acme Corp"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="projectTitle">Project Title</label>
                <input
                  type="text"
                  id="projectTitle"
                  className="form-input"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  required
                  placeholder="e.g. Website Design"
                />
              </div>

              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label" htmlFor="amount">Amount (USD)</label>
                  <input
                    type="number"
                    id="amount"
                    className="form-input"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="form-label" htmlFor="dueDate">Due Date</label>
                  <input
                    type="date"
                    id="dueDate"
                    className="form-input"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="status">Status</label>
                <select
                  id="status"
                  className="form-input"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="Draft">Draft</option>
                  <option value="Sent">Sent</option>
                  <option value="Paid">Paid</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="notes">Notes (Optional)</label>
                <textarea
                  id="notes"
                  className="form-input"
                  rows="4"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Payment details, late fee policy, etc..."
                  style={{ resize: 'vertical', minHeight: '80px' }}
                />
              </div>

              <div className="form-actions">
                <Link to="/dashboard" className="btn btn-secondary">Cancel</Link>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Invoice'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default InvoiceForm;
