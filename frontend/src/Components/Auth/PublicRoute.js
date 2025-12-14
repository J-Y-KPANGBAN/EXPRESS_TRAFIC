// frontend/src/Components/Auth/PublicRoute.js
import { Navigate } from 'react-router-dom';

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (token) {
    return <Navigate to="/profile" replace />;
  }
  
  return children;
};

export default PublicRoute;