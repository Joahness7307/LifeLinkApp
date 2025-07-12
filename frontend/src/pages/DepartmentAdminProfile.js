import React, { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { useNavigate } from 'react-router-dom';
import '../styles/Profile.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const DepartmentAdminProfile = () => {
  const [profile, setProfile] = useState(null);
  const [department, setDepartment] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const navigate = useNavigate();

  const [editAdminContactMode, setEditAdminContactMode] = useState(false);
  const [adminContactNumber, setAdminContactNumber] = useState('');
  const [savingAdminContact, setSavingAdminContact] = useState(false);

  const [deptMobileNumbers, setDeptMobileNumbers] = useState('');
  const [deptLandlineNumbers, setDeptLandlineNumbers] = useState('');

  const [editDeptMobileMode, setEditDeptMobileMode] = useState(false);
  const [editDeptLandlineMode, setEditDeptLandlineMode] = useState(false);
  const [savingDeptMobile, setSavingDeptMobile] = useState(false);
  const [savingDeptLandline, setSavingDeptLandline] = useState(false);

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/user/me`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const data = await response.json();
        if (response.ok) setProfile(data);
        else setError(data.error || 'Failed to fetch profile');
      } catch {
        setError('Failed to fetch profile');
      }
    };
    fetchProfile();
  }, []);

  // Fetch department info
  useEffect(() => {
    const fetchDepartment = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/admin/my-department`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const data = await response.json();
        if (response.ok) setDepartment(data);
      } catch {
        // ignore for now
      } finally {
        setLoading(false);
      }
    };
    fetchDepartment();
  }, []);

   // Fetch pending reports count
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

  // Handle navigation to sidebar
  const handleSidebarNavigate = (section) => {
    if (section === 'new-reports') {
      navigate('/DepartmentAdminDashboard', { state: { scrollToPending: true } });
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!profile) return <div className="error">Profile not found.</div>;

  const cityName = profile.address?.city?.name || profile.address?.city || 'N/A';
  const departmentName = department?.name || 'N/A';

  return (
    <AdminLayout newReportsCount={pendingCount} onSidebarNavigate={handleSidebarNavigate}>
      <div className="admin-main-content">
      <div className="profile-container">
        <h2>Department Admin Profile</h2>
        <div className="profile-card">
          <div className="profile-section">
            <div className="profile-field">
              <label>Username:</label>
              <p>{profile.userName}</p>
            </div>
            <div className="profile-field">
              <label>Email:</label>
              <p>{profile.email}</p>
            </div>
            <div className="profile-field">
              <label>Contact Number:</label>
              {editAdminContactMode ? (
                <>
                  <input
                    value={adminContactNumber}
                    onChange={e => setAdminContactNumber(e.target.value)}
                    placeholder="09XXXXXXXXX or 0XXXXXXXXX"
                  />
                  <button
                    onClick={async () => {
                      if (!/^09\d{9}$|^0\d{9,10}$/.test(adminContactNumber)) {
                        alert('Invalid Philippine contact number');
                        return;
                      }
                      setSavingAdminContact(true);
                      const res = await fetch(`${BACKEND_URL}/api/user/${profile._id}`, {
                        method: 'PATCH',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${localStorage.getItem('token')}`,
                        },
                        body: JSON.stringify({ contactNumber: adminContactNumber }),
                      });
                      if (res.ok) {
                        setEditAdminContactMode(false);
                        window.location.reload();
                      } else {
                        alert('Failed to update contact number');
                      }
                      setSavingAdminContact(false);
                    }}
                    disabled={savingAdminContact}
                  >Save</button>
                  <button onClick={() => setEditAdminContactMode(false)}>Cancel</button>
                </>
              ) : (
                <>
                  <p>{profile.contactNumber || 'N/A'}</p>
                  <button onClick={() => {
                    setAdminContactNumber(profile.contactNumber || '');
                    setEditAdminContactMode(true);
                  }}>Edit</button>
                </>
              )}
            </div>
            <div className="profile-field">
              <label>Assigned City:</label>
              <p>{cityName}</p>
            </div>
            <div className="profile-field">
              <label>Assigned Department:</label>
              <p>{departmentName}</p>
            </div>
          </div>
            <div className="profile-section">
              {department ? (
                <div className="profile-details">
                  <div className="profile-field">
                    <label>Department Name:</label>
                    <p>{department.name}</p>
                  </div>
                 {/* Mobile Numbers */}
                  <div className="profile-field">
                    <label>Mobile Numbers:</label>
                    {editDeptMobileMode ? (
                      <>
                        <input
                          value={deptMobileNumbers}
                          onChange={e => setDeptMobileNumbers(e.target.value)}
                          placeholder="Comma-separated, e.g. 0917..., 0998..."
                        />
                        <button
                          onClick={async () => {
                            setSavingDeptMobile(true);
                            const res = await fetch(`${BACKEND_URL}/api/admin/departments/${department._id}`, {
                              method: 'PATCH',
                              headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${localStorage.getItem('token')}`,
                              },
                              body: JSON.stringify({
                                mobileNumbers: deptMobileNumbers.split(',').map(s => s.trim()).filter(Boolean),
                              }),
                            });
                            if (res.ok) {
                              setEditDeptMobileMode(false);
                              window.location.reload();
                            } else {
                              alert('Failed to update mobile numbers');
                            }
                            setSavingDeptMobile(false);
                          }}
                          disabled={savingDeptMobile}
                        >
                          Save
                        </button>
                        <button onClick={() => setEditDeptMobileMode(false)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <div className="numbers-wrap">
                          {department.mobileNumbers && department.mobileNumbers.length > 0
                            ? department.mobileNumbers.map((num, idx) => (
                                <React.Fragment key={idx}>
                                  <span className="number-item">{num}</span>
                                  {idx < department.mobileNumbers.length - 1 && <span className="number-separator">/</span>}
                                </React.Fragment>
                              ))
                            : <span className="number-item">N/A</span>
                          }
                          {!editDeptMobileMode && (
                            <button
                              style={{ marginLeft: 12 }}
                              onClick={() => {
                                setDeptMobileNumbers(department.mobileNumbers ? department.mobileNumbers.join(', ') : '');
                                setEditDeptMobileMode(true);
                              }}
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Landline Numbers */}
                  <div className="profile-field">
                    <label>Landline Numbers:</label>
                    {editDeptLandlineMode ? (
                      <>
                        <input
                          value={deptLandlineNumbers}
                          onChange={e => setDeptLandlineNumbers(e.target.value)}
                          placeholder="Comma-separated, e.g. 032-..."
                        />
                        <button
                          onClick={async () => {
                            setSavingDeptLandline(true);
                            const res = await fetch(`${BACKEND_URL}/api/admin/departments/${department._id}`, {
                              method: 'PATCH',
                              headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${localStorage.getItem('token')}`,
                              },
                              body: JSON.stringify({
                                landlineNumbers: deptLandlineNumbers.split(',').map(s => s.trim()).filter(Boolean),
                              }),
                            });
                            if (res.ok) {
                              setEditDeptLandlineMode(false);
                              window.location.reload();
                            } else {
                              alert('Failed to update landline numbers');
                            }
                            setSavingDeptLandline(false);
                          }}
                          disabled={savingDeptLandline}
                        >
                          Save
                        </button>
                        <button onClick={() => setEditDeptLandlineMode(false)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <div className="numbers-wrap">
                          {department.landlineNumbers && department.landlineNumbers.length > 0
                            ? department.landlineNumbers.map((num, idx) => (
                                <React.Fragment key={idx}>
                                  <span className="number-item">{num}</span>
                                  {idx < department.landlineNumbers.length - 1 && <span className="number-separator">/</span>}
                                </React.Fragment>
                              ))
                            : <span className="number-item">N/A</span>
                          }
                          {!editDeptLandlineMode && (
                            <button
                              style={{ marginLeft: 12 }}
                              onClick={() => {
                                setDeptLandlineNumbers(department.landlineNumbers ? department.landlineNumbers.join(', ') : '');
                                setEditDeptLandlineMode(true);
                              }}
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="profile-field">
                    <label>Address:</label>
                    <p>{department.address || 'N/A'}</p>
                  </div>
                  <div className="profile-field">
                    <label>City:</label>
                    <p>{department.city?.name || department.city || 'N/A'}</p>
                  </div>
                  <div className="profile-field">
                    <label>Province:</label>
                    <p>{department.province?.name || department.province || 'N/A'}</p>
                  </div>
                  <div className="profile-field">
                    <label>Region:</label>
                    <p>{department.region?.name || department.region || 'N/A'}</p>
                  </div>
                  
                </div>
              ) : (
                <p>Loading department info...</p>
              )}
            </div>
        </div>
      </div>
      </div>
    </AdminLayout>
  );
};

export default DepartmentAdminProfile;