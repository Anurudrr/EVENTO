import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, UploadCloud, X } from 'lucide-react';
import { SERVICE_CATEGORIES } from '../constants';
import { AvailabilityEntry, Service } from '../types';
import { FALLBACK_IMAGE_URL, getErrorMessage } from '../utils';
import { AvailabilityEditor } from './AvailabilityEditor';

interface ServiceFormProps {
  initialData?: Service | null;
  onSubmit: (formData: FormData) => Promise<void>;
  submitLabel: string;
}

const normalizeExistingImage = (image: string) => {
  const trimmedImage = image.trim();
  if (!trimmedImage) {
    return '';
  }

  try {
    const parsedUrl = new URL(trimmedImage, window.location.origin);
    parsedUrl.searchParams.delete('t');

    if (parsedUrl.pathname.startsWith('/uploads/') || parsedUrl.pathname.startsWith('/images/')) {
      const search = parsedUrl.searchParams.toString();
      return `${parsedUrl.pathname}${search ? `?${search}` : ''}`;
    }

    return parsedUrl.toString();
  } catch {
    return trimmedImage;
  }
};

export const ServiceForm: React.FC<ServiceFormProps> = ({ initialData, onSubmit, submitLabel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [priceLabel, setPriceLabel] = useState('');
  const [category, setCategory] = useState(SERVICE_CATEGORIES[0]);
  const [location, setLocation] = useState('');
  const [upiId, setUpiId] = useState('');
  const [availability, setAvailability] = useState<AvailabilityEntry[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!initialData) return;

    setTitle(initialData.title || '');
    setDescription(initialData.description || '');
    setPrice(initialData.price?.toString() || '');
    setPriceLabel(initialData.priceLabel || '');
    setCategory(initialData.category || SERVICE_CATEGORIES[0]);
    setLocation(initialData.location || '');
    setUpiId(initialData.upiId || '');
    setExistingImages(initialData.rawImages || initialData.images || []);
    setAvailability(initialData.availability || []);
    setNewImages([]);
    setError('');
  }, [initialData]);

  const previewUrls = useMemo(
    () => newImages.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [newImages],
  );

  useEffect(() => () => {
    previewUrls.forEach((item) => URL.revokeObjectURL(item.url));
  }, [previewUrls]);

  const handleRemoveExistingImage = (index: number) => {
    setExistingImages((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleRemoveNewImage = (index: number) => {
    setNewImages((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;

    const files = Array.from(event.target.files).slice(0, 6);
    setNewImages((current) => [...current, ...files].slice(0, 6));
  };

  const validate = () => {
    if (!title.trim() || !description.trim() || !price || !location.trim()) {
      return 'Please complete all required service details.';
    }

    if (Number(price) < 0) {
      return 'Price cannot be negative.';
    }

    if (existingImages.length === 0 && newImages.length === 0) {
      return 'Please provide at least one image for your service.';
    }

    if (!upiId.trim().includes('@')) {
      return 'Please provide a valid UPI ID such as name@bank.';
    }

    return '';
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setSubmitting(false);
      return;
    }

    try {
      const retainedImages = Array.from(
        new Set(existingImages.map(normalizeExistingImage).filter(Boolean)),
      );
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('price', String(Number(price)));
      formData.append('priceLabel', priceLabel.trim());
      formData.append('category', category);
      formData.append('location', location.trim());
      formData.append('upiId', upiId.trim());
      formData.append('availability', JSON.stringify(availability));

      retainedImages.forEach((image) => formData.append('images', image));
      newImages.forEach((file) => formData.append('images', file));

      await onSubmit(formData);
    } catch (responseError: any) {
      setError(getErrorMessage(responseError, 'Error submitting service.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative space-y-6 overflow-hidden border border-noir-border bg-noir-card p-8">
      {error && (
        <div className="border border-rose-500/20 bg-rose-500/10 p-4 text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-rose-500">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="ml-2 text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-noir-accent">Title</label>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Service title"
            className="w-full border border-noir-border bg-noir-bg px-5 py-4 text-noir-ink focus:border-noir-accent focus:outline-none"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="ml-2 text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-noir-accent">Category</label>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="w-full border border-noir-border bg-noir-bg px-5 py-4 text-noir-ink focus:border-noir-accent focus:outline-none"
          >
            {SERVICE_CATEGORIES.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="ml-2 text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-noir-accent">Description</label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Describe your service"
          rows={6}
          className="w-full border border-noir-border bg-noir-bg px-5 py-4 text-noir-ink focus:border-noir-accent focus:outline-none"
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2">
          <label className="ml-2 text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-noir-accent">Location</label>
          <input
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Service location"
            className="w-full border border-noir-border bg-noir-bg px-5 py-4 text-noir-ink focus:border-noir-accent focus:outline-none"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="ml-2 text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-noir-accent">Price (INR)</label>
          <input
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder="Price in INR"
            type="number"
            min="0"
            className="w-full border border-noir-border bg-noir-bg px-5 py-4 text-noir-ink focus:border-noir-accent focus:outline-none"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="ml-2 text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-noir-accent">Price Range Label</label>
          <input
            value={priceLabel}
            onChange={(event) => setPriceLabel(event.target.value)}
            placeholder="e.g. INR 25,000 - 60,000 / event"
            className="w-full border border-noir-border bg-noir-bg px-5 py-4 text-noir-ink focus:border-noir-accent focus:outline-none"
          />
        </div>
        <div className="space-y-2">
          <label className="ml-2 text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-noir-accent">UPI ID</label>
          <input
            value={upiId}
            onChange={(event) => setUpiId(event.target.value)}
            placeholder="name@bank"
            className="w-full border border-noir-border bg-noir-bg px-5 py-4 text-noir-ink focus:border-noir-accent focus:outline-none"
            required
          />
        </div>
      </div>

      <div className="space-y-4 border-t border-noir-border pt-4">
        <p className="mb-4 ml-2 text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-noir-accent">Service images</p>

        <div className="flex flex-wrap gap-4">
          {existingImages.map((image, index) => (
            <div key={`existing-${index}`} className="relative h-24 w-24 border border-noir-border">
              <img src={image || FALLBACK_IMAGE_URL} alt="Preview" className="h-full w-full object-cover" />
              <button type="button" onClick={() => handleRemoveExistingImage(index)} className="absolute right-1 top-1 bg-noir-ink p-1 text-noir-bg transition-colors hover:bg-rose-500">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}

          {previewUrls.map((preview, index) => (
            <div key={`new-${preview.file.name}-${index}`} className="relative h-24 w-24 border border-noir-accent">
              <img src={preview.url} alt="Preview" className="h-full w-full object-cover opacity-80" />
              <button type="button" onClick={() => handleRemoveNewImage(index)} className="absolute right-1 top-1 bg-noir-ink p-1 text-noir-bg transition-colors hover:bg-rose-500">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}

          <label className="flex h-24 w-24 cursor-pointer items-center justify-center border border-dashed border-noir-border text-noir-muted transition-colors hover:border-noir-accent hover:text-noir-accent">
            <UploadCloud className="h-6 w-6" />
            <input type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
          </label>
        </div>
      </div>

      <AvailabilityEditor value={availability} onChange={setAvailability} />

      <button type="submit" disabled={submitting} className="btn-noir mt-8 flex items-center justify-center gap-2 !rounded-none !px-10">
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitting ? 'Please wait...' : submitLabel}
      </button>
    </form>
  );
};
