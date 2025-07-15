import React, { useState, useEffect } from 'react';
import '../styles/ProvinceAdminDashboard.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const SuperAdminDashboard = () => {
  const [cityAdmins, setCityAdmins] = useState([]);
  const [cities, setCities] = useState([]);
  const [regionId, setRegionId] = useState(null); // Region ID of the province Admin
  const [provinceId, setProvinceId] = useState(null); // Province ID of the province Admin
  const [email, setEmail] = useState('');
  const [assignedCity, setAssignedCity] = useState('');
  const [editingAdmin, setEditingAdmin] = useState(null); // State for the admin being edited
  const [editEmail, setEditEmail] = useState('');
  const [editCity, setEditCity] = useState('');
  const [error, setError] = useState(null);

  // Allowed PSGC codes (or use _id if you prefer)
  // const ALLOWED_REGION_CODES = ['070000000']; // Central Visayas
  // const ALLOWED_PROVINCE_CODES = ['072200000']; // Cebu
  const ALLOWED_CITY_CODES = ['072251000', '072234000']; // City of Toledo, City of Naga
  const ALLOWED_MUNICIPALITY_CODES = ['072208000']; // Balamban

  // Fetch assigned province
  useEffect(() => {
    const fetchAssignedArea = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/admin/provinceAdmin/assigned-area`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const data = await response.json();
        console.log('Assigned Area Response:', data); // <-- Debug here
        if (response.ok) {
          setProvinceId(data.province);
          setRegionId(data.region);
        } else {
          setError(data.error);
        }
      } catch (error) {
        setError('Failed to fetch assigned area');
      }
    };
    fetchAssignedArea();
  }, []);

 // Fetch cities in province
 useEffect(() => {
  if (!provinceId) return;
  console.log('Fetching cities for provinceId:', provinceId); // <-- Debug here
  const fetchCities = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/cities/${provinceId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      console.log('Provinces API Response:', data); // <-- Debug here
      if (response.ok) {
        setCities(data);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to fetch cities');
    }
  };
  fetchCities();
}, [provinceId]);

  // Fetch city admins
  useEffect(() => {
    const fetchCityAdmins = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/admin/get-all-city-admins`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const data = await response.json();
        if (response.ok) {
          setCityAdmins(data);
        } else {
          setError(data.error);
        }
      } catch (error) {
        setError('Failed to fetch city admins');
      }
    };
    fetchCityAdmins();
  }, []);

  // Add City Admin
  const handleAddCityAdmin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/add-city-admins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          email,
          assignedArea: {
            region: regionId,
            province: provinceId,
            city: assignedCity,
          },
        }),
      });
      const data = await response.json();
      if (response.ok) {
        alert('City Admin added and invitation sent!');
        setCityAdmins((prev) => [...prev, data.cityAdmin]);
        setEmail('');
        setAssignedCity('');
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to add City Admin');
    }
  };

  // Edit City Admin
  const handleEdit = (admin) => {
    setEditingAdmin(admin);
    setEditEmail(admin.email);
    setEditCity(admin.assignedArea.city);
  };

  const handleSaveEdit = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/update-city-admins/${editingAdmin._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          email: editEmail,
          assignedArea: {
            province: provinceId,
            city: editCity,
          },
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setCityAdmins((prev) =>
          prev.map((admin) =>
            admin._id === editingAdmin._id
              ? { ...admin, email: editEmail, assignedArea: { ...admin.assignedArea, city: editCity } }
              : admin
          )
        );
        setEditingAdmin(null);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to update City Admin');
    }
  };

  // Delete City Admin
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this City Admin?')) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/delete-city-admins/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (response.ok) {
        setCityAdmins((prev) => prev.filter((admin) => admin._id !== id));
      } else {
        const data = await response.json();
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to delete City Admin');
    }
  };

  return (
    <div className="province-admin-dashboard">
      <h1>Province Admin Dashboard</h1>
      {error && <p className="error">{error}</p>}

      {/* Add City Admin Form */}
      <form onSubmit={handleAddCityAdmin}>
        <h3>Add City Admin</h3>
        <input
          type="email"
          placeholder="City Admin Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <select
          value={assignedCity}
          onChange={(e) => setAssignedCity(e.target.value)}
          required
        >
          <option value="">Select City/Municipality</option>
          {cities
            .filter(city =>
              ALLOWED_CITY_CODES.includes(city.code) ||
              ALLOWED_MUNICIPALITY_CODES.includes(city.code)
            )
            .map((city) => (
              <option key={city._id} value={city._id}>
                {city.name}
              </option>
            ))}
        </select>
        <button type="submit">Add Admin</button>
      </form>

      {/* Edit City Admin Form */}
      {editingAdmin && (
        <div className="modal-backdrop" onClick={() => setEditingAdmin(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Edit City Admin</h3>
            <input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              required
            />
            <select
              value={editCity}
              onChange={(e) => setEditCity(e.target.value)}
              required
            >
              <option value="">Select City/Municipality</option>
             {cities
              .filter(city =>
                ALLOWED_CITY_CODES.includes(city.code) ||
                ALLOWED_MUNICIPALITY_CODES.includes(city.code)
              )
              .map((city) => (
                <option key={city._id} value={city._id}>
                  {city.name}
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

      {/* List of City Admins */}
      <table className="city-admins-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>City/Municipality</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {cityAdmins.map((admin) => {
            const city = cities.find(c => c._id === admin.assignedArea.city);
            return (
              <tr key={admin._id}>
                <td>{admin.userName || 'Pending user'}</td>
                <td>{admin.email}</td>
                <td>{city ? city.name : admin.assignedArea.city}</td>
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

export default SuperAdminDashboard;