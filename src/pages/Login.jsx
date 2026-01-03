import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Coffee } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const { user, role } = useAuth();
    const navigate = useNavigate();

    // Redirect if already logged in
    if (user && role) {
        if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
        if (role === 'waiter') return <Navigate to="/waiter" replace />;
        if (role === 'cashier') return <Navigate to="/cashier" replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoggingIn(true);
        setError('');

        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Navigation will happen automatically via the check above or AuthContext listeners
        } catch (err) {
            console.error(err);
            setError('Invalid email or password.');
            setIsLoggingIn(false);
        }
    };

   return (
  <div className="min-h-screen bg-gradient-to-br from-brand-orange/10 to-brand-orange/5 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-brand-orange/20">
      
      <div className="p-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-brand-orange rounded-full flex items-center justify-center text-white shadow-lg">
            <Coffee size={32} />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Welcome Back
        </h2>
        <p className="text-center text-gray-500 mb-8">
          Sign in to access your dashboard
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm text-center border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg
                focus:ring-1 focus:ring-brand-orange
                focus:border-brand-orange
                outline-none transition-colors"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg
                focus:ring-1 focus:ring-brand-orange
                focus:border-brand-orange
                outline-none transition-colors"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full bg-brand-orange hover:bg-brand-orangeDark
              text-white font-semibold py-3 rounded-lg
              transition-colors shadow-lg shadow-brand-orange/30
              disabled:opacity-70"
          >
            {isLoggingIn ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>

      {/* Footer */}
      <div className="bg-brand-orange/5 p-4 text-center text-xs text-gray-400 border-t border-brand-orange/10">
        Cafe POS System v1.0
      </div>
    </div>
  </div>
);
}