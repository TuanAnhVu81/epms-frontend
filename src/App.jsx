import { BrowserRouter } from 'react-router-dom';
import AppRouter from './routes/AppRouter';

// App entry: wrap the entire application with BrowserRouter for routing
export default function App() {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}
