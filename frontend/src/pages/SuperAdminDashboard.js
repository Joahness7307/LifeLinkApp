import React, { useEffect, useState } from 'react';
import '../styles/SuperAdminDashboard.css';

const SuperAdminDashboard = () => {
  const [regions, setRegions] = useState([]);
  const [regionAdmins, setRegionAdmins] = useState([]);
  const [email, setEmail] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [editEmail, setEditEmail] = useState('');
  const [editRegion, setEditRegion] = useState('');
  const [error, setError] = useState(null);

  // Allowed PSGC codes (or use _id if you prefer)
  const ALLOWED_REGION_CODES = ['070000000']; // Central Visayas
  // const ALLOWED_PROVINCE_CODES = ['072200000']; // Cebu
  // const ALLOWED_CITY_CODES = ['072251000', '072234000']; // City of Toledo, City of Naga
  // const ALLOWED_MUNICIPALITY_CODES = ['072208000']; // Balamban

  useEffect(() => {
    fetch('/api/admin/regions', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => setRegions(data));
    fetchRegionAdmins();
  }, []);

  const fetchRegionAdmins = () => {
    fetch('/api/admin/region-admins', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => setRegionAdmins(data));
  };

  const handleAddRegionAdmin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/region-admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ email, region: selectedRegion }),
      });
      const data = await response.json();
      if (response.ok) {
        setEmail('');
        setSelectedRegion('');
        fetchRegionAdmins();
        alert('Region Admin added and invitation sent!');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to add region admin');
    }
  };

  const handleEdit = (admin) => {
    setEditingAdmin(admin);
    setEditEmail(admin.email);
    setEditRegion(admin.address?.region?._id || admin.address?.region || '');
  };

  const handleSaveEdit = async () => {
    try {
      const response = await fetch(`/api/admin/region-admins/${editingAdmin._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ email: editEmail, region: editRegion }),
      });
      const data = await response.json();
      if (response.ok) {
        fetchRegionAdmins();
        setEditingAdmin(null);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to update region admin');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this region admin?')) return;
    try {
      const response = await fetch(`/api/admin/region-admins/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (response.ok) {
        setRegionAdmins((prev) => prev.filter((admin) => admin._id !== id));
      } else {
        const data = await response.json();
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to delete region admin');
    }
  };

  return (
    <div className="super-admin-dashboard">
      <h1>Super Admin Dashboard</h1>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleAddRegionAdmin}>
      <h3>Add Region Admin</h3>
        <input
          type="email"
          placeholder="Region Admin Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <select
          value={selectedRegion}
          onChange={e => setSelectedRegion(e.target.value)}
          required
        >
          <option value="">Select Region</option>
          {regions
            .filter(region =>
              ALLOWED_REGION_CODES.includes(region.code))
            .map((region) => (
              <option key={region._id} value={region._id}>
                {region.name}
              </option>
          ))}
        </select>
        <button type="submit">Add Admin</button>
      </form>
      
      <table className="super-admin-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Region</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {regionAdmins.map(admin => (
            <tr key={admin._id}>
              <td>{admin.userName || 'Pending user'}</td>
              <td>{admin.email}</td>
              <td>{admin.address?.region?.name || admin.assignedArea?.region?.name || 'N/A'}</td>
              <td>
                <button className="edit-btn" onClick={() => handleEdit(admin)}>Edit</button>
                <button className="delete-btn" onClick={() => handleDelete(admin._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Edit Modal */}
      {editingAdmin && (
        <div className="modal-backdrop" onClick={() => setEditingAdmin(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Edit Region Admin</h3>
            <input
              type="email"
              value={editEmail}
              onChange={e => setEditEmail(e.target.value)}
              required
            />
            <select
              value={editRegion}
              onChange={e => setEditRegion(e.target.value)}
              required
            >
              <option value="">Select Region</option>
              {regions
                .filter(region =>
                  ALLOWED_REGION_CODES.includes(region.code))
                .map((region) => (
                  <option key={region._id} value={region._id}>
                    {region.name}
                  </option>
              ))}
            </select>
            <div className="modal-actions">
              <button onClick={handleSaveEdit}>Save</button>
              <button onClick={() => setEditingAdmin(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;