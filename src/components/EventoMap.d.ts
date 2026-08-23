import React from 'react';

export interface EventoMapMarker {
  _id?: string;
  title?: string;
  location?: string;
  date?: string;
  createdAt?: string;
  lat?: number;
  lng?: number;
  availability?: Array<{
    date?: string;
    isAvailable?: boolean;
    note?: string;
  }>;
}

export interface EventoMapLocation {
  lat: number;
  lng: number;
  source?: 'map' | 'geolocation';
}

export interface EventoMapProps {
  events?: EventoMapMarker[];
  selectedLocation?: EventoMapLocation | null;
  onLocationSelect?: (location: EventoMapLocation) => void;
  selectable?: boolean;
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
  selectedLabel?: string;
  height?: number | string;
  className?: string;
}

export const EventoMap: React.ComponentType<EventoMapProps>;
