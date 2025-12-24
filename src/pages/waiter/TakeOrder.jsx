import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { Search, ShoppingCart, ArrowLeft, Plus, Minus, ChefHat } from 'lucide-react';

export default function TakeOrder() {
    const { tableId } = useParams();
    const navigate = useNavigate();
    const [table, setTable] = useState(null);
    const [menu, setMenu] = useState([]);
    const [cart, setCart] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Table
                const tableDoc = await getDoc(doc(db, 'tables', tableId));
                if (tableDoc.exists()) {
                    setTable({ id: tableDoc.id, ...tableDoc.data() });
                } else {
                    alert("Table not found");
                    navigate('/waiter');
                    return;
                }

                // Fetch Menu
                const menuSnapshot = await getDocs(collection(db, 'menu'));
                const menuItems = menuSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                setMenu(menuItems.filter(m => m.isAvailable)); // Only show available items

                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        fetchData();
    }, [tableId, navigate]);

    const addToCart = (item) => {
        setCart(prev => ({
            ...prev,
            [item.id]: {
                ...item,
                qty: (prev[item.id]?.qty || 0) + 1
            }
        }));
    };

    const removeFromCart = (itemId) => {
        setCart(prev => {
            const newState = { ...prev };
            if (newState[itemId].qty > 1) {
                newState[itemId].qty -= 1;
            } else {
                delete newState[itemId];
            }
            return newState;
        });
    };

    const cartTotal = Object.values(cart).reduce((sum, item) => sum + (item.price * item.qty), 0);
    const cartItemCount = Object.values(cart).reduce((sum, item) => sum + item.qty, 0);

    const placeOrder = async () => {
        if (cartItemCount === 0) return;
        setSubmitting(true);

        try {
            // 1. Create Order
            const orderData = {
                tableId: tableId,
                tableNumber: table.number,
                items: Object.values(cart).map(i => ({
                    id: i.id,
                    name: i.name,
                    price: i.price,
                    qty: i.qty
                })),
                status: 'pending', // 'pending' = NEW
                totalAmount: cartTotal,
                createdAt: serverTimestamp(),
                createdBy: auth.currentUser?.uid || 'unknown'
            };

            await addDoc(collection(db, 'orders'), orderData);

            // 2. Update Table Status
            await updateDoc(doc(db, 'tables', tableId), {
                status: 'occupied'
            });

            alert('Order placed successfully!');
            navigate('/waiter');
        } catch (error) {
            console.error("Error placing order:", error);
            alert("Failed to place order. " + error.message);
        }
        setSubmitting(false);
    };

    const categories = ['All', ...new Set(menu.map(m => m.category))];
    const filteredMenu = menu.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    if (loading) return <div className="p-8 text-center">Loading menu...</div>;

    return (
        <div className="h-[calc(100vh-80px)] flex flex-col md:flex-row gap-6 overflow-hidden">
            {/* Left: Menu Area */}
            <div className="flex-1 flex flex-col min-h-0 bg-white rounded-xl shadow-sm border overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b bg-gray-50 flex items-center justify-between gap-4">
                    <button onClick={() => navigate('/waiter')} className="p-2 hover:bg-gray-200 rounded-full">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search menu..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Categories */}
                <div className="p-4 border-b flex gap-2 overflow-x-auto">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${categoryFilter === cat ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Menu Grid */}
                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-24 md:pb-4">
                    {filteredMenu.map(item => (
                        <div key={item.id} className="border rounded-lg p-4 flex justify-between items-start hover:border-indigo-300 transition-colors">
                            <div>
                                <h4 className="font-bold text-gray-800">{item.name}</h4>
                                <p className="text-sm text-gray-500 mb-2">{item.category}</p>
                                <p className="font-semibold text-indigo-600">₹{item.price}</p>
                            </div>
                            <button
                                onClick={() => addToCart(item)}
                                className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    ))}
                    {filteredMenu.length === 0 && <p className="col-span-full text-center text-gray-400 py-8">No items found.</p>}
                </div>
            </div>

            {/* Right: Cart Area */}
            <div className="w-full md:w-96 bg-white rounded-xl shadow-xl border flex flex-col min-h-0">
                <div className="p-4 bg-indigo-600 text-white flex justify-between items-center">
                    <h3 className="font-bold flex items-center gap-2">
                        <ShoppingCart size={20} />
                        Current Order
                    </h3>
                    <span className="bg-indigo-500 px-3 py-1 rounded-full text-sm font-mono">
                        Table {table?.number}
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {Object.keys(cart).length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
                            <ChefHat size={48} className="opacity-20" />
                            <p>Cart is empty</p>
                        </div>
                    ) : (
                        Object.values(cart).map(item => (
                            <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                                <div>
                                    <div className="font-medium text-gray-900">{item.name}</div>
                                    <div className="text-xs text-gray-500">₹{item.price} x {item.qty}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 flex items-center justify-center bg-white border rounded-full text-gray-600 hover:bg-gray-100"><Minus size={14} /></button>
                                    <span className="font-medium w-4 text-center">{item.qty}</span>
                                    <button onClick={() => addToCart(item)} className="w-8 h-8 flex items-center justify-center bg-white border rounded-full text-gray-600 hover:bg-gray-100"><Plus size={14} /></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 border-t bg-gray-50 space-y-4">
                    <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total</span>
                        <span>₹{cartTotal}</span>
                    </div>
                    <button
                        onClick={placeOrder}
                        disabled={cartItemCount === 0 || submitting}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                    >
                        {submitting ? 'Placing Order...' : `Place Order • ₹${cartTotal}`}
                    </button>
                </div>
            </div>
        </div>
    );
}
