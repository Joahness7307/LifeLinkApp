import AdminLayout from '../components/AdminLayout';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import '../styles/ReportDetails.css';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

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

const ReportDetailsPage = () => {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [departmentLocation, setDepartmentLocation] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [previewMedia, setPreviewMedia] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReport = async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/reports/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setReport(data);
      // Fetch department location if available in report
      if (data.departmentId) {
        const depRes = await fetch(`/api/departments/${data.departmentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const depData = await depRes.json();
        setDepartmentLocation(depData.location);
      }
    };
    fetchReport();
  }, [id]);

  const updateReportStatus = async (newStatus) => {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`/api/reports/${report._id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) {
      const updated = await res.json();
      setReport(updated);
    } else {
      alert('Failed to update status');
    }
  } catch {
    alert('Failed to update status');
  }
};

const markAsFake = async (reason) => {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`/api/reports/${report._id}/mark-fake`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ fakeReason: reason })
    });
    if (res.ok) {
      const updated = await res.json();
      setReport(updated.report || updated);
    } else {
      alert('Failed to mark as fake');
    }
  } catch {
    alert('Failed to mark as fake');
  }
};

  // Fetch pending reports count for sidebar badge
  useEffect(() => {
    const fetchPendingCount = async () => {
      const token = localStorage.getItem('token');
      const departmentId = localStorage.getItem('departmentId');
      if (!departmentId) return;
      try {
        const res = await fetch(`/api/reports/department/${departmentId}/status-counts`, {
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

  if (!report) return <div>Loading...</div>;

  // MapModal component
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
              color: 'red',
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
            <Marker position={deptPos} icon={L.icon({
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
    <AdminLayout newReportsCount={pendingCount} onSidebarNavigate={handleSidebarNavigate}>
      <div className="report-details">
        <h2>Report Details</h2>
        <p><strong>Type: </strong> {report.type}</p>
        <p><strong>Subtype: </strong> {report.subtype}</p>
        <p><strong>Status: </strong> {report.status}</p>
        {report.isFake && (
          <p style={{ color: 'red', fontWeight: 'bold', marginTop: 8 }}>
            🚩 Marked as Fake{report.fakeReason ? `: ${report.fakeReason}` : ''}
          </p>
        )}
        <p>
          <strong>Location: </strong>
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
        </p>
        {/* View on Map Button */}
        {report.location && departmentLocation && (
          <div className="map-button-container">
            <button
              onClick={() => setShowMapModal(true)}
            >
              View on Map
            </button>
            <br />
            <span>
              <strong>Distance to Emergency:</strong> {getDistanceFromLatLonInKm(
                report.location.latitude,
                report.location.longitude,
                departmentLocation.latitude,
                departmentLocation.longitude
              ).toFixed(2)} km
            </span>
          </div>
        )}
        <MapModal
          open={showMapModal}
          onClose={() => setShowMapModal(false)}
          report={report}
          departmentLocation={departmentLocation}
        />
        <p><strong>Reporter Contact:</strong> {report.userId && report.userId.contactNumber ? report.userId.contactNumber : 'N/A'}</p>
        <p><strong>Submitted At: </strong> {new Date(report.clientSubmittedAt || report.createdAt).toLocaleString('en-PH', {
          timeZone: 'Asia/Manila',
          hour12: true,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })} PHT</p>
        {(report.imageURLs?.length > 0 || report.videoURLs?.length > 0) && (
          <div className="media-section">
            <div className="media-label"><strong>Media</strong></div>
            <div className="media-list">
              {[
                ...(report.imageURLs || []).map((url, idx) => (
                  <img
                    key={`img-${idx}`}
                    src={url}
                    alt={`img${idx}`}
                    onClick={() => setPreviewMedia({ type: 'image', url })}
                    style={{ cursor: 'pointer' }}
                  />
                )),
                ...(report.videoURLs || []).map((url, idx) => (
                  <video
                    key={`vid-${idx}`}
                    src={url}
                    controls
                    onClick={() => setPreviewMedia({ type: 'video', url })}
                    style={{ cursor: 'pointer' }}
                  />
                ))
              ]}
            </div>
          </div>
        )}

        {report.status === 'pending' && (
          <div className="action-buttons-row">
            <button
              style={{ background: '#df6800' }}
              onClick={async () => {
                await updateReportStatus('in_progress');
              }}
            >
              Mark as In Progress
            </button>
            <button
              style={{ background: '#e53935' }}
              onClick={async () => {
                const reason = prompt('Enter reason for marking as fake:');
                if (reason) await markAsFake(reason);
              }}
            >
              Mark as Fake
            </button>
          </div>
        )}
        {report.status === 'in_progress' && (
          <div className="action-buttons-row">
            <button
              style={{ background: '#4caf50' }}
              onClick={async () => {
                await updateReportStatus('resolved');
              }}
            >
              Mark as Resolved
            </button>
            <button
              style={{ background: '#e53935' }}
              onClick={async () => {
                const reason = prompt('Enter reason for marking as fake:');
                if (reason) await markAsFake(reason);
              }}
            >
              Mark as Fake
            </button>
          </div>
        )}

      </div>

        {previewMedia && (
          <div className="modal-backdrop" onClick={() => setPreviewMedia(null)}>
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
                  cursor: 'pointer',
                  zIndex: 2,
                  pointerEvents: 'auto'
                }}
                onClick={e => {
                  e.stopPropagation();
                  setPreviewMedia(null);
                }}
                aria-label="Close"
              >
                &times;
              </button>
              {previewMedia.type === 'image' ? (
                <img
                  src={previewMedia.url}
                  alt="Preview"
                  style={{ maxWidth: '80vw', maxHeight: '80vh', borderRadius: 8 }}
                />
              ) : (
                <video
                  src={previewMedia.url}
                  controls
                  autoPlay
                  style={{ maxWidth: '80vw', maxHeight: '80vh', borderRadius: 8, pointerEvents: 'none' }}
                />
              )}
            </div>
          </div>
        )}

    </AdminLayout>
  );
};

export default ReportDetailsPage;