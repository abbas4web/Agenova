import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import Button from '../components/common/Button';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <p className="text-7xl font-bold bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent mb-4">
          404
        </p>
        <h1 className="text-xl font-semibold text-white mb-2">Page not found</h1>
        <p className="text-sm text-slate-500 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            leftIcon={<ArrowLeft size={14} />}
            onClick={() => navigate(-1)}
          >
            Go back
          </Button>
          <Button leftIcon={<Home size={14} />} onClick={() => navigate('/')}>
            Home
          </Button>
        </div>
      </div>
    </div>
  );
}
