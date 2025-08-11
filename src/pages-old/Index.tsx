import QRGenerator from '@/components/QRGenerator';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  console.log('Index component rendering...');
  const { user } = useAuth();
  
  console.log('User in Index:', user);
  
  if (!user) {
    console.log('No user found, returning null');
    return null; // This won't show since ProtectedRoute handles redirects
  }
  
  console.log('Rendering QRGenerator...');
  return <QRGenerator />;
};

export default Index;
