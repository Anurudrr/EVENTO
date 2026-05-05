import React, { useEffect, useMemo } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { formatCoordinates } from '../utils';

const VADODARA_CENTER = [22.3072, 73.1812];

const sellerMarkerIcon = L.divIcon({
  className: 'order-location-map__marker order-location-map__marker--seller',
  html: '<span></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -12],
});

const buyerMarkerIcon = L.divIcon({
  className: 'order-location-map__marker order-location-map__marker--buyer',
  html: '<span></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -12],
});

const ViewportController = ({ sellerLocation, buyerLocation }) => {
  const map = useMap();

  const locations = useMemo(
    () => [sellerLocation, buyerLocation].filter(Boolean),
    [sellerLocation, buyerLocation],
  );

  const locationKey = locations.map((location) => `${location.lat}:${location.lng}`).join('|');

  useEffect(() => {
    const resizeTimer = window.setTimeout(() => {
      map.invalidateSize({ pan: false });
    }, 100);

    if (locations.length === 0) {
      map.setView(VADODARA_CENTER, 11, { animate: false });
      return () => window.clearTimeout(resizeTimer);
    }

    if (locations.length === 1) {
      const [location] = locations;
      map.flyTo([location.lat, location.lng], 14, {
        animate: true,
        duration: 0.65,
      });

      return () => window.clearTimeout(resizeTimer);
    }

    const bounds = L.latLngBounds(locations.map((location) => [location.lat, location.lng]));
    map.flyToBounds(bounds, {
      animate: true,
      duration: 0.7,
      maxZoom: 14,
      padding: [28, 28],
    });

    return () => window.clearTimeout(resizeTimer);
  }, [locationKey, locations, map]);

  return null;
};

export const OrderLocationMap = ({
  sellerLocation,
  buyerLocation,
  height = 260,
}) => {
  const mapHeight = typeof height === 'number' ? `${height}px` : height;

  return (
    <div className="evento-map">
      <div
        className="evento-map__surface"
        style={{ height: mapHeight, minHeight: mapHeight }}
        data-lenis-prevent
      >
        <MapContainer
          center={VADODARA_CENTER}
          zoom={12}
          className="evento-map__canvas"
          preferCanvas
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ViewportController sellerLocation={sellerLocation} buyerLocation={buyerLocation} />

          {sellerLocation && (
            <Marker position={[sellerLocation.lat, sellerLocation.lng]} icon={sellerMarkerIcon}>
              <Popup>
                <div className="evento-map__popup">
                  <p className="evento-map__popup-eyebrow">Seller pin</p>
                  <h3 className="evento-map__popup-title">Organizer location</h3>
                  <p className="evento-map__popup-copy">{formatCoordinates(sellerLocation)}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {buyerLocation && (
            <Marker position={[buyerLocation.lat, buyerLocation.lng]} icon={buyerMarkerIcon}>
              <Popup>
                <div className="evento-map__popup">
                  <p className="evento-map__popup-eyebrow">Buyer pin</p>
                  <h3 className="evento-map__popup-title">Service location</h3>
                  <p className="evento-map__popup-copy">{formatCoordinates(buyerLocation)}</p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      <div className="evento-map__meta">
        {sellerLocation && (
          <div className="evento-map__status">
            <span>Seller: {formatCoordinates(sellerLocation)}</span>
          </div>
        )}
        {buyerLocation && (
          <div className="evento-map__status">
            <span>Buyer: {formatCoordinates(buyerLocation)}</span>
          </div>
        )}
      </div>
    </div>
  );
};
