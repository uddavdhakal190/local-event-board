import { Outlet } from 'react-router';
import { FirstAdminBanner } from './first-admin-banner';

export function RootLayout() {
  return (
    <>
      <FirstAdminBanner />
      <Outlet />
    </>
  );
}