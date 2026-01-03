import { useState, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Edit2, Trash2, PlusCircle, Coffee, Utensils } from "lucide-react";
import AddMenuModal from "./AddMenuModal";

export default function MenuManagement() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "menu"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMenuItems(items);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this item?")) {
      await deleteDoc(doc(db, "menu", id));
    }
  };

  const toggleAvailability = async (item) => {
    await updateDoc(doc(db, "menu", item.id), {
      isAvailable: !item.isAvailable,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-brand-orange/20">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800">
          <Utensils className="text-brand-orange" />
          Menu Items
        </h3>

        <button
          onClick={() => {
            setEditItem(null);
            setIsModalOpen(true);
          }}
          className="bg-brand-orange hover:bg-brand-orangeDark
          text-white px-4 py-2 rounded-lg
          flex items-center gap-2 transition-colors"
        >
          <PlusCircle size={18} />
          Add Item
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading menu...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-brand-orange/5">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {menuItems.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-brand-orange/5 transition-colors"
                >
                  {/* Name */}
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                    {item.name}
                  </td>

                  {/* Category */}
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
    ${
      item.category === "Coffee"
        ? "bg-amber-100 text-amber-800"
        : item.category === "Food"
        ? "bg-green-100 text-green-800"
        : item.category === "Dessert"
        ? "bg-pink-100 text-pink-800"
        : "bg-blue-100 text-blue-800"
    }`}
                    >
                      {item.category}
                    </span>
                  </td>

                  {/* Price */}
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    ₹{item.price}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleAvailability(item)}
                      className={`text-xs px-2 py-1 rounded-full border transition-colors
    ${
      item.isAvailable
        ? "border-green-500 text-green-600 bg-green-50 hover:bg-green-100"
        : "border-red-500 text-red-600 bg-red-50 hover:bg-red-100"
    }`}
                    >
                      {item.isAvailable ? "Available" : "Unavailable"}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setEditItem(item);
                        setIsModalOpen(true);
                      }}
                      className="text-brand-orange hover:text-brand-orangeDark mr-4"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}

              {menuItems.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-6 text-center text-gray-500 bg-brand-orange/5"
                  >
                    No items found. Add some!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <AddMenuModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          editItem={editItem}
        />
      )}
    </div>
  );
}
