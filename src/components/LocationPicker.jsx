import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, LocateFixed, MapPin } from 'lucide-react';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatCoordinates } from '../utils';

const VADODARA_CENTER = {
  lat: 22.3072,
  lng: 73.1812,
};

const DEFAULT_ZOOM = 12;

const selectedMarkerIcon = L.divIcon({
  className: 'evento-map__marker evento-map__marker--selected',
  html: '<span></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -12],
});

const joinClassNames = (...classes) => classes.filter(Boolean).join(' ');

const toCoordinate = (value, min, max) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    return undefined;
  }

  return parsed;
};

const normalizeLocation = (value) => {
  const lat = toCoordinate(value?.lat, -90, 90);
  const lng = toCoordinate(value?.lng, -180, 180);

  if (lat === undefined || lng === undefined) {
    return null;
  }

  return { lat, lng };
};

const roundCoordinate = (value) => Number(value.toFixed(6));

const ViewportController = ({ center, selectedLocation }) => {
  const map = useMap();
  const centerKey = `${center.lat}:${center.lng}`;
  const selectedKey = selectedLocation ? `${selectedLocation.lat}:${selectedLocation.lng}` : '';

  useEffect(() => {
    const resizeTimer = window.setTimeout(() => {
      map.invalidateSize({ pan: false });
    }, 100);

    if (selectedLocation) {
      map.flyTo([selectedLocation.lat, selectedLocation.lng], 15, {
        animate: true,
        duration: 0.65,
      });
    } else {
      map.flyTo([center.lat, center.lng], DEFAULT_ZOOM, {
        animate: true,
        duration: 0.55,
      });
    }

    return () => window.clearTimeout(resizeTimer);
  }, [map, centerKey, selectedKey, center, selectedLocation]);

  return null;
};

const MapSelectionHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click(event) {
      if (typeof onLocationSelect !== 'function') {
        return;
      }

      onLocationSelect({
        lat: roundCoordinate(event.latlng.lat),
        lng: roundCoordinate(event.latlng.lng),
        source: 'map',
      });
    },
  });

  return null;
};

export const LocationPicker = React.memo(function LocationPicker({
  selectedLocation = null,
  onLocationSelect,
  className = '',
  height = 360,
  title = 'Selected service location',
}) {
  const [mapCenter, setMapCenter] = useState(VADODARA_CENTER);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  const normalizedSelectedLocation = useMemo(
    () => normalizeLocation(selectedLocation),
    [selectedLocation],
  );

  useEffect(() => {
    if (normalizedSelectedLocation) {
      setMapCenter(normalizedSelectedLocation);
    }
  }, [normalizedSelectedLocation]);

  useEffect(() => {
    let isMounted = true;

    if (normalizedSelectedLocation || typeof navigator === 'undefined' || !navigator.geolocation) {
      return () => {
        isMounted = false;
      };
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!isMounted) {
          return;
        }

        setMapCenter({
          lat: roundCoordinate(position.coords.latitude),
          lng: roundCoordinate(position.coords.longitude),
        });
        setIsLocating(false);
      },
      () => {
        if (!isMounted) {
          return;
        }

        setMapCenter(VADODARA_CENTER);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000,
      },
    );

    return () => {
      isMounted = false;
    };
  }, [normalizedSelectedLocation]);

  const handleLocationSelect = (nextLocation) => {
    setLocationError('');
    setMapCenter({
      lat: nextLocation.lat,
      lng: nextLocation.lng,
    });

    if (typeof onLocationSelect === 'function') {
      onLocationSelect(nextLocation);
    }
  };

  const handleUseMyLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationError('Browser geolocation is unavailable on this device.');
      return;
    }

    setIsLocating(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          lat: roundCoordinate(position.coords.latitude),
          lng: roundCoordinate(position.coords.longitude),
          source: 'geolocation',
        };

        setIsLocating(false);
        handleLocationSelect(nextLocation);
      },
      (error) => {
        setIsLocating(false);
        setLocationError(error.message || 'Unable to access your current location.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  };

  const mapHeight = typeof height === 'number' ? `${height}px` : height;

  return (
    <div className={joinClassNames('evento-map', className)}>
      <div
        className="evento-map__surface"
        style={{ height: mapHeight, minHeight: mapHeight }}
        data-lenis-prevent
      >
        <MapContainer
          center={[mapCenter.lat, mapCenter.lng]}
          zoom={DEFAULT_ZOOM}
          className="evento-map__canvas"
          preferCanvas
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ViewportController center={mapCenter} selectedLocation={normalizedSelectedLocation} />
          <MapSelectionHandler onLocationSelect={handleLocationSelect} />

          {normalizedSelectedLocation && (
            <Marker
              position={[normalizedSelectedLocation.lat, normalizedSelectedLocation.lng]}
              icon={selectedMarkerIcon}
              draggable
              eventHandlers={{
                dragend(event) {
                  const nextPoint = event.target.getLatLng();
                  handleLocationSelect({
                    lat: roundCoordinate(nextPoint.lat),
                    lng: roundCoordinate(nextPoint.lng),
                    source: 'map',
                  });
                },
              }}
            >
              <Popup>
                <div className="evento-map__popup">
                  <p className="evento-map__popup-eyebrow">{title}</p>
                  <h3 className="evento-map__popup-title">Service pin</h3>
                  <p className="evento-map__popup-copy">{formatCoordinates(normalizedSelectedLocation)}</p>
                  <p className="evento-map__popup-copy">Drag the marker or tap elsewhere to refine the pin.</p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>

        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={isLocating}
          className="evento-map__control"
        >
          {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
          Use My Location
        </button>

        {isLocating && (
          <div className="evento-map__overlay">
            <Loader2 className="h-5 w-5 animate-spin text-noir-accent" />
            <span>Locating you</span>
          </div>
        )}
      </div>

      <div className="evento-map__meta">
        <div className="evento-map__status">
          <MapPin className="h-4 w-4 text-noir-accent" />
          <span>
            {normalizedSelectedLocation
              ? `${title}: ${formatCoordinates(normalizedSelectedLocation)}`
              : 'Click the map to place the service marker, then drag to fine-tune it.'}
          </span>
        </div>
      </div>

      {locationError && (
        <div className="evento-map__error">
          {locationError}
        </div>
      )}
    </div>
  );
});
