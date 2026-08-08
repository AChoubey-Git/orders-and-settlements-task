import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import OrderDetail from './pages/OrderDetail';
import CreateOrder from './pages/CreateOrder';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/orders/new" element={<CreateOrder />} />
        <Route path="/orders/:id" element={<OrderDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
