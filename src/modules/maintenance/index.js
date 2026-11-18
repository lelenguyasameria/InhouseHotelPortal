import { Wrench } from 'lucide-react';
import Page from './Page.jsx';

export default {
  id: 'maintenance',
  path: '/maintenance',
  label: 'Maintenance',
  description: 'Fault reports and work orders with priorities and SLAs.',
  icon: Wrench,
  order: 20,
  Page,
};
