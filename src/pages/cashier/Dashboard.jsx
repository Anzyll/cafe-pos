import { useState, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  where,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { formatBillToText, shareBillOnWhatsApp } from "../../lib/whatsapp";
import { Users, Receipt, Smartphone, CheckCircle, Coffee } from "lucide-react";
import { showError, showSuccess } from "../../lib/toast";
import { useNavigate } from "react-router-dom";

export default function CashierDashboard() {
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [customerPhone, setCustomerPhone] = useState("");
  const [offerPercent, setOfferPercent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paymentType, setPaymentType] = useState("cash");
  const [orderMode, setOrderMode] = useState("dine_in");
  const [parcelCharge, setParcelCharge] = useState(0);

  const navigate = useNavigate();

  /* ========================
       REAL-TIME LISTENERS
  ========================= */
  useEffect(() => {
    const qTables = query(collection(db, "tables"), orderBy("number"));
    const unsubTables = onSnapshot(qTables, (snap) =>
      setTables(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    const qOrders = query(
      collection(db, "orders"),
      where("status", "in", ["pending", "preparing"])
    );

    const unsubOrders = onSnapshot(qOrders, (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => {
      unsubTables();
      unsubOrders();
    };
  }, []);

  /* ========================
       TABLE → ORDER
  ========================= */
  useEffect(() => {
    if (orderMode === "parcel") return;

    if (!selectedTable) {
      setActiveOrder(null);
      return;
    }

    const order = orders.find((o) => o.tableId === selectedTable.id);
    setActiveOrder(order || null);
  }, [selectedTable, orders, orderMode]);

  

  /* ========================
       DERIVED VALUES
  ========================= */
  const parcelOrders = orders.filter(
    (o) => o.orderType === "parcel" && o.status !== "paid"
  );

  const originalTotal = activeOrder?.totalAmount || 0;
  const discountAmount = Math.round((originalTotal * offerPercent) / 100);

  const finalPayable = Math.max(
    originalTotal -
      discountAmount +
      (orderMode === "parcel" ? parcelCharge : 0),
    0
  );

  /* ========================
       HANDLERS
  ========================= */
  const handleTableClick = (table) => {
    setSelectedTable(table);
    setOrderMode("dine_in");
    setParcelCharge(0);
    setCustomerPhone("");
    setOfferPercent(0);
    setPaymentType("cash");
  };

  const handleParcelClick = (order) => {
    setOrderMode("parcel");
    setSelectedTable(null);
    setActiveOrder(order);
    setParcelCharge(order.parcelCharge || 0);
    setOfferPercent(order.offerPercent || 0);
    setPaymentType("cash");
  };

  const handleShareWhatsApp = () => {
    if (!activeOrder) return;

    const cleanPhone = customerPhone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      showError("Invalid WhatsApp number");
      return;
    }

    const text = formatBillToText(
      {
        ...activeOrder,
        offerPercent,
        discountAmount,
        finalAmount: finalPayable,
      },
      orderMode === "parcel" ? "Parcel" : selectedTable.number
    );

    shareBillOnWhatsApp(cleanPhone, text);

    updateDoc(doc(db, "orders", activeOrder.id), {
      customerPhone: cleanPhone,
      whatsappSent: true,
      whatsappSentAt: serverTimestamp(),
    }).catch(console.error);
  };

  const handleCheckout = async () => {
    if (!activeOrder) return;

    try {
      await updateDoc(doc(db, "orders", activeOrder.id), {
        orderType: orderMode,
        parcelCharge: orderMode === "parcel" ? parcelCharge : 0,
        offerPercent,
        discountAmount,
        finalAmount: finalPayable,
        paymentType,
        status: "paid",
        paidAt: serverTimestamp(),
      });

      if (orderMode === "dine_in" && selectedTable) {
        await updateDoc(doc(db, "tables", selectedTable.id), {
          status: "available",
        });
      }

      showSuccess("Payment successful");

      setActiveOrder(null);
      setSelectedTable(null);
      setParcelCharge(0);
      setOfferPercent(0);
      setCustomerPhone("");
    } catch (err) {
      console.error(err);
      showError("Checkout failed");
    }
  };

  /* ========================
       UI
  ========================= */
  return (
    <div className="relative min-h-[calc(100vh-100px)] flex flex-col lg:flex-row gap-6">
      {/* LEFT PANEL */}
      <div className="flex-1 bg-white rounded-xl border p-6 overflow-y-auto pb-36 lg:pb-6">
        <h2 className="text-xl font-bold mb-4">Tables Overview</h2>

        <button
          onClick={() => navigate("/cashier/parcel")}
          className="w-full mb-4 py-3 bg-brand-orange text-white font-bold rounded-lg"
        >
          Parcel Order
        </button>

        {/* PARCEL ORDERS */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-2">Parcel Orders</h3>

          {parcelOrders.length === 0 ? (
            <p className="text-xs text-gray-400">No parcel orders</p>
          ) : (
            <div className="space-y-2">
              {parcelOrders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => handleParcelClick(order)}
                  className={`w-full p-3 rounded border flex justify-between text-sm
                    ${
                      activeOrder?.id === order.id
                        ? "border-brand-orange bg-brand-orange/10"
                        : "border-gray-200 bg-white"
                    }`}
                >
                  <span>Parcel #{order.tokenNo || order.id.slice(-4)}</span>
                  <span className="font-semibold text-brand-orange">
                    ₹{order.totalAmount}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* TABLES */}
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {tables.map((table) => {
              const isOccupied = table.status === "occupied";
              const previewOrder = orders.find(
                (o) => o.tableId === table.id
              );

              return (
                <button
                  key={table.id}
                  onClick={() => handleTableClick(table)}
                  className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2
                    ${
                      isOccupied
                        ? "bg-brand-orange/10 border-brand-orange"
                        : "bg-green-50 border-green-300"
                    }`}
                >
                  <Users />
                  <span className="font-semibold">
                    Table {table.number}
                  </span>

                  {isOccupied && previewOrder && (
                    <span className="text-xs bg-white px-2 py-0.5 rounded border">
                      ₹{previewOrder.totalAmount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* RIGHT PANEL – CHECKOUT */}
      <div className="fixed bottom-0 left-0 right-0 lg:static lg:w-96 bg-white rounded-t-xl lg:rounded-xl border shadow-lg max-h-[70vh] lg:max-h-full flex flex-col">
        <div className="p-5 border-b">
          <h3 className="font-bold flex items-center gap-2">
            <Receipt /> Checkout
          </h3>
        </div>

        <div className="flex-1 p-5 overflow-y-auto">
          {!activeOrder ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <Coffee size={40} />
              <p>Select table or parcel order</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* ITEMS */}
              {activeOrder.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{item.qty}× {item.name}</span>
                  <span>₹{item.qty * item.price}</span>
                </div>
              ))}

              {/* DISCOUNT */}
              <div className="pt-3 border-t space-y-2">
                <label className="text-sm font-semibold text-gray-600">
                  Discount (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={offerPercent}
                  onChange={(e) =>
                    setOfferPercent(
                      Math.min(100, Math.max(0, Number(e.target.value)))
                    )
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              {/* PARCEL CHARGE */}
              {orderMode === "parcel" && (
                <div className="pt-3 border-t space-y-2">
                  <label className="text-sm font-semibold text-gray-600">
                    Parcel / Packing Charge
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={parcelCharge}
                    onChange={(e) =>
                      setParcelCharge(Number(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="Enter parcel charge"
                  />
                </div>
              )}

              {/* TOTAL */}
              <div className="flex justify-between font-bold text-lg pt-2">
                <span>Total</span>
                <span className="text-brand-orange">
                  ₹{finalPayable}
                </span>
              </div>

              {/* ACTIONS */}
              <div className="flex gap-2">
                <input
                  type="tel"
                  placeholder="WhatsApp number (optional)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="flex-1 border px-3 py-2 rounded"
                />
                <button
                  onClick={handleShareWhatsApp}
                  className="p-2 bg-green-500 text-white rounded"
                >
                  <Smartphone size={18} />
                </button>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full py-3 bg-brand-orange text-white rounded-lg flex justify-center gap-2"
              >
                <CheckCircle />
                {orderMode === "parcel"
                  ? "Collect Payment"
                  : "Mark Paid & Free Table"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
