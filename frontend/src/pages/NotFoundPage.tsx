import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Home, Video } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[500px] flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full rounded-2xl bg-neutral-900 border border-neutral-700/80 p-8 sm:p-10 shadow-2xl space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 mx-auto">
          <span className="font-mono text-2xl font-extrabold">404</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-neutral-100">
            Page Not Found
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
            The requested destination or analysis route does not exist or has been relocated.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-semibold transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go Back</span>
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs transition"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Landing</span>
          </button>
        </div>
      </div>
    </div>
  );
};
