import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { router } from './app/routes';
import Spinner from './components/common/Spinner/Spinner';

function App() {
  const { checkSession, isLoading } = useAuth();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  if (isLoading) {
    return <Spinner fullScreen size="xl" />;
  }

  return <RouterProvider router={router} />;
}

export default App;
