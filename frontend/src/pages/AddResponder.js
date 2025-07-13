import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { useNavigate } from 'react-router-dom';
import '../styles/AddResponder.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AddResponderPage = () => {
  const [responders, setResponders] = useState([]);
  const [email, setEmail] = useState('');
  const [editingResponder, setEditingResponder] = useState(null);
  const [editEmail, setEditEmail] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [pendingCount, setPendingCount] = useState(0);
  const navigate = useNavigate();

  // Fetch responders
  useEffect(() => {
  const fetchResponders = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/responders`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      if (response.ok) setResponders(data);
      else setError(data.error || 'Failed to fetch responders');
    } catch (error) {
      setError('Failed to fetch responders');
    }
  };
  fetchResponders();
}, []);

  // Fetch pending reports count for sidebar badge
  useEffect(() => {
    const fetchPendingCount = async () => {
      const token = localStorage.getItem('token');
      const departmentId = localStorage.getItem('departmentId');
      if (!departmentId) return;
      try {
        const res = await fetch(`${BACKEND_URL}/api/reports/department/${departmentId}/status-counts`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.pending !== undefined) setPendingCount(data.pending);
      } catch {}
    };
    fetchPendingCount();
  }, []);

  // Sidebar navigation handler
  const handleSidebarNavigate = (section) => {
    if (section === 'new-reports') {
      navigate('/DepartmentAdminDashboard', { state: { scrollToPending: true } });
    }
  };

  const handleAddResponder = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/responders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess('Responder invitation sent!');
        setEmail('');
      } else {
        setError(data.error || 'Failed to add responder');
      }
    } catch {
      setError('Failed to add responder');
    }
  };

   // Edit responder
    const handleEdit = (responder) => {
      setEditingResponder(responder);
      setEditEmail(responder.email);
    };
  
    const handleSaveEdit = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/admin/responders/${editingResponder._id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ email: editEmail }),
        });
        const data = await response.json();
        if (response.ok) {
          setEditingResponder(null);
        } else {
          setError(data.error);
        }
      } catch (error) {
        setError('Failed to update responder');
      }
    };
  
    // Delete responder
    const handleDelete = async (id) => {
      if (!window.confirm('Are you sure you want to delete this responder?')) return;
      try {
        const response = await fetch(`${BACKEND_URL}/api/admin/responders/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (response.ok) {
          setResponders((prev) => prev.filter((r) => r._id !== id));
        } else {
          const data = await response.json();
          setError(data.error);
        }
      } catch (error) {
        setError('Failed to delete responder');
      }
    };

  return (
    <AdminLayout newReportsCount={pendingCount} onSidebarNavigate={handleSidebarNavigate}>
       <div className="admin-main-content">
      <div className="add-responder-container">
        <h2>Add Responder</h2>
        <form className="add-responder-form" onSubmit={handleAddResponder}>
          <input
            type="email"
            placeholder="Responder Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <button type="submit">
            Add Responder
          </button>
        </form>
        {success && <div className="add-responder-success">{success}</div>}
        {error && <div className="add-responder-error">{error}</div>}

        {/* Responders Table */}
        <table className="responders-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {responders.length === 0 ? (
              <tr>
                <td colSpan={2}>No responders found.</td>
              </tr>
            ) : (
              responders.map(responder => (
                <tr key={responder._id}>
                  <td>
                    {editingResponder && editingResponder._id === responder._id ? (
                      <input
                        type="email"
                        value={editEmail}
                        onChange={e => setEditEmail(e.target.value)}
                      />
                    ) : (
                      responder.email
                    )}
                  </td>
                  <td>
                    {editingResponder && editingResponder._id === responder._id ? (
                      <>
                        <button onClick={handleSaveEdit}>Save</button>
                        <button onClick={() => setEditingResponder(null)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleEdit(responder)}>Edit</button>
                        <button onClick={() => handleDelete(responder._id)}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

      </div>
      </div>
    </AdminLayout>
  );
};

export default AddResponderPage;