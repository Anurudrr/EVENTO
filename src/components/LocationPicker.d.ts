import React from 'react';
import type { ServiceLocation } from '../types';

export interface LocationPickerProps {
  selectedLocation?: ServiceLocation | null;
  onLocationSelect?: (location: ServiceLocation & { source?: 'map' | 'geolocation' }) => void;
  className?: string;
  height?: number | string;
  title?: string;
}

export const LocationPicker: React.ComponentType<LocationPickerProps>;
