import React from 'react';
import type { ServiceLocation } from '../types';

export interface OrderLocationMapProps {
  sellerLocation?: ServiceLocation | null;
  buyerLocation?: ServiceLocation | null;
  height?: number | string;
}

export const OrderLocationMap: React.ComponentType<OrderLocationMapProps>;
