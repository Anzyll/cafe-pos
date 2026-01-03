import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { LayoutGrid, Plus, Trash2 } from 'lucide-react';

export default function TableManagement() {
    const [tables, setTables] = useState([]);
    const [newTable, setNewTable] = useState({ number: '', floor: '1' });

    useEffect(() => {
        const q = query(collection(db, 'tables'), orderBy('number'));
        const unsub = onSnapshot(q, (snap) => {
            setTables(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, []);

    const handleAddTable = async (e) => {
        e.preventDefault();
        if (!newTable.number) return;
        try {
            await addDoc(collection(db, 'tables'), {
                number: newTable.number,
                floor: newTable.floor,
                status: 'free'
            });
            setNewTable({ number: '', floor: '1' });
        } catch (error) {
            console.error("Error adding table:", error);
            alert("Error adding table");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure? This cannot be undone.")) return;
        try {
            await deleteDoc(doc(db, 'tables', id));
        } catch (error) {
            console.error("Error deleting table:", error);
        }
    };

   return (
  <div className="bg-white rounded-lg shadow p-6 border border-brand-orange/20">
    <div className="flex justify-between items-center mb-6">
      <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800">
        <LayoutGrid className="text-brand-orange" />
        Table Management
      </h3>
    </div>

    {/* Add Table Form */}
    <form
      onSubmit={handleAddTable}
      className="flex gap-4 mb-8 bg-brand-orange/5 p-4 rounded-lg items-end border border-brand-orange/20"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Table Number
        </label>
        <input
          type="text"
          placeholder="e.g. 1A"
          value={newTable.number}
          onChange={e =>
            setNewTable({ ...newTable, number: e.target.value })
          }
          className="border border-gray-300 rounded px-3 py-2 w-32
            focus:outline-none focus:border-brand-orange
            focus:ring-2 focus:ring-brand-orange"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Floor
        </label>
        <select
          value={newTable.floor}
          onChange={e =>
            setNewTable({ ...newTable, floor: e.target.value })
          }
          className="border border-gray-300 rounded px-3 py-2 w-32 bg-white
            focus:outline-none focus:border-brand-orange
            focus:ring-2 focus:ring-brand-orange"
        >
          <option value="1">Floor 1</option>
          <option value="2">Floor 2</option>
          <option value="Outdoor">Outdoor</option>
        </select>
      </div>

      <button
        type="submit"
        className="bg-brand-orange hover:bg-brand-orangeDark
          text-white px-4 py-2 rounded
          flex items-center gap-2 transition-colors"
      >
        <Plus size={18} /> Add Table
      </button>
    </form>

    {/* Tables List */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {tables.map(table => (
        <div
          key={table.id}
          className="border border-brand-orange/20 rounded p-4
            flex justify-between items-center
            bg-white shadow-sm hover:border-brand-orange/40 transition-colors"
        >
          <div>
            <div className="font-bold text-lg text-gray-800">
              Table {table.number}
            </div>
            <div className="text-xs text-gray-500 uppercase">
              {table.floor}
            </div>
          </div>

          <button
            onClick={() => handleDelete(table.id)}
            className="text-red-400 hover:text-red-600 p-2"
            title="Delete Table"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ))}

      {tables.length === 0 && (
        <p className="text-gray-400 col-span-full text-center bg-brand-orange/5 p-4 rounded-lg">
          No tables found.
        </p>
      )}
    </div>
  </div>
);
}