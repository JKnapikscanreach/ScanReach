import QRGenerator from '@/components/QRGenerator';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user } = useAuth();
  
  if (!user) {
    return null; // This won't show since ProtectedRoute handles redirects
  }
  
  return <QRGenerator />;
};

export default Index;
