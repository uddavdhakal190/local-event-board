import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider } from './components/auth-context';
import { FavoritesProvider } from './components/favorites-context';

export default function App() {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <RouterProvider router={router} />
      </FavoritesProvider>
    </AuthProvider>
  );
}