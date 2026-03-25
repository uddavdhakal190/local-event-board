import React from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Home, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#9CAFA0] via-white to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-[#9CAFA0] mb-4">404</h1>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Page Not Found</h2>
          <p className="text-gray-600 mb-2">
            Sorry, we couldn't find the page you're looking for.
          </p>
          <p className="text-sm text-gray-500 font-mono bg-gray-100 rounded px-3 py-2 inline-block">
            {location.pathname}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-[#9CAFA0] text-[#9CAFA0] rounded-xl font-semibold hover:bg-[#9CAFA0] hover:text-white transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#9CAFA0] text-white rounded-xl font-semibold hover:bg-[#8A9D8E] transition-colors"
          >
            <Home className="w-5 h-5" />
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
