import React, { useState, useEffect } from 'react';
// import useAuthContext from '../hooks/useAuthContext';
import '../styles/CityAdminDashboard.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const CityAdminDashboard = () => {
  // const { user } = useAuthContext();
  const [departmentAdmins, setDepartmentAdmins] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [email, setEmail] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [editEmail, setEditEmail] = useState('');
  const [editDepartmentId, setEditDepartmentId] = useState('');
  const [error, setError] = useState(null);

  // Fetch departments for this city
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/admin/my-departments`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const data = await response.json();
        if (response.ok) {
          setDepartments(data);
        } else {
          setError(data.error);
        }
      } catch (error) {
        setError('Failed to fetch departments');
      }
    };
    fetchDepartments();
  }, []);

  // Fetch department admins
const fetchAdmins = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/admin/get-all-department-admins`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    const data = await response.json();
    if (response.ok) {
      setDepartmentAdmins(data);
    } else {
      setError(data.error);
    }
  } catch (error) {
    setError('Failed to fetch department admins');
  }
};

  useEffect(() => {
    fetchAdmins();
  }, []);

  // Add Department Admin
  const handleAddDepartmentAdmin = async (e) => {
    e.preventDefault();
    try {
      const selectedDept = departments.find(d => d._id === departmentId);
      if (!selectedDept) {
        setError('Please select a department.');
        return;
      }

      // Only send department name and email as required by backend
    const response = await fetch(`${BACKEND_URL}/api/admin/add-department-admins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ email, department: selectedDept._id }),
    });
    const data = await response.json();
    if (response.ok) {
      alert('Department Admin added and invitation sent!');
      setDepartmentAdmins((prev) => [...prev, data.departmentAdmin]);
      setEmail('');
      setDepartmentId('');
      fetchAdmins(); // Refresh the list of admins
    } else {
      setError(data.error);
    }
  } catch (error) {
    setError('Failed to add Department Admin');
  }
  };

  // Edit Department Admin
  const handleEdit = (admin) => {
    setEditingAdmin(admin);
    setEditEmail(admin.email);
    setEditDepartmentId(
      admin.assignedArea?.department?._id ||
      admin.assignedArea?.department ||
      ''
    );
  };

  const handleSaveEdit = async () => {
    try {
      const selectedDept = departments.find(d => d._id === editDepartmentId);
      if (!selectedDept) {
        setError('Please select a department.');
        return;
      }
      const response = await fetch(`${BACKEND_URL}/api/admin/update-department-admins/${editingAdmin._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ email: editEmail, department: selectedDept._id }),
      });
      const data = await response.json();
      if (response.ok) {
        fetchAdmins();
        setEditingAdmin(null);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to update Department Admin');
    }
  };

  // Delete Department Admin
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this Department Admin?')) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/delete-department-admins/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (response.ok) {
        setDepartmentAdmins((prev) => prev.filter((admin) => admin._id !== id));
      } else {
        const data = await response.json();
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to delete Department Admin');
    }
  };

  return (
    <div className="city-admin-dashboard">
      <h1>City Admin Dashboard</h1>
      {error && <p className="error">{error}</p>}

      {/* Add Department Admin Form */}
      <form onSubmit={handleAddDepartmentAdmin}>
        <h3>Add Department Admin</h3>
        <input
          type="email"
          placeholder="Department Admin Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <select
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          required
        >
          <option value="">Select Department</option>
          {departments.map((dept) => (
            <option key={dept._id} value={dept._id}>
              {dept.name}
            </option>
          ))}
        </select>
        <button type="submit">Add Admin</button>
      </form>

      {/* Edit Modal */}
      {editingAdmin && (
        <div className="modal-backdrop" onClick={() => setEditingAdmin(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Edit Department Admin</h3>
            <input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              required
            />
            <select
              value={editDepartmentId}
              onChange={(e) => setEditDepartmentId(e.target.value)}
              required
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
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

      {/* List of Department Admins */}
      <table className="department-admins-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Department</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
           {departmentAdmins.map((admin) => {
              // Find the department object by name
              // const dept = departments.find(
              //   (d) => d.name === admin.assignedArea?.department
              // );
              return (
                <tr key={admin._id}>
                  <td>{admin.userName || 'Pending user'}</td>
                  <td>{admin.email}</td>
                  <td>
                    {admin.assignedArea?.department?.name ||
                      departments.find(d => d._id === (admin.assignedArea?.department?._id || admin.assignedArea?.department))?.name ||
                      'N/A'}
                  </td>
                  <td>
                    <button className="edit-btn" onClick={() => handleEdit(admin)}>Edit</button>
                    <button className="delete-btn" onClick={() => handleDelete(admin._id)}>Delete</button>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
};

export default CityAdminDashboard;