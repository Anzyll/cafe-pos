import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { Utensils, Users } from 'lucide-react';

export default function WaiterDashboard() {
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedFloor, setSelectedFloor] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const q = query(collection(db, 'tables'), orderBy('number'));
        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const tableData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setTables(tableData);
                setLoading(false);

                // Default floor selection
                if (!selectedFloor && tableData.length > 0) {
                    setSelectedFloor(tableData[0].floor);
                }
            },
            (error) => {
                console.error('Error fetching tables:', error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [selectedFloor]);

    const floors = [...new Set(tables.map(t => t.floor))].sort();

    const handleTableClick = (table) => {
        // ❌ Block ordering ONLY when billing or closed
        if (table.status === 'billing' || table.status === 'closed') {
            alert('Billing in progress. Cannot add new items.');
            return;
        }

        // ✅ Allow available + occupied
        navigate(`/waiter/table/${table.id}`);
    };

    const filteredTables = tables.filter(t => t.floor === selectedFloor);

    const statusLabel = {
        available: 'Available',
        occupied: 'Occupied',
        billing: 'Billing',
        closed: 'Closed'
    };

    const cardStyle = (status) => {
        if (status === 'billing' || status === 'closed') {
            return 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-60';
        }
        if (status === 'occupied') {
            return 'bg-yellow-50 border-yellow-300 hover:border-yellow-500';
        }
        return 'bg-white border-green-200 hover:border-green-500';
    };

    const iconStyle = (status) => {
        if (status === 'billing' || status === 'closed') {
            return 'bg-gray-200 text-gray-500';
        }
        if (status === 'occupied') {
            return 'bg-yellow-100 text-yellow-600';
        }
        return 'bg-green-100 text-green-600';
    };

    const statusTextStyle = (status) => {
        if (status === 'billing' || status === 'closed') {
            return 'text-gray-500';
        }
        if (status === 'occupied') {
            return 'text-yellow-600';
        }
        return 'text-green-500';
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Utensils className="text-indigo-600" />
                Waiter Dashboard
            </h2>

            {/* Floor Selector */}
            <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
                {floors.map(floor => (
                    <button
                        key={floor}
                        onClick={() => setSelectedFloor(floor)}
                        className={`px-6 py-3 rounded-full font-medium transition-colors whitespace-nowrap ${
                            selectedFloor === floor
                                ? 'bg-indigo-600 text-white shadow-lg'
                                : 'bg-white text-gray-600 hover:bg-gray-100 border'
                        }`}
                    >
                        {floor} Floor
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500">
                    Loading tables...
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {filteredTables.map(table => (
                        <button
                            key={table.id}
                            onClick={() => handleTableClick(table)}
                            className={`relative p-6 rounded-xl border-2 transition-all hover:scale-105 flex flex-col items-center justify-center gap-3 h-40 ${cardStyle(table.status)}`}
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${iconStyle(table.status)}`}>
                                <Users size={24} />
                            </div>

                            <div className="text-center">
                                <div className="font-bold text-lg text-gray-800">
                                    Table {table.number}
                                </div>
                                <div
                                    className={`text-xs font-semibold uppercase tracking-wider ${statusTextStyle(table.status)}`}
                                >
                                    {statusLabel[table.status] || table.status}
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
