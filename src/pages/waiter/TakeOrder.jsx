import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { ArrowLeft, Plus, Minus, ChefHat } from 'lucide-react';
import { showError, showSuccess } from '../../lib/toast';

export default function TakeOrder() {
  const { tableId } = useParams();
  const navigate = useNavigate();

  const [table, setTable] = useState(null);
  const [menu, setMenu] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null); // EXISTING ORDER
  const [cart, setCart] = useState({}); // NEW ITEMS
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [submitting, setSubmitting] = useState(false);

  /* ----------------------------------
     INITIAL DATA LOAD
  ---------------------------------- */
  useEffect(() => {
    const loadData = async () => {
      try {
        // Table
        const tableSnap = await getDoc(doc(db, 'tables', tableId));
        if (!tableSnap.exists()) {
          showError('Table not found');
          navigate('/waiter');
          return;
        }
        setTable({ id: tableSnap.id, ...tableSnap.data() });

        // Menu
        const menuSnap = await getDocs(collection(db, 'menu'));
        setMenu(
          menuSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(m => m.isAvailable)
        );

        // Active Order
        const orderQuery = query(
          collection(db, 'orders'),
          where('tableId', '==', tableId),
          where('status', 'in', ['pending', 'preparing']),
          limit(1)
        );

        const orderSnap = await getDocs(orderQuery);
        if (!orderSnap.empty) {
          const docSnap = orderSnap.docs[0];
          setActiveOrder({ id: docSnap.id, ...docSnap.data() });
        }

        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    loadData();
  }, [tableId, navigate]);

  /* ----------------------------------
     CART ACTIONS (NEW ITEMS)
  ---------------------------------- */
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
      const copy = { ...prev };
      if (!copy[itemId]) return prev;
      if (copy[itemId].qty > 1) copy[itemId].qty -= 1;
      else delete copy[itemId];
      return copy;
    });
  };

  /* ----------------------------------
     EXISTING ITEM MODIFICATION
  ---------------------------------- */
  const removeExistingItem = async (itemId) => {
    if (!activeOrder) return;

    const updatedItems = activeOrder.items
      .map(i =>
        i.id === itemId ? { ...i, qty: i.qty - 1 } : i
      )
      .filter(i => i.qty > 0);

    const newTotal = updatedItems.reduce(
      (s, i) => s + i.price * i.qty,
      0
    );

    await updateDoc(doc(db, 'orders', activeOrder.id), {
      items: updatedItems,
      totalAmount: newTotal,
      updatedAt: serverTimestamp()
    });

    setActiveOrder(prev => ({
      ...prev,
      items: updatedItems,
      totalAmount: newTotal
    }));
  };

  /* ----------------------------------
     MERGED VIEW (EXISTING + NEW)
  ---------------------------------- */
  const mergedItems = useMemo(() => {
    const map = {};

    activeOrder?.items?.forEach(i => {
      map[i.id] = { ...i, source: 'existing' };
    });

    Object.values(cart).forEach(i => {
      if (map[i.id]) map[i.id].qty += i.qty;
      else map[i.id] = { ...i, source: 'new' };
    });

    return Object.values(map);
  }, [activeOrder, cart]);

  const newItemsTotal = Object.values(cart).reduce(
    (s, i) => s + i.price * i.qty,
    0
  );

  const totalAmount =
    (activeOrder?.totalAmount || 0) + newItemsTotal;

  /* ----------------------------------
     PLACE / UPDATE ORDER
  ---------------------------------- */
  const placeOrder = async () => {
    if (Object.keys(cart).length === 0) return;
    setSubmitting(true);

    try {
      if (activeOrder) {
        // MERGE INTO EXISTING ORDER
        const map = {};
        activeOrder.items.forEach(i => (map[i.id] = { ...i }));

        Object.values(cart).forEach(i => {
          if (map[i.id]) map[i.id].qty += i.qty;
          else map[i.id] = { id: i.id, name: i.name, price: i.price, qty: i.qty };
        });

        const items = Object.values(map);
        const total = items.reduce((s, i) => s + i.price * i.qty, 0);

        await updateDoc(doc(db, 'orders', activeOrder.id), {
          items,
          totalAmount: total,
          updatedAt: serverTimestamp()
        });

      } else {
        // CREATE FIRST ORDER
        await addDoc(collection(db, 'orders'), {
          tableId,
          tableNumber: table.number,
          items: Object.values(cart).map(i => ({
            id: i.id,
            name: i.name,
            price: i.price,
            qty: i.qty
          })),
          status: 'pending',
          totalAmount: newItemsTotal,
          createdAt: serverTimestamp(),
          createdBy: auth.currentUser?.uid || 'unknown'
        });

        await updateDoc(doc(db, 'tables', tableId), {
          status: 'occupied'
        });
      }

      setCart({});
      showSuccess("Order updated successfully");
      navigate('/waiter');
    } catch (err) {
      console.error(err);
      showError("Failed to place order. Please try again.");
    }

    setSubmitting(false);
  };

  /* ----------------------------------
     FILTER MENU
  ---------------------------------- */
  const categories = ['All', ...new Set(menu.map(m => m.category))];

  const filteredMenu = menu.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (categoryFilter === 'All' || m.category === categoryFilter)
  );

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  /* ----------------------------------
     UI
  ---------------------------------- */
  return (
    <div className="h-[calc(100vh-80px)] flex flex-col md:flex-row gap-6">
      {/* MENU */}
      <div
        className="
    flex-1 bg-white rounded-xl border border-brand-orange/20
    flex flex-col
    overflow-hidden
    pb-[45vh] lg:pb-0
  "
      >

        <div className="p-4 border-b border-brand-orange/20 flex gap-4">
          <button
            onClick={() => navigate('/waiter')}
            className="text-brand-orange hover:text-brand-orangeDark"
          >
            <ArrowLeft />
          </button>

          <input
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2
            focus:outline-none focus:border-brand-orange
            focus:ring-2 focus:ring-brand-orange"
            placeholder="Search menu..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Categories */}
        <div className="p-4 flex gap-2 overflow-x-auto">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`px-4 py-1 rounded-full transition-colors ${categoryFilter === c
                  ? 'bg-brand-orange text-white shadow'
                  : 'bg-gray-100 text-gray-700 hover:bg-brand-orange/10'
                }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="flex-1 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto">
          {filteredMenu.map(item => (
            <div
              key={item.id}
              className="border border-gray-200 p-4 rounded-lg flex justify-between hover:border-brand-orange/40 transition-colors"
            >
              <div>
                <div className="font-bold text-gray-800">{item.name}</div>
                <div className="text-sm text-gray-500">{item.category}</div>
                <div className="font-semibold text-brand-orange">₹{item.price}</div>
              </div>
              <button
                onClick={() => addToCart(item)}
                className="text-brand-orange hover:text-brand-orangeDark"
              >
                <Plus />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ORDER */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:static lg:w-96 bg-white rounded-t-xl lg:rounded-xl shadow-2xl lg:shadow-lg border border-brand-orange/20 flex flex-col max-h-[45vh] lg:max-h-full ">
        <div className="p-4 bg-brand-orange text-white font-bold rounded-t-xl">
          Table {table.number}
        </div>

        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          {mergedItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <ChefHat size={48} />
              <p>No items</p>
            </div>
          ) : (
            mergedItems.map(i => (
              <div
                key={i.id}
                className={`p-3 rounded-lg flex justify-between border ${i.source === 'existing'
                    ? 'bg-brand-orange/10 border-brand-orange/30'
                    : 'bg-gray-50 border-gray-200'
                  }`}
              >
                <div>
                  <div className="font-medium text-gray-800">{i.name}</div>
                  <div className="text-xs text-gray-600">
                    ₹{i.price} × {i.qty}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      i.source === 'new'
                        ? removeFromCart(i.id)
                        : removeExistingItem(i.id)
                    }
                    className="text-gray-600 hover:text-brand-orange"
                  >
                    <Minus size={14} />
                  </button>

                  <span className="font-medium">{i.qty}</span>

                  <button
                    onClick={() => addToCart(i)}
                    className="text-brand-orange hover:text-brand-orangeDark"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-brand-orange/20">
          <div className="flex justify-between font-bold mb-4">
            <span>Total</span>
            <span className="text-brand-orange">₹{totalAmount}</span>
          </div>
          <button
            onClick={placeOrder}
            disabled={submitting || Object.keys(cart).length === 0}
            className="w-full bg-brand-orange hover:bg-brand-orangeDark
            text-white py-3 rounded-xl
            transition-colors disabled:opacity-50"
          >
            {submitting ? 'Updating...' : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  );
}