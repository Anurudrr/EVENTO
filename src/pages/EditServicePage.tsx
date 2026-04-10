import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { serviceService } from '../services/serviceService';
import { ServiceForm } from '../components/ServiceForm';
import { Service } from '../types';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../utils';
import { Skeleton } from '../components/ui/Skeleton';

const EditServicePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    let mounted = true;

    const loadService = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadError('');

      try {
        const data = await serviceService.getService(id);
        if (mounted) {
          setService(data);
        }
      } catch (error) {
        if (mounted) {
          setService(null);
          setLoadError(getErrorMessage(error, 'Unable to load service'));
          showToast(getErrorMessage(error, 'Unable to load service'), 'error');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadService();

    return () => {
      mounted = false;
    };
  }, [id, showToast]);

  const handleUpdate = async (formData: FormData) => {
    if (!id) return;

    try {
      const updatedService = await serviceService.updateService(id, formData);
      setService(updatedService);
      showToast('Service updated', 'success');
    } catch (error) {
      showToast(getErrorMessage(error, 'Unable to update service'), 'error');
      throw error;
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-8">
        <div>
          <h1 className="text-3xl font-display font-semibold text-noir-ink uppercase tracking-wide mb-3">Edit service</h1>
          <p className="text-noir-muted uppercase tracking-normal">Update your live service catalog.</p>
        </div>

        {!loading && service ? (
          <ServiceForm key={service._id} initialData={service} onSubmit={handleUpdate} submitLabel="Save changes" />
        ) : !loading ? (
          <div className="border border-rose-500/20 bg-rose-500/10 p-6 text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-rose-500">
            {loadError || 'Unable to load this service.'}
          </div>
        ) : (
          <Skeleton className="h-[38rem] w-full" />
        )}
      </div>
    </DashboardLayout>
  );
};

export default EditServicePage;
