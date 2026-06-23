import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { useEffect } from 'react';
import { socketService } from './utils/socketClient';
import { ThemeProvider } from './components/ThemeProvider';

export default function App() {
  useEffect(() => {
    socketService.connect();
    const subscription = socketService.subscribe('/topic/public/updates', (message) => {
      console.log('Received data update event, reloading...', message);
      window.location.reload();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
