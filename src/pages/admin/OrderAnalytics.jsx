import { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { BarChart3, Calendar, IndianRupee } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download } from "lucide-react";

const PAGE_SIZE = 10;

export default function OrderAnalytics() {
  const today = new Date().toISOString().slice(0, 10);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [stats, setStats] = useState({
    totalSales: 0,
    orderCount: 0,
    avgValue: 0,
  });

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    fetchOrders();
  }, [fromDate, toDate]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);

      const allOrders = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          date: data.createdAt
            ? data.createdAt.toDate().toISOString().slice(0, 10)
            : null,
        };
      });

      const filtered = allOrders.filter(
        (o) => o.date && o.date >= fromDate && o.date <= toDate
      );

      setOrders(filtered);

      const paidOrders = filtered.filter((o) => o.status === "paid");
      const totalSales = paidOrders.reduce(
        (sum, o) => sum + (o.totalAmount || 0),
        0
      );

      const count = paidOrders.length;

      setStats({
        totalSales,
        orderCount: count,
        avgValue: count ? Math.round(totalSales / count) : 0,
      });
    } catch (err) {
      console.error("Analytics error", err);
    }
    setLoading(false);
  };
const downloadPDF = () => {
  const paidOrders = orders.filter(o => o.status === "paid");

  if (paidOrders.length === 0) {
    alert("No paid orders available for selected dates");
    return;
  }

  const doc = new jsPDF("p", "mm", "a4");
  const left = 14;
  let currentY = 15;

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Order Analytics Report", left, currentY);

  currentY += 6;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Date Range: ${fromDate} to ${toDate}`, left, currentY);

  currentY += 4;
  doc.setDrawColor(200);
  doc.line(left, currentY, 196, currentY);

  // Summary
  currentY += 8;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", left, currentY);

  currentY += 6;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Total Sales: Rs. ${stats.totalSales} (paid)`, left, currentY);

  currentY += 5;
  doc.text(`Paid Orders: ${stats.orderCount}`, left, currentY);

  currentY += 5;
  doc.text(`Avg Order Value: Rs. ${stats.avgValue}`, left, currentY);

  // Table
  const tableData = paidOrders.map(order => [
    order.id.slice(0, 6),
    order.createdAt
      ? order.createdAt.toDate().toLocaleString("en-IN")
      : "--",
    order.tableNumber || "-",
    order.items.map(i => `${i.qty}x ${i.name}`).join(", "),
    `Rs. ${order.totalAmount}`,
    "PAID"
  ]);

  autoTable(doc, {
    startY: currentY + 8,
    head: [[
      "Order ID",
      "Date & Time",
      "Table",
      "Items",
      "Total",
      "Status"
    ]],
    body: tableData,
    styles: {
      fontSize: 9,
      cellPadding: 3,
      valign: "top"
    },
    headStyles: {
      fillColor: [255, 165, 0],
      fontStyle: "bold",
       textColor: [0, 0, 0] 
    },
    columnStyles: {
      3: { cellWidth: 65 },
      4: { halign: "right" }
    }
  });

  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(
    `Generated on ${new Date().toLocaleString("en-IN")}`,
    left,
    pageHeight - 10
  );

  doc.save(`paid_orders_${fromDate}_to_${toDate}.pdf`);
};

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-8 border border-brand-orange/20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800">
          <BarChart3 className="text-brand-orange" />
          Order Analytics
        </h3>

        <div className="flex flex-wrap items-center gap-3 bg-brand-orange/5 border border-brand-orange/20 rounded-lg px-3 py-2">
          <Calendar size={18} className="text-gray-500" />
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>

        <button
          onClick={downloadPDF}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-orange text-white font-semibold hover:bg-brand-orange/90"
        >
          <Download size={25} />
          Download PDF
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-4 bg-brand-orange/10 rounded-xl">
          <h4 className="text-sm font-medium">Total Sales (Paid)</h4>
          <div className="text-3xl font-bold flex items-center gap-1">
            <IndianRupee size={22} /> {stats.totalSales}
          </div>
        </div>
        <div className="p-4 bg-blue-50 rounded-xl">
          <h4 className="text-sm font-medium">Paid Orders</h4>
          <div className="text-3xl font-bold">{stats.orderCount}</div>
        </div>
        <div className="p-4 bg-purple-50 rounded-xl">
          <h4 className="text-sm font-medium">Avg Order Value</h4>
          <div className="text-3xl font-bold">₹{stats.avgValue}</div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-center py-8 text-gray-400">Loading analytics...</p>
      ) : (
        <>
          <div className="overflow-x-auto border border-brand-orange/20 rounded-lg">
            <table className="min-w-full border-collapse">
              {/* ✅ HEADINGS RESTORED */}
              <thead className="bg-brand-orange/5">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Order ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Date & Time</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase">Table</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Items</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase">Total</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase">Status</th>
                </tr>
              </thead>

              <tbody className="text-sm">
                {orders.slice(0, visibleCount).map((order) => {
                  const itemsText = order.items.map((i) => `${i.qty}x ${i.name}`);
                  const isExpanded = expandedOrderId === order.id;
                  const visibleItems = isExpanded ? itemsText : itemsText.slice(0, 3);

                  return (
                    <tr key={order.id} className="border-t align-top">
                      <td className="px-4 py-3 font-mono">#{order.id.slice(0, 6)}</td>
                      <td className="px-4 py-3">{order.createdAt?.toDate().toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">{order.tableNumber}</td>
                      <td className="px-4 py-3">
                        {visibleItems.map((t, i) => (
                          <div key={i}>{t}</div>
                        ))}
                        {itemsText.length > 3 && (
                          <button
                            onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                            className="text-xs text-brand-orange"
                          >
                            {isExpanded ? "Show less" : `+${itemsText.length - 3} more`}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-bold">₹{order.totalAmount}</td>
                      <td className="px-4 py-3 text-center">{order.status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {orders.length > PAGE_SIZE && (
            <div className="flex justify-center py-4">
              {visibleCount < orders.length ? (
                <button
                  onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                  className="px-4 py-2 border rounded-lg text-brand-orange"
                >
                  Show more
                </button>
              ) : (
                <button
                  onClick={() => setVisibleCount(PAGE_SIZE)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Show less
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
