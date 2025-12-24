import SeedButton from '../../components/SeedButton';
import MenuManagement from './MenuManagement';
import OrderAnalytics from './OrderAnalytics';
import UserManagement from './UserManagement';
import TableManagement from './TableManagement';

export default function AdminDashboard() {
    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>
            <p className="mb-6">Manage users, menu, and tables here.</p>

            <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-8">
                        <MenuManagement />
                        <TableManagement />
                    </div>
                    <div className="space-y-8">
                        <OrderAnalytics />
                        <UserManagement />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-bold mb-4">System Utilities</h3>
                    <SeedButton />
                </div>
            </div>
        </div>
    );
}
