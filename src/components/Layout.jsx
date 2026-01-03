import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { auth } from '../lib/firebase';
import { LogOut } from 'lucide-react';

export default function Layout() {
    const { user, role } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await auth.signOut();
            navigate('/login');
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

   return (
  <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
    
    {/* HEADER */}
    <header className="bg-white shadow-sm sticky top-0 z-10 border-b border-brand-orange/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">

        {/* Logo + Name */}
        <div className="flex items-center gap-3  ">
          <img
            src="/images/logo.jpeg"
            alt="Baadal Bistro Logo"
            className="w-16 h-12 object-contain"
             style={{ padding: '2px' }}
          />
          <h1 className='text-xl font-extrabold tracking-wide text-gray-800'>Baadal Bistro</h1>
        </div>

        {/* User Info */}
        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium capitalize px-3 py-1
              bg-brand-orange/10 text-brand-orange rounded-full">
              {role}
            </span>

            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-600 transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        )}
      </div>
    </header>

    {/* CONTENT */}
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Outlet />
    </main>
  </div>
);
}