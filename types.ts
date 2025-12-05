import { LucideIcon } from 'lucide-react';

export interface LinkItem {
  id: string;
  title: string;
  url: string;
  description: string;
  category: 'blog' | 'tool' | 'utility' | 'media';
  icon: LucideIcon;
  isExternal?: boolean;
}