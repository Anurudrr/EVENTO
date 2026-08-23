import React, { Suspense, lazy, useMemo } from 'react';
import {
  CalendarClock,
  Check,
  Clock3,
  Loader2,
  Phone,
  ShieldCheck,
  Star,
  Users,
} from 'lucide-react';
import type { AvailabilityEntry, Service, ServiceLocation } from '../../types';
import {
  formatCoordinates,
  formatDate,
  formatPriceLabel,
  formatServicePrice,
} from '../../utils';
import { useNearViewport } from '../../hooks/useNearViewport';

const LocationPicker = lazy(() => import('../LocationPicker').then((module) => ({ default: module.LocationPicker })));

export interface ServiceBookingFormState {
  contactName: string;
  phone: string;
  eventType: string;
  eventLocation: string;
  date: string;
  time: string;
  guests: string;
  notes: string;
}

interface ServiceBookingPanelProps {
  service: Service;
  bookingForm: ServiceBookingFormState;
  blockedDates: AvailabilityEntry[];
  selectedServiceLocation: ServiceLocation | null;
  submitting: boolean;
  eventTypes: string[];
  onFieldChange: (field: keyof ServiceBookingFormState, value: string) => void;
  onLocationSelect: (location: ServiceLocation) => void;
  onSubmit: () => void;
}

export const ServiceBookingPanel: React.FC<ServiceBookingPanelProps> = ({
  service,
  bookingForm,
  blockedDates,
  selectedServiceLocation,
  submitting,
  eventTypes,
  onFieldChange,
  onLocationSelect,
  onSubmit,
}) => {
  const { ref: locationPickerRef, isNearViewport: showLocationPicker } = useNearViewport<HTMLDivElement>('220px');
  const minBookingDate = useMemo(() => new Date().toISOString().split('T')[0], []);

  return (
    <div className="sticky top-32 space-y-8">
      <div className="border border-noir-border bg-noir-card p-8 md:p-10">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-mono font-semibold uppercase tracking-[0.4em] text-noir-accent">Book this service</div>
            <div className="mt-3 text-3xl font-display font-semibold text-noir-ink">{formatServicePrice(service.price)}</div>
            <p className="mt-2 text-xs uppercase tracking-wide text-noir-muted">{formatPriceLabel(service.price, service.priceLabel)}</p>
          </div>
          <div className="border border-noir-border bg-noir-bg px-4 py-3 text-right">
            <div className="text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-noir-accent">Rating</div>
            <div className="mt-2 flex items-center justify-end gap-2 text-sm font-semibold uppercase tracking-wide text-noir-ink">
              <Star className="h-4 w-4 text-noir-accent" />
              {service.reviews ? Number(service.rating || 0).toFixed(1) : 'New'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-noir-accent">Contact name</label>
              <input
                type="text"
                value={bookingForm.contactName}
                onChange={(event) => onFieldChange('contactName', event.target.value)}
                placeholder="Your full name"
                className="w-full border border-noir-border bg-noir-bg px-5 py-4 text-noir-ink focus:border-noir-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-noir-accent">Phone number</label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-noir-muted" />
                <input
                  type="tel"
                  value={bookingForm.phone}
                  onChange={(event) => onFieldChange('phone', event.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full border border-noir-border bg-noir-bg py-4 pl-11 pr-5 text-noir-ink focus:border-noir-accent focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-noir-accent">Event type</label>
              <select
                value={bookingForm.eventType}
                onChange={(event) => onFieldChange('eventType', event.target.value)}
                className="w-full border border-noir-border bg-noir-bg px-5 py-4 text-noir-ink focus:border-noir-accent focus:outline-none"
              >
                {eventTypes.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-noir-accent">Guests</label>
              <input
                type="number"
                min="1"
                value={bookingForm.guests}
                onChange={(event) => onFieldChange('guests', event.target.value)}
                className="w-full border border-noir-border bg-noir-bg px-5 py-4 text-noir-ink focus:border-noir-accent focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-noir-accent">Event location</label>
            <input
              type="text"
              value={bookingForm.eventLocation}
              onChange={(event) => onFieldChange('eventLocation', event.target.value)}
              placeholder="Venue or city"
              className="w-full border border-noir-border bg-noir-bg px-5 py-4 text-noir-ink focus:border-noir-accent focus:outline-none"
            />
          </div>

          <div ref={locationPickerRef} className="border border-noir-border bg-noir-bg p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <label className="block text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-noir-accent">Service pin</label>
                <p className="mt-2 text-xs uppercase tracking-wide text-noir-muted">
                  Select the exact venue where the organizer should deliver the service.
                </p>
              </div>
              <div className="text-[10px] font-mono font-semibold uppercase tracking-[0.25em] text-noir-ink">
                {selectedServiceLocation ? formatCoordinates(selectedServiceLocation) : 'Location required'}
              </div>
            </div>

            <div className="mt-5">
              {showLocationPicker ? (
                <Suspense fallback={<div className="h-[300px] border border-noir-border bg-white/80 skeleton-shimmer" />}>
                  <LocationPicker
                    selectedLocation={selectedServiceLocation}
                    onLocationSelect={(location) => onLocationSelect({ lat: location.lat, lng: location.lng })}
                    height={300}
                    title="Selected service location"
                  />
                </Suspense>
              ) : (
                <div className="h-[300px] border border-noir-border bg-white/80 skeleton-shimmer" />
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-noir-accent">Booking date</label>
              <input
                type="date"
                value={bookingForm.date}
                onChange={(event) => onFieldChange('date', event.target.value)}
                min={minBookingDate}
                className="w-full border border-noir-border bg-noir-bg px-5 py-4 text-noir-ink focus:border-noir-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-noir-accent">Time</label>
              <div className="relative">
                <Clock3 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-noir-muted" />
                <input
                  type="time"
                  value={bookingForm.time}
                  onChange={(event) => onFieldChange('time', event.target.value)}
                  className="w-full border border-noir-border bg-noir-bg py-4 pl-11 pr-5 text-noir-ink focus:border-noir-accent focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-noir-accent">Special requests</label>
            <textarea
              value={bookingForm.notes}
              onChange={(event) => onFieldChange('notes', event.target.value)}
              rows={4}
              placeholder="Tell the organizer about style, venue, timings, or custom requests"
              className="w-full border border-noir-border bg-noir-bg px-5 py-4 text-noir-ink focus:border-noir-accent focus:outline-none"
            />
          </div>
        </div>

        <button
          onClick={onSubmit}
          disabled={submitting || !selectedServiceLocation}
          className="btn-noir mt-8 flex w-full items-center justify-center gap-3 !rounded-none !py-5"
        >
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CalendarClock className="h-5 w-5" />}
          {selectedServiceLocation ? 'Book Now' : 'Select Service Location'}
        </button>

        <div className="mt-8 space-y-3 border-t border-noir-border pt-8 text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-noir-muted">
          <div className="flex items-center gap-3"><Check className="h-4 w-4 text-noir-accent" /> Secure checkout supports Razorpay automation with UPI fallback when needed</div>
          <div className="flex items-center gap-3"><Users className="h-4 w-4 text-noir-accent" /> Guest count, event type, and phone number are shared with the organizer</div>
          <div className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-noir-accent" /> Listing policies and organizer verification status are visible before payment</div>
        </div>
      </div>

      {blockedDates.length > 0 && (
        <div className="border border-noir-border bg-noir-card p-8">
          <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.35em] text-noir-accent">Unavailable dates</p>
          <div className="mt-4 space-y-3">
            {blockedDates.slice(0, 5).map((entry) => (
              <div key={entry.date} className="border border-noir-border bg-noir-bg px-4 py-3">
                <p className="text-sm font-display font-semibold uppercase tracking-wide text-noir-ink">{formatDate(entry.date)}</p>
                {entry.note && <p className="mt-2 text-xs uppercase tracking-wide text-noir-muted">{entry.note}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
