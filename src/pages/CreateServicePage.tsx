import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { serviceService } from '../services/serviceService';
import { ServiceForm } from '../components/ServiceForm';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../utils';

const CreateServicePage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleCreate = async (formData: FormData) => {
    try {
      await serviceService.createService(formData);
      showToast('Service published', 'success');
      navigate('/dashboard/my-services');
    } catch (error) {
      showToast(getErrorMessage(error, 'Unable to create service'), 'error');
      throw error;
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-8">
        <div>
          <h1 className="text-3xl font-display font-semibold text-noir-ink uppercase tracking-wide mb-3">Create service</h1>
          <p className="text-noir-muted uppercase tracking-normal">Publish a new organizer service with pricing and portfolio images.</p>
        </div>

        <ServiceForm onSubmit={handleCreate} submitLabel="Publish service" />
      </div>
    </DashboardLayout>
  );
};

export default CreateServicePage;
