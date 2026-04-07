import { RouterProvider } from 'react-router';
import { router } from './routes.jsx';
import { DataProvider } from './contexts/DataContext.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { Toaster } from './components/ui/sonner.jsx';
import { InactivityWarning } from './components/InactivityWarning.jsx';

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <RouterProvider router={router} />
        <InactivityWarning />
        <Toaster position="top-right" richColors />
      </DataProvider>
    </AuthProvider>
  );
}
