import { ConciergeBell } from 'lucide-react';
import Page from './Page.jsx';

export default {
  id: 'guest-requests',
  path: '/guest-requests',
  label: 'Guest requests',
  description: 'Log guest requests and route them to the right department.',
  icon: ConciergeBell,
  order: 30,
  Page,
};
