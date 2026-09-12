import type { ComponentType } from 'react';
export interface WebFeature { id: string; path: string; component: ComponentType }
export const features: readonly WebFeature[] = [];
