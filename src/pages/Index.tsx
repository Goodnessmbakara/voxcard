
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the Home page
    navigate('/');
  }, [navigate]);

  // This component won't render anything as it immediately redirects
  return null;
};

export default Index;
