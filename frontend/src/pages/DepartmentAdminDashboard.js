import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthContext from '../hooks/useAuthContext';
import AdminLayout from '../components/AdminLayout';
import io from 'socket.io-client';
import emergencyIcons from '../icons/emergencyIcons';
import '../styles/DepartmentAdminDashboard.css';
import { Howl, Howler } from 'howler';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const SOCKET_URL = 'http://localhost:3000'; // or your server IP

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  function deg2rad(deg) { return deg * (Math.PI / 180); }
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const DepartmentAdminDashboard = () => {
  const { user } = useAuthContext();
  const [showNewReportModal, setShowNewReportModal] = useState(false);
  const [latestReport, setSetLatestReport] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error] = useState(null);
  const [departmentLocation, setDepartmentLocation] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedStatus, setSelectedStatus] = useState('pending');
  const alertSoundRef = useRef(null);
  const [distanceToReport, setDistanceToReport] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(5); // You can make this adjustable if you want
  const [totalPages, setTotalPages] = useState(1);
  const [statusCounts, setStatusCounts] = useState({ pending: 0, in_progress: 0, resolved: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const handleSearch = () => {
  setDebouncedSearch(searchTerm);
  setPage(1); // Reset to first page on new search
};

  // Fetch department location (ensure it's always available)
  useEffect(() => {
  if (!user) {
    console.log('User not loaded yet');
    return;
  }
  if (!user.departmentId) {
    console.log('User has no departmentId:', user);
    return;
  }
  if (typeof user.departmentId !== 'string') {
    console.log('departmentId is not a string:', user.departmentId);
    return;
  }

  const fetchDepartment = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/departments/${user.departmentId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    console.log('Fetched department:', data);
    setDepartmentLocation(data.location);
  };
  fetchDepartment();
}, [user]);

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

  useEffect(() => {
    console.log('departmentLocation:', departmentLocation);
  }, [departmentLocation]);

  useEffect(() => {
    if (showNewReportModal) {
      console.log('latestReport.location:', latestReport?.location);
    }
  }, [showNewReportModal, latestReport]);

  useEffect(() => {
    const departmentId = localStorage.getItem('departmentId');
    if (!departmentId) return;

    const socketInstance = io(SOCKET_URL, { transports: ['websocket'] });

    socketInstance.emit('join_department', `department_${departmentId}`);
    socketInstance.on('new_report', (report) => {
      setReports(prev => [report, ...prev]);
      setSetLatestReport(report);
      setShowNewReportModal(true);
      playAlertSound();
      // Calculate distance
      if (
        report.location &&
        departmentLocation &&
        report.location.latitude && report.location.longitude &&
        departmentLocation.latitude && departmentLocation.longitude
      ) {
        const dist = getDistanceFromLatLonInKm(
          report.location.latitude,
          report.location.longitude,
          departmentLocation.latitude,
          departmentLocation.longitude
        );
        setDistanceToReport(dist);
      } else {
        setDistanceToReport(null);
      }
    });

    return () => socketInstance.disconnect();
    // eslint-disable-next-line
  }, [departmentLocation]);

  useEffect(() => {
    const unlock = () => {
      Howler.autoUnlock = true;
      const silent = new Howl({ src: [require('../assets/silence-audio.mp3')], volume: 0 });
      silent.play();
      window.removeEventListener('click', unlock);
    };
    window.addEventListener('click', unlock);
    return () => window.removeEventListener('click', unlock);
  }, []);

  // Play alert sound in loop
  const playAlertSound = () => {
    if (alertSoundRef.current) {
      alertSoundRef.current.stop();
      alertSoundRef.current.unload();
    }
    const sound = new Howl({
      src: [require('../assets/alert-sound.mp3')],
      volume: 1.0,
      loop: true,
      onload: function() {
        sound.play();
      }
    });
    alertSoundRef.current = sound;
    sound.play();
  };

  // Stop alert sound
  const stopAlertSound = () => {
    if (alertSoundRef.current) {
      alertSoundRef.current.stop();
      alertSoundRef.current.unload();
      alertSoundRef.current = null;
    }
  };

  // Navigation handler for sidebar
  const handleSidebarNavigate = (section) => {
    if (section === 'new-reports') {
      document.getElementById('pending-reports-section')?.scrollIntoView({ behavior: 'smooth' });
      setSelectedStatus('pending');
    }
  };

  useEffect(() => {
    if (location.state?.scrollToPending) {
      setSelectedStatus('pending');
      setTimeout(() => {
        document.getElementById('pending-reports-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }, [location.state]);

  // Handle marking report as in progress
  const handleMarkInProgress = async () => {
    await updateReportStatus(latestReport._id, 'in_progress');
    setShowNewReportModal(false);
  };

  const fetchStatusCounts = useCallback(async () => {
  const token = localStorage.getItem('token');
  const departmentId = localStorage.getItem('departmentId');
  if (!departmentId) return;
  try {
    const res = await fetch(`/api/reports/department/${departmentId}/status-counts`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) setStatusCounts(data);
  } catch {}
}, []);

useEffect(() => {
  fetchStatusCounts();
}, [fetchStatusCounts]);

  // Fetch all reports for this department
  const fetchReports = useCallback(async () => {
  setLoading(true);
  const token = localStorage.getItem('token');
  const departmentId = localStorage.getItem('departmentId');
  if (!departmentId) {
    setReports([]);
    setLoading(false);
    return;
  }
  try {
    const params = new URLSearchParams({
      status: selectedStatus,
      page,
      limit,
      ...(debouncedSearch.trim() && { search: debouncedSearch.trim() })
    });
    const res = await fetch(
      `/api/reports/department/${departmentId}?${params.toString()}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    if (res.ok) {
      setReports(data.reports);
      setTotalPages(data.totalPages);
    } else {
      setReports([]);
      setTotalPages(1);
    }
  } catch {
    setReports([]);
    setTotalPages(1);
  }
  setLoading(false);
}, [selectedStatus, page, limit, debouncedSearch]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Update report status
  const updateReportStatus = async (reportId, newStatus) => {
  // Optimistically update UI
  setReports(reports =>
    reports.map(r => r._id === reportId ? { ...r, status: newStatus } : r)
  );
  setStatusCounts(counts => {
    const updated = { ...counts };
    if (newStatus === 'in_progress') {
      updated.pending = Math.max(0, updated.pending - 1);
      updated.in_progress += 1;
    } else if (newStatus === 'resolved') {
      updated.in_progress = Math.max(0, updated.in_progress - 1);
      updated.resolved += 1;
    }
    return updated;
  });

  // Then send request
  const token = localStorage.getItem('token');
    await fetch(`/api/reports/${reportId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status: newStatus })
  });
  // Optionally, refetch to ensure sync
  fetchReports();
  fetchStatusCounts();
};

  // Mark as Fake
  const markAsFake = async (reportId) => {
    const reason = prompt('Enter reason for marking as fake:');
    if (!reason) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/reports/${reportId}/mark-fake`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fakeReason: reason }),
      });
      if (res.ok) {
        fetchReports();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to mark as fake');
      }
    } catch (e) {
      alert('Failed to mark as fake');
    }
  };

  // Calculate distance when showing modal
  useEffect(() => {
    if (
      showNewReportModal &&
      latestReport &&
      latestReport.location &&
      departmentLocation &&
      latestReport.location.latitude && latestReport.location.longitude &&
      departmentLocation.latitude && departmentLocation.longitude
    ) {
      const dist = getDistanceFromLatLonInKm(
        latestReport.location.latitude,
        latestReport.location.longitude,
        departmentLocation.latitude,
        departmentLocation.longitude
      );
      setDistanceToReport(dist);
    } else {
      setDistanceToReport(null);
    }
  }, [showNewReportModal, latestReport, departmentLocation]);

  if (!user || user.role !== 'departmentAdmin') {
    return <div className="error">Access Denied: You must be a Department Admin to view this page.</div>;
  }

  const filteredReports = reports
  .filter(r => {
    if (selectedStatus === 'fake') return r.isFake;
    return r.status === selectedStatus && !r.isFake;
  })
  .filter(r => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (r.referenceNumber && r.referenceNumber.toLowerCase().includes(term)) ||
      (r.type && r.type.toLowerCase().includes(term)) ||
      (r.subtype && r.subtype.toLowerCase().includes(term)) ||
      (typeof r.address === 'string' && r.address.toLowerCase().includes(term)) ||
      (typeof r.address === 'object' && r.address.display && r.address.display.toLowerCase().includes(term))
    );
  });

  // Map modal for "View on Map"
  const MapModal = ({ open, onClose, report, departmentLocation }) => {
    if (!open || !report?.location || !departmentLocation) return null;
    const userPos = [report.location.latitude, report.location.longitude];
    const deptPos = [departmentLocation.latitude, departmentLocation.longitude];
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div
          className="modal-content"
          style={{
            maxWidth: 900,
            width: '98vw',
            maxHeight: 700,
            background: '#fff',
            borderRadius: 10,
            padding: 16,
            position: 'relative'
          }}
          onClick={e => e.stopPropagation()}
        >
          <button
            style={{
            position: 'absolute',
            top: 8,
            right: 12,
            background: 'transparent',
            border: 'none',
            fontSize: 34,
            cursor: 'pointer',
            color: 'red', // Make the close button red
            fontWeight: 'bold',
            zIndex: 10
          }}
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
          <h3 style={{ marginTop: 0, marginBottom: 12 }}>Emergency Location & Department</h3>
          <MapContainer
            center={userPos}
            zoom={13}
            style={{ height: 500, width: '100%', borderRadius: 8 }}
            scrollWheelZoom={true}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={userPos} icon={redIcon}>
              <Popup>
                Emergency Location<br />
                Lat: {userPos[0]}, Lng: {userPos[1]}
              </Popup>
            </Marker>
            <Marker position={deptPos}icon={L.icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            })}>
              <Popup>
                Department Location<br />
                Lat: {deptPos[0]}, Lng: {deptPos[1]}
              </Popup>
            </Marker>
            <Polyline positions={[userPos, deptPos]} color="red" />
          </MapContainer>
          <div style={{ marginTop: 12, textAlign: 'center' }}>
            <strong>Distance:</strong> {getDistanceFromLatLonInKm(userPos[0], userPos[1], deptPos[0], deptPos[1]).toFixed(2)} km
          </div>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout 
      newReportsCount={statusCounts.pending} 
      onSidebarNavigate={handleSidebarNavigate}>

      {showNewReportModal && latestReport && (
        <div className="modal-backdrop">
          <div className="modal-content alert-modal">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <img
                src={emergencyIcons[latestReport.type]}
                alt={latestReport.type + " icon"}
                style={{ width: 48, height: 48, marginRight: 16 }}
              />
              <h2 style={{ margin: 0, color: '#1976d2', fontWeight: 700 }}>New Emergency Report</h2>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <p><strong>Type:</strong> {latestReport.type}</p>
              <p><strong>Subtype:</strong> {latestReport.subtype}</p>
              <p>
                <strong>Location:</strong><br />
                {latestReport.address
                  ? (typeof latestReport.address === 'string'
                      ? (() => {
                          try {
                            const addr = JSON.parse(latestReport.address);
                            return (
                              <>
                                {addr.display || latestReport.address}
                                {latestReport.location
                                  ? (
                                      <span style={{ color: '#888', fontSize: '0.95em' }}>
                                        <br />
                                        (Lat: {latestReport.location.latitude}, Lng: {latestReport.location.longitude})
                                      </span>
                                    )
                                  : null}
                              </>
                            );
                          } catch {
                            return latestReport.address;
                          }
                        })()
                      : latestReport.address.display || '')
                  : latestReport.location
                    ? `Lat: ${latestReport.location.latitude}, Lng: ${latestReport.location.longitude}`
                    : 'Unknown'}
              </p>
              {latestReport.location && departmentLocation && (
                <div style={{ margin: '8px 0', fontWeight: 500 }}>
                  <button
                    style={{
                      background: '#1976d2',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 5,
                      padding: '6px 16px',
                      cursor: 'pointer',
                      marginBottom: 15
                    }}
                    onClick={() => setShowMapModal(true)}
                  >
                    View on Map
                  </button>
                  <br />
                  <span>
                    <strong>Distance to Emergency:</strong> {distanceToReport !== null ? distanceToReport.toFixed(2) : '--'} km
                  </span>
                </div>
              )}
              <p><strong>Submitted At:</strong>{new Date(latestReport.clientSubmittedAt || latestReport.createdAt).toLocaleString('en-PH', {
                timeZone: 'Asia/Manila',
                hour12: true,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              }) + ' PHT'}
              </p>
            </div>

            {((latestReport.imageURLs && latestReport.imageURLs.length > 0) || (latestReport.videoURLs && latestReport.videoURLs.length > 0)) && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 16,
                flexWrap: 'wrap',
                margin: '1rem 0'
              }}>
                {[
                  ...(latestReport.imageURLs || []).map((url, idx) => (
                    <img
                      key={`img-${idx}`}
                      src={url}
                      alt={`Emergency Scene ${idx + 1}`}
                      style={{ width: 120, height: 'auto', borderRadius: 8, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                      onClick={() => setPreviewImage(url)}
                    />
                  )),
                  ...(latestReport.videoURLs || []).map((url, idx) => (
                    <video
                      key={`vid-${idx}`}
                      src={url}
                      controls
                      style={{ width: 150, height: 'auto', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                    />
                  ))
                ]}
              </div>
            )}

            <div className="modal-actions" style={{ justifyContent: 'center' }}>
              <button onClick={() => {
                setShowNewReportModal(false);
                stopAlertSound();
                navigate(`/ReportDetails/${latestReport._id}`);
              }}>
                View Full Report
              </button>
              <button onClick={() => {
                updateReportStatus(latestReport._id, 'in_progress');
                handleMarkInProgress();
                setShowNewReportModal(false);
                stopAlertSound();
              }}>
                Mark as In Progress
              </button>
            </div>
          </div>
          <MapModal
            open={showMapModal}
            onClose={() => setShowMapModal(false)}
            report={latestReport}
            departmentLocation={departmentLocation}
          />
        </div>
      )}

      {previewImage && (
        <div className="modal-backdrop" onClick={() => setPreviewImage(null)}>
          <div
            className="modal-content"
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: '#fff',
              borderRadius: 10,
              padding: 16,
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              style={{
                position: 'absolute',
                top: 8,
                right: 12,
                background: 'transparent',
                border: 'none',
                fontSize: 28,
                cursor: 'pointer'
              }}
              onClick={() => setPreviewImage(null)}
              aria-label="Close"
            >
              &times;
            </button>
            <img
              src={previewImage}
              alt="Preview"
              style={{ maxWidth: '80vw', maxHeight: '80vh', borderRadius: 8 }}
            />
          </div>
        </div>
      )}

      <div className="department-admin-dashboard">
        <h1 className="dashboard-title">Police Department Admin Dashboard</h1>
        {error && <p className="error">{error}</p>}

        <div className="status-cards-container">
          <div
            className={`status-card${selectedStatus === 'pending' ? ' selected' : ''}`}
            onClick={() => {
              setSelectedStatus('pending');
              setPage(1);
            }}
          >
            <h3>Pending Reports</h3>
            <div className="status-count">{statusCounts.pending}</div>
          </div>
          <div
            className={`status-card${selectedStatus === 'in_progress' ? ' selected' : ''}`}
            onClick={() => {
              setSelectedStatus('in_progress');
              setPage(1);
            }}
          >
            <h3>In Progress Reports</h3>
            <div className="status-count">{statusCounts.in_progress}</div>
          </div>
          <div
            className={`status-card${selectedStatus === 'resolved' ? ' selected' : ''}`}
            onClick={() => {
              setSelectedStatus('resolved');
              setPage(1);
            }}
          >
            <h3>Resolved Reports</h3>
            <div className="status-count">{statusCounts.resolved}</div>
          </div>
          <div
            className={`status-card${selectedStatus === 'fake' ? ' selected' : ''}`}
            onClick={() => {
              setSelectedStatus('fake');
              setPage(1);
            }}
          >
            <h3>Fake Reports</h3>
            <div className="status-count">{statusCounts.fake}</div>
          </div>
        </div>

        <div className="reports-table-container" id="pending-reports-section">
          {/* <h2 style={{color:'#2d2f35', marginBottom: 40, marginTop: 80}}>
            {selectedStatus === 'pending' && 'Pending Reports'}
            {selectedStatus === 'in_progress' && 'In Progress Reports'}
            {selectedStatus === 'resolved' && 'Resolved Reports'}
          </h2> */}

          <div style={{ marginBottom: 70, textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0 }}>
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              aria-label="Search reports"
              style={{
                padding: '15px 20px',
                borderRadius: '6px 0 0 6px',
                border: '1px solid #bbb',
                fontSize: '1.1rem',
                width: 650,
                outline: 'none'
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSearch();
              }}
            />
            <button
              onClick={handleSearch}
              style={{
                padding: '15px 28px',
                borderRadius: '0 6px 6px 0',
                border: '1px solid #1976d2',
                background: '#1976d2',
                color: '#fff',
                fontSize: '1.1rem',
                fontWeight: 600,
                cursor: 'pointer',
                borderLeft: 'none',
                height: 58
              }}
              aria-label="Search"
            >
              Search
            </button>
          </div>
          
          <table className="reports-table">
            <thead>
              <tr>
                <th>Reference #</th>
                <th>Type</th>
                <th>Subtype</th>
                <th>Time Submitted</th>
                <th>Location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7}>Loading...</td></tr>
              ) : filteredReports.length === 0 ? (
                <tr><td colSpan={7}>No reports found.</td></tr>
              ) : (
                filteredReports.map(report => (
                  <tr key={report._id}>
                    <td>{report.referenceNumber}</td>
                    <td>{report.type}</td>
                    <td>{report.subtype}</td>
                    <td>{new Date(report.clientSubmittedAt || report.createdAt).toLocaleString('en-PH', {
                      timeZone: 'Asia/Manila',
                      hour12: true,
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    }) + ' PHT'}</td>
                    <td>
                      {report.address
                        ? (typeof report.address === 'string'
                            ? (() => {
                                try {
                                  const addr = JSON.parse(report.address);
                                  return (
                                    <>
                                      {addr.display || report.address}
                                      {report.location
                                        ? (
                                            <span style={{ color: '#888', fontSize: '0.95em' }}>
                                              <br />
                                              ({report.location.latitude}, {report.location.longitude})
                                            </span>
                                          )
                                        : null}
                                    </>
                                  );
                                } catch {
                                  return report.address;
                                }
                              })()
                            : report.address.display || '')
                        : report.location
                          ? `Lat: ${report.location.latitude}, Lng: ${report.location.longitude}`
                          : 'Unknown'}
                    </td>
                    <td>{report.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>

                    <td>
                      <div className="action-buttons-block">
                        {selectedStatus === 'fake' ? (
                          // Only show View Details for fake reports
                          <button
                            className="details-btn"
                            aria-label="View Details"
                            onClick={() => navigate(`/ReportDetails/${report._id}`)}
                          >
                            View Details
                          </button>
                        ) : (
                          <>
                            {report.status === 'pending' && (
                              <>
                                <button
                                  className="in-progress-btn"
                                  aria-label="Mark as In Progress"
                                  onClick={() => updateReportStatus(report._id, 'in_progress')}
                                >
                                  Mark In Progress
                                </button>
                                {!report.isFake && (
                                  <button
                                    className="fake-btn"
                                    onClick={() => markAsFake(report._id)}
                                    disabled={report.isFake}
                                    aria-label="Mark as Fake"
                                  >
                                    Mark as Fake
                                  </button>
                                )}
                              </>
                            )}
                            {report.status === 'in_progress' && (
                              <>
                                <button
                                  className="resolve-btn"
                                  aria-label="Mark Resolved"
                                  onClick={() => updateReportStatus(report._id, 'resolved')}
                                >
                                  Mark Resolved
                                </button>
                                {!report.isFake && (
                                  <button
                                    className="fake-btn"
                                    onClick={() => markAsFake(report._id)}
                                    disabled={report.isFake}
                                    aria-label="Mark as Fake"
                                  >
                                    Mark as Fake
                                  </button>
                                )}
                              </>
                            )}
                            <button
                              className="details-btn"
                              aria-label="View Details"
                              onClick={() => navigate(`/ReportDetails/${report._id}`)}
                            >
                              View Details
                            </button>
                          </>
                        )}
                      </div>
</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination Controls */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 100, marginTop: 80 }}>
            <button
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              disabled={page === 1}
              style={{ padding: '6px 16px', fontSize: 15, borderRadius: 6, border: '1px solid #1976d2', background: page === 1 ? '#eee' : '#1976d2', color: page === 1 ? '#888' : '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
            >
              Previous
            </button>
            <span>Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              style={{ padding: '6px 16px', fontSize: 15, borderRadius: 6, border: '1px solid #1976d2', background: page === totalPages ? '#eee' : '#1976d2', color: page === totalPages ? '#888' : '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default DepartmentAdminDashboard;