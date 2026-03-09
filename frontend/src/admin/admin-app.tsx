import { useState } from 'react';
import { AdminLogin } from './components/admin-login';
import { AdminLayout } from './components/admin-layout';

export function AdminApp() {
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem('admin-secret'));

  if (!authed) return <AdminLogin onSuccess={() => setAuthed(true)} />;
  return <AdminLayout />;
}
