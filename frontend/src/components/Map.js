import React, { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';

const Map = ({ latitude, longitude }) => {
  useEffect(() => {
    // console.log('Initializing map with Latitude:', latitude, 'Longitude:', longitude);

    // Check if the map container already exists and clean it up
    const mapContainerId = 'map';
    if (L.DomUtil.get(mapContainerId)) {
      L.DomUtil.get(mapContainerId)._leaflet_id = null; // Reset the map container
    }

    // Initialize the map
    const map = L.map(mapContainerId).setView([latitude, longitude], 13);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Add a marker to the map
    L.marker([latitude, longitude]).addTo(map);

    // Cleanup the map on component unmount
    return () => {
      map.remove();
    };
  }, [latitude, longitude]);

  return <div id="map" style={{ width: '100%', height: '400px' }}></div>;
};

export default Map;