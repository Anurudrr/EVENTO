import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { serviceService } from '../services/serviceService';
import { Service } from '../types';
import {
  FALLBACK_IMAGE_URL,
  formatPriceLabel,
  formatServicePrice,
  getErrorMessage,
  getServiceTitle,
} from '../utils';
import { Skeleton } from '../components/ui/Skeleton';

const MyServicesPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const loadServices = async () => {
    if (!user?._id) {
      return;
    }

    setLoading(true);
    try {
      const data = await serviceService.getOrganizerServices(user._id);
      setServices(data);
    } catch (error) {
      showToast(getErrorMessage(error, 'Unable to load your services'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadServices();
  }, [user?._id]);

  const handleDelete = async (id: string) => {
    try {
      await serviceService.deleteService(id);
      showToast('Service deleted', 'success');
      await loadServices();
    } catch (error) {
      showToast(getErrorMessage(error, 'Unable to delete service'), 'error');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="mb-3 text-3xl font-display font-semibold uppercase tracking-wide text-noir-ink">My services</h1>
            <p className="uppercase tracking-normal text-noir-muted">Manage your live service catalog.</p>
          </div>
          <Link to="/dashboard/create-service" className="btn-noir !rounded-none">Create new</Link>
        </div>

        <div className="space-y-4">
          {loading ? Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-36 w-full" />
          )) : services.map((service) => (
            <div key={service._id} className="flex flex-col gap-5 border border-noir-border bg-noir-card p-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-5">
                <img
                  src={service.images[0] || FALLBACK_IMAGE_URL}
                  alt={getServiceTitle(service)}
                  className="h-24 w-24 border border-noir-border object-cover"
                  onError={(event) => {
                    (event.target as HTMLImageElement).src = FALLBACK_IMAGE_URL;
                  }}
                />
                <div>
                  <div className="text-lg font-display font-semibold uppercase tracking-wide text-noir-ink">{getServiceTitle(service)}</div>
                  <div className="mt-2 text-[10px] font-mono font-semibold uppercase tracking-[0.4em] text-noir-muted">
                    {service.category || 'General'} | {formatServicePrice(service.price)}
                  </div>
                  <div className="mt-2 text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-noir-muted">
                    {formatPriceLabel(service.price, service.priceLabel)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Link to={`/dashboard/edit-service/${service._id}`} className="btn-outline-noir !rounded-none">Edit</Link>
                <Link to={`/event/${service._id}`} className="btn-outline-noir !rounded-none">View</Link>
                <button onClick={() => handleDelete(service._id)} className="btn-noir !rounded-none !bg-rose-600 hover:!bg-rose-700">
                  Delete
                </button>
              </div>
            </div>
          ))}

          {!loading && services.length === 0 && (
            <div className="border border-noir-border bg-noir-card p-8 uppercase tracking-normal text-noir-muted">
              No services posted yet.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MyServicesPage;
