import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { BarChart3, Calendar, IndianRupee } from 'lucide-react';

export default function OrderAnalytics() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterDate, setFilterDate] = useState(new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
    const [stats, setStats] = useState({ totalSales: 0, orderCount: 0, avgValue: 0 });

    useEffect(() => {
        fetchOrders();
    }, [filterDate]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            // Simple client-side filtering for MVP (since firestore querying by date needs timestamp conversion logic)
            // Production: Use 'startAt' and 'endAt' query constraints
            const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
            const snap = await getDocs(q);

            const allOrders = snap.docs.map(d => ({
                id: d.id,
                ...d.data(),
                // Handle null createdAt for very new docs
                date: d.data().createdAt?.toDate().toISOString().slice(0, 10) || 'Unknown'
            }));

            const filtered = allOrders.filter(o => o.date === filterDate);
            setOrders(filtered);

            // Calc Stats
            const totalSales = filtered.reduce((sum, o) => sum + (o.status === 'paid' ? o.totalAmount : 0), 0);
            const count = filtered.length;

            setStats({
                totalSales,
                orderCount: count,
                avgValue: count ? Math.round(totalSales / count) : 0
            });

        } catch (error) {
            console.error("Error fetching analytics", error);
        }
        setLoading(false);
    };

    return (
        <div className="bg-white rounded-lg shadow p-6 mt-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <BarChart3 className="text-indigo-600" />
                    Order Analytics
                </h3>

                <div className="flex items-center gap-2 bg-gray-50 border rounded-lg px-3 py-2">
                    <Calendar size={18} className="text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Date:</span>
                    <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="bg-transparent border-none focus:ring-0 text-sm font-semibold text-gray-800"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <h4 className="text-sm font-medium text-indigo-600 mb-1">Total Sales (Paid)</h4>
                    <div className="text-3xl font-bold text-indigo-900 flex items-center">
                        <IndianRupee size={24} />
                        {stats.totalSales}
                    </div>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                    <h4 className="text-sm font-medium text-blue-600 mb-1">Total Orders</h4>
                    <div className="text-3xl font-bold text-blue-900">{stats.orderCount}</div>
                </div>
                <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl">
                    <h4 className="text-sm font-medium text-purple-600 mb-1">Avg. Order Value</h4>
                    <div className="text-3xl font-bold text-purple-900">₹{stats.avgValue}</div>
                </div>
            </div>

            {loading ? (
                <p className="text-center py-8 text-gray-400">Loading analytics...</p>
            ) : (
                <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Table</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200 text-sm">
                            {orders.map(order => (
                                <tr key={order.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-mono text-gray-600">#{order.id.slice(0, 6)}</td>
                                    <td className="px-4 py-3 text-gray-500">
                                        {order.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '--'}
                                    </td>
                                    <td className="px-4 py-3 font-medium">Table {order.tableNumber}</td>
                                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                                        {order.items.map(i => `${i.qty}x ${i.name}`).join(', ')}
                                    </td>
                                    <td className="px-4 py-3 font-bold">₹{order.totalAmount}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ${order.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {order.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="text-center py-6 text-gray-400">No orders found for this date.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
