import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, where, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { formatBillToText, shareBillOnWhatsApp } from '../../lib/whatsapp';
import { Users, Receipt, Smartphone, CheckCircle, Coffee } from 'lucide-react';

export default function CashierDashboard() {
    const [tables, setTables] = useState([]);
    const [orders, setOrders] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);
    const [activeOrder, setActiveOrder] = useState(null);
    const [customerPhone, setCustomerPhone] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Real-time Tables
        const qTables = query(collection(db, 'tables'), orderBy('number'));
        const unsubTables = onSnapshot(qTables, (snap) => {
            setTables(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        // Real-time Active Orders (pending)
        const qOrders = query(collection(db, 'orders'), where('status', '==', 'pending'));
        const unsubOrders = onSnapshot(qOrders, (snap) => {
            setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });

        return () => {
            unsubTables();
            unsubOrders();
        };
    }, []);

    useEffect(() => {
        if (selectedTable) {
            // Find active order for this table
            const order = orders.find(o => o.tableId === selectedTable.id);
            setActiveOrder(order || null);
        } else {
            setActiveOrder(null);
        }
    }, [selectedTable, orders]);


    const handleTableClick = (table) => {
        setSelectedTable(table);
        setCustomerPhone(''); // Reset phone input
    };

    const handleCheckout = async () => {
        if (!activeOrder) return;
        if (!confirm(`Mark Order #${activeOrder.id.slice(0, 6)} as PAID?`)) return;

        try {
            // 1. Update Order Status
            await updateDoc(doc(db, 'orders', activeOrder.id), {
                status: 'paid',
                paidAt: serverTimestamp()
            });

            // 2. Free the Table
            await updateDoc(doc(db, 'tables', selectedTable.id), {
                status: 'free'
            });

            alert('Checkout Successful!');
            setSelectedTable(null);
        } catch (error) {
            console.error("Checkout failed", error);
            alert("Checkout failed: " + error.message);
        }
    };

    const handleShareWhatsApp = () => {
        if (!activeOrder) return;
        if (!customerPhone) {
            alert("Please enter customer phone number (with country code, e.g., 919876543210)");
            return;
        }
        const text = formatBillToText(activeOrder);
        shareBillOnWhatsApp(customerPhone, text);
    };

    return (
        <div className="h-[calc(100vh-100px)] flex gap-6">
            {/* Left: Tables Grid */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border p-6 overflow-y-auto">
                <h2 className="text-xl font-bold mb-6 text-gray-800">Tables Overview</h2>

                {loading ? <p>Loading...</p> : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {tables.map(table => (
                            <button
                                key={table.id}
                                onClick={() => handleTableClick(table)}
                                className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${selectedTable?.id === table.id
                                        ? 'ring-2 ring-indigo-500 ring-offset-2 scale-105 shadow-md'
                                        : 'hover:border-gray-400'
                                    } ${table.status === 'occupied'
                                        ? 'bg-red-50 border-red-200'
                                        : 'bg-green-50 border-green-200'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${table.status === 'occupied' ? 'bg-red-200 text-red-700' : 'bg-green-200 text-green-700'
                                    }`}>
                                    <Users size={20} />
                                </div>
                                <span className="font-bold text-gray-700">Table {table.number}</span>
                                <span className={`text-xs font-semibold uppercase ${table.status === 'occupied' ? 'text-red-500' : 'text-green-500'
                                    }`}>
                                    {table.status}
                                </span>
                                {/* Show Order total preview if occupied */}
                                {table.status === 'occupied' && orders.find(o => o.tableId === table.id) && (
                                    <span className="text-xs bg-white px-2 py-0.5 rounded border shadow-sm">
                                        ₹{orders.find(o => o.tableId === table.id)?.totalAmount}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Right: Checkout Panel */}
            <div className="w-96 bg-white rounded-xl shadow-lg border flex flex-col">
                <div className="p-6 border-b bg-gray-50 rounded-t-xl">
                    <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                        <Receipt className="text-indigo-600" />
                        Checkout / Billing
                    </h3>
                </div>

                <div className="flex-1 p-6 overflow-y-auto">
                    {!selectedTable ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                            <Coffee size={40} className="mb-2 opacity-20" />
                            <p>Select a table to view details</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center pb-4 border-b">
                                <span className="text-lg font-bold text-gray-800">Table {selectedTable.number}</span>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${selectedTable.status === 'occupied' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                                    }`}>
                                    {selectedTable.status}
                                </span>
                            </div>

                            {activeOrder ? (
                                <>
                                    <div className="space-y-3">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Order Items</p>
                                        {activeOrder.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-sm">
                                                <span>{item.qty}x {item.name}</span>
                                                <span className="font-medium">₹{item.price * item.qty}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-4 border-t flex justify-between items-center text-xl font-bold text-indigo-900">
                                        <span>Total</span>
                                        <span>₹{activeOrder.totalAmount}</span>
                                    </div>

                                    <div className="pt-6 space-y-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">WhatsApp Share (Phone w/ Code)</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="tel"
                                                    placeholder="919876543210"
                                                    value={customerPhone}
                                                    onChange={e => setCustomerPhone(e.target.value)}
                                                    className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                />
                                                <button
                                                    onClick={handleShareWhatsApp}
                                                    className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                                    title="Share on WhatsApp"
                                                >
                                                    <Smartphone size={20} />
                                                </button>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleCheckout}
                                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                                        >
                                            <CheckCircle size={20} />
                                            Mark Paid & Free Table
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center text-gray-500 py-8">
                                    {selectedTable.status === 'occupied'
                                        ? 'No active order found (Error?)'
                                        : 'Table is Free. No active orders.'}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
