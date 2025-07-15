import React, { useState, useEffect } from 'react';
import '../styles/RegionAdminDashboard.css'; // Adjust the path as necessary

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const RegionAdminDashboard = () => {
  const [provinceAdmins, setProvinceAdmins] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [regionId, setRegionId] = useState(null);
  const [email, setEmail] = useState('');
  const [assignedProvince, setAssignedProvince] = useState('');
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [editEmail, setEditEmail] = useState('');
  const [editProvince, setEditProvince] = useState('');
  const [error, setError] = useState(null);

  // Allowed PSGC codes (or use _id if you prefer)
  // const ALLOWED_REGION_CODES = ['070000000']; // Central Visayas
  const ALLOWED_PROVINCE_CODES = ['072200000']; // Cebu
  // const ALLOWED_CITY_CODES = ['072251000', '072234000']; // City of Toledo, City of Naga
  // const ALLOWED_MUNICIPALITY_CODES = ['072208000']; // Balamban

  // Fetch region admin's assigned region
  useEffect(() => {
    const fetchAssignedArea = async () => {
      const response = await fetch(`${BACKEND_URL}/api/admin/regionAdmin/assigned-area`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      console.log('Assigned Area Response:', data); // <-- Debug here
      if (response.ok) setRegionId(data.region);
      else setError(data.error);
    };

    fetchAssignedArea();
  }, []);

  // Fetch provinces in region
  useEffect(() => {
    if (!regionId) return;
    console.log('Fetching provinces for regionId:', regionId); // <-- Debug here
    const fetchProvinces = async () => {
      const response = await fetch(`${BACKEND_URL}/api/admin/provinces/${regionId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      console.log('Provinces API Response:', data); // <-- Debug here
      if (response.ok) setProvinces(data);
      else setError(data.error);
    };

    fetchProvinces();
  }, [regionId]);

  // Fetch province admins
  useEffect(() => {
    const fetchProvinceAdmins = async () => {
      const response = await fetch(`${BACKEND_URL}/api/admin/get-all-province-admins`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      if (response.ok) setProvinceAdmins(data);
      else setError(data.error);
    };
    
    fetchProvinceAdmins();
  }, []);

  // Add Province Admin
  const handleAddProvinceAdmin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/add-province-admins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          email,
          assignedArea: {
            region: regionId,
            province: assignedProvince,
          },
        }),
      });
      const data = await response.json();
      if (response.ok) {
        alert('Province Admin added and invitation sent!');
        setProvinceAdmins((prev) => [...prev, data.provinceAdmin]);
        setEmail('');
        setAssignedProvince('');
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to add Province Admin');
    }
  };

  const handleSaveEdit = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/update-province-admins/${editingAdmin._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          email: editEmail,
          assignedArea: {
            region: regionId,
            province: editProvince,
          },
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setProvinceAdmins((prev) =>
          prev.map((admin) =>
            admin._id === editingAdmin._id ? { ...admin, email: editEmail, assignedArea: { ...admin.assignedArea, province: editProvince } } : admin
          )
        );
        setEditingAdmin(null);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to update Province Admin');
    }
  };

  const handleEdit = (admin) => {
    setEditingAdmin(admin);
    setEditEmail(admin.email);
    setEditProvince(admin.assignedArea.province);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/delete-province-admins/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (response.ok) {
        setProvinceAdmins((prev) => prev.filter((admin) => admin._id !== id));
      } else {
        const data = await response.json();
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to delete Province Admin');
    }
  };

  return (
    <div className="region-admin-dashboard">
      <h1>Region Admin Dashboard</h1>
      {error && <p className="error">{error}</p>}

      {/* Add Province Admin Form */}
      <form onSubmit={handleAddProvinceAdmin}>
        <h3>Add Province Admin</h3>
        <input
          type="email"
          placeholder="Province Admin Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <select
          value={assignedProvince}
          onChange={(e) => setAssignedProvince(e.target.value)}
          required
        >
          <option value="">Select Province</option>
          {provinces
            .filter(province => ALLOWED_PROVINCE_CODES.includes(province.code))
            .map((province) => (
              <option key={province._id} value={province._id}>
                {province.name}
              </option>
            ))}
        </select>
        <button type="submit">Add Admin</button>
      </form>

      {/* List of Province Admins */}
      <table className="province-admins-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Province</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {provinceAdmins.map((admin) => {
            const province = provinces.find(p => p._id === admin.assignedArea.province);
            return (
              <tr key={admin._id}>
                <td>{admin.userName || 'Pending user'}</td>
                <td>{admin.email}</td>
                <td>{province ? province.name : admin.assignedArea.province}</td>
                <td>
                  <button className="edit-btn" onClick={() => handleEdit(admin)}>Edit</button>
                  <button className="delete-btn" onClick={() => handleDelete(admin._id)}>Delete</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Edit Modal */}
      {editingAdmin && (
      <div className="modal-backdrop" onClick={() => setEditingAdmin(null)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <h3>Edit Province Admin</h3>
          <input
            type="email"
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
            required
          />
          <select
            value={editProvince}
            onChange={(e) => setEditProvince(e.target.value)}
            required
          >
            <option value="">Select Province</option>
           {provinces
            .filter(province => ALLOWED_PROVINCE_CODES.includes(province.code))
            .map((province) => (
              <option key={province._id} value={province._id}>
                {province.name}
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

export default RegionAdminDashboard;