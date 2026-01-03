import { useState, useEffect } from 'react';
import {
    collection,
    query,
    onSnapshot,
    orderBy,
    where,
    doc,
    updateDoc,
    serverTimestamp
} from 'firebase/firestore';
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

    /* ========================
       REAL-TIME LISTENERS
    ========================= */
    useEffect(() => {
        // Tables
        const qTables = query(collection(db, 'tables'), orderBy('number'));
        const unsubTables = onSnapshot(qTables, snap => {
            setTables(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        // Active orders (pending + preparing)
        const qOrders = query(
            collection(db, 'orders'),
            where('status', 'in', ['pending', 'preparing'])
        );

        const unsubOrders = onSnapshot(qOrders, snap => {
            setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });

        return () => {
            unsubTables();
            unsubOrders();
        };
    }, []);

    /* ========================
       SELECTED TABLE → ORDER
    ========================= */
    useEffect(() => {
        if (!selectedTable) {
            setActiveOrder(null);
            return;
        }

        const order = orders.find(o => o.tableId === selectedTable.id);
        setActiveOrder(order || null);
    }, [selectedTable, orders]);

    /* ========================
       HANDLERS
    ========================= */
    const handleTableClick = (table) => {
        setSelectedTable(table);
        setCustomerPhone('');
    };

    const handleCheckout = async () => {
        if (!selectedTable || !activeOrder) return;

        if (selectedTable.status !== 'occupied') {
            alert('This table is not occupied.');
            return;
        }

        if (!confirm(`Mark Table ${selectedTable.number} as PAID?`)) return;

        const cleanPhone = customerPhone.replace(/\D/g, '');
        if (cleanPhone.length < 10) {
            alert('Valid WhatsApp number required');
            return;
        }

        try {
            // 1️⃣ Send WhatsApp bill
            const text = formatBillToText(activeOrder, selectedTable.number);
            shareBillOnWhatsApp(cleanPhone, text);

            // 2️⃣ Mark order as paid
            await updateDoc(doc(db, 'orders', activeOrder.id), {
                status: 'paid',
                paidAt: serverTimestamp(),
                customerPhone: cleanPhone,
                whatsappSent: true,
                whatsappSentAt: serverTimestamp()
            });

            // 3️⃣ Free the table
            await updateDoc(doc(db, 'tables', selectedTable.id), {
                status: 'available'
            });

            alert('Payment successful. Table freed.');
            setSelectedTable(null);
            setCustomerPhone('');
        } catch (err) {
            console.error('Checkout error', err);
            alert('Checkout failed');
        }
    };

    const handleShareWhatsApp = () => {
        if (!activeOrder || !selectedTable) return;

        const cleanPhone = customerPhone.replace(/\D/g, '');
        if (cleanPhone.length < 10) {
            alert('Invalid phone number');
            return;
        }

        const text = formatBillToText(activeOrder, selectedTable.number);
        shareBillOnWhatsApp(cleanPhone, text);

        updateDoc(doc(db, 'orders', activeOrder.id), {
            customerPhone: cleanPhone,
            whatsappSent: true,
            whatsappSentAt: serverTimestamp()
        }).catch(console.error);
    };

    /* ========================
       UI
    ========================= */
return (
  <div className="relative min-h-[calc(100vh-100px)] flex flex-col lg:flex-row gap-4 lg:gap-6">

    {/* LEFT: TABLES */}
    <div
      className="
        flex-1 bg-white rounded-xl shadow-sm border border-brand-orange/20
        p-4 md:p-6
        overflow-y-auto
        pb-36 lg:pb-6
      "
    >
      <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-6 text-gray-800">
        Tables Overview
      </h2>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div
          className="
            grid
            grid-cols-1
            sm:grid-cols-2
            md:grid-cols-3
            lg:grid-cols-4
            gap-3 md:gap-4
          "
        >
          {tables.map(table => {
            const isOccupied = table.status === 'occupied';
            const previewOrder = orders.find(o => o.tableId === table.id);

            return (
              <button
                key={table.id}
                onClick={() => handleTableClick(table)}
                className={`
                  p-4 rounded-lg border-2
                  flex flex-col items-center gap-2
                  transition-all
                  ${selectedTable?.id === table.id
                    ? 'ring-2 ring-brand-orange ring-offset-2'
                    : ''
                  }
                  ${isOccupied
                    ? 'bg-brand-orange/10 border-brand-orange/40'
                    : 'bg-green-50 border-green-300'
                  }
                  lg:hover:scale-105
                `}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isOccupied
                      ? 'bg-brand-orange text-white'
                      : 'bg-green-200 text-green-700'
                  }`}
                >
                  <Users size={20} />
                </div>

                <span className="font-semibold text-gray-700">
                  Table {table.number}
                </span>

                <span
                  className={`text-[10px] md:text-xs font-semibold uppercase ${
                    isOccupied ? 'text-brand-orange' : 'text-green-600'
                  }`}
                >
                  {table.status}
                </span>

                {isOccupied && previewOrder && (
                  <span className="text-xs bg-white px-2 py-0.5 rounded border border-brand-orange/30 shadow-sm">
                    ₹{previewOrder.totalAmount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>

    {/* RIGHT: BILLING (STICKY ON MOBILE) */}
    <div
      className="
        fixed bottom-0 left-0 right-0 z-30
        lg:static lg:w-96
        bg-white
        rounded-t-xl lg:rounded-xl
        shadow-2xl lg:shadow-lg
        border border-brand-orange/20
        flex flex-col
        max-h-[70vh] lg:max-h-full
      "
    >
      {/* Mobile drag handle */}
      <div className="lg:hidden flex justify-center py-2">
        <div className="w-10 h-1.5 bg-gray-300 rounded-full" />
      </div>

      {/* Header */}
      <div className="p-4 md:p-6 border-b border-brand-orange/20 bg-brand-orange/5">
        <h3 className="font-bold text-base md:text-lg text-gray-800 flex items-center gap-2">
          <Receipt className="text-brand-orange" />
          Checkout / Billing
        </h3>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto">
        {!selectedTable ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
            <Coffee size={36} className="opacity-20" />
            <p className="text-sm">Select a table</p>
          </div>
        ) : activeOrder ? (
          <div className="space-y-5">
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-base md:text-lg font-bold">
                Table {selectedTable.number}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-brand-orange/15 text-brand-orange">
                occupied
              </span>
            </div>

            <div className="space-y-2 text-sm">
              {activeOrder.items.map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{item.qty}× {item.name}</span>
                  <span>₹{item.price * item.qty}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-brand-orange">
                ₹{activeOrder.totalAmount}
              </span>
            </div>

            <div className="space-y-3 pt-4">
              <div className="flex gap-2">
                <input
                  type="tel"
                  placeholder="WhatsApp number"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  className="
                    flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm
                    focus:outline-none focus:border-brand-orange
                    focus:ring-2 focus:ring-brand-orange
                  "
                />
                <button
                  onClick={handleShareWhatsApp}
                  className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"
                >
                  <Smartphone size={18} />
                </button>
              </div>

              <button
                onClick={handleCheckout}
                className="
                  w-full py-3 bg-brand-orange hover:bg-brand-orangeDark
                  text-white font-bold rounded-lg
                  flex items-center justify-center gap-2
                "
              >
                <CheckCircle size={18} />
                Mark Paid & Free Table
              </button>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500 text-sm">
            No active order for this table
          </p>
        )}
      </div>
    </div>
  </div>
);
}