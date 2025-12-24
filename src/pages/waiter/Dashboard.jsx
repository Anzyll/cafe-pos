import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { Utensils, Users } from 'lucide-react';

export default function WaiterDashboard() {
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedFloor, setSelectedFloor] = useState('Ground');
    const navigate = useNavigate();

    useEffect(() => {
        // Listen to tables collection in real-time
        const q = query(collection(db, 'tables'), orderBy('number'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const tableData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTables(tableData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching tables:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const floors = [...new Set(tables.map(t => t.floor))].sort();

    const handleTableClick = (table) => {
        if (table.status === 'occupied') {
            alert('This table is currently occupied using another device/order.');
            // In a real app, we might allow adding to an existing order, 
            // but requirements say "Prevent ordering on already booked tables" roughly implies new order flow.
            // However, usually waiters add items to occupied tables. 
            // For this specific requirement "Prevent ordering on already booked tables", I will block it for now 
            // or redirect to a "View Order" page if implemented. 
            // Let's assume for this MVP, we block starting a *new* order on an occupied table.
            return;
        }
        navigate(`/waiter/table/${table.id}`);
    };

    const filteredTables = tables.filter(t => t.floor === selectedFloor);

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Utensils className="text-indigo-600" />
                Waiter Dashboard
            </h2>

            {/* Floor Selection */}
            <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
                {floors.map(floor => (
                    <button
                        key={floor}
                        onClick={() => setSelectedFloor(floor)}
                        className={`px-6 py-3 rounded-full font-medium transition-colors whitespace-nowrap ${selectedFloor === floor
                                ? 'bg-indigo-600 text-white shadow-lg'
                                : 'bg-white text-gray-600 hover:bg-gray-100 border'
                            }`}
                    >
                        {floor} Floor
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500">Loading tables...</div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {filteredTables.map(table => (
                        <button
                            key={table.id}
                            onClick={() => handleTableClick(table)}
                            className={`relative p-6 rounded-xl border-2 transition-all hover:scale-105 flex flex-col items-center justify-center gap-3 h-40 ${table.status === 'occupied'
                                    ? 'bg-red-50 border-red-200 cursor-not-allowed opacity-80'
                                    : 'bg-white border-green-200 hover:border-green-500 shadow-sm hover:shadow-md'
                                }`}
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${table.status === 'occupied' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                                }`}>
                                <Users size={24} />
                            </div>
                            <div className="text-center">
                                <div className="font-bold text-lg text-gray-800">Table {table.number}</div>
                                <div className={`text-xs font-semibold uppercase tracking-wider ${table.status === 'occupied' ? 'text-red-500' : 'text-green-500'
                                    }`}>
                                    {table.status}
                                </div>
                            </div>
                        </button>
                    ))}

                    {filteredTables.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-400 bg-gray-50 rounded-lg border border-dashed">
                            No tables found on this floor.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
