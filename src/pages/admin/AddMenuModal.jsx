import { useState, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { X } from 'lucide-react';

export default function AddMenuModal({ isOpen, onClose, editItem }) {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('Coffee');
    const [price, setPrice] = useState('');
    const [isAvailable, setIsAvailable] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (editItem) {
            setName(editItem.name);
            setCategory(editItem.category);
            setPrice(editItem.price);
            setIsAvailable(editItem.isAvailable);
        } else {
            setName('');
            setCategory('Coffee');
            setPrice('');
            setIsAvailable(true);
        }
    }, [editItem]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const data = {
                name,
                category,
                price: Number(price),
                isAvailable
            };

            if (editItem) {
                await updateDoc(doc(db, 'menu', editItem.id), data);
            } else {
                await addDoc(collection(db, 'menu'), data);
            }
            onClose();
        } catch (error) {
            console.error(error);
            alert('Error saving item');
        }
        setSaving(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md border border-brand-orange/20">

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-brand-orange/20">
                    <h3 className="text-lg font-bold text-gray-800">
                        {editItem ? 'Edit Item' : 'Add New Item'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-brand-orange transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4">

                    {/* Item Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Item Name
                        </label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-base
                                focus:outline-none focus:border-brand-orange
                                focus:ring-2 focus:ring-brand-orange"
                        />
                    </div>

                    {/* Category + Price */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Category
                            </label>
                            <select
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 p-2 bg-white
                                    focus:outline-none focus:border-brand-orange
                                    focus:ring-2 focus:ring-brand-orange"
                            >
                                <option value="Coffee">Coffee</option>
                                <option value="Food">Food</option>
                                <option value="Dessert">Dessert</option>
                                <option value="Cold Drinks">Cold Drinks</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Price (₹)
                            </label>
                            <input
                                type="number"
                                required
                                min="0"
                                value={price}
                                onChange={e => setPrice(e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 p-2
                                    focus:outline-none focus:border-brand-orange
                                    focus:ring-2 focus:ring-brand-orange"
                            />
                        </div>
                    </div>

                    {/* Availability */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isAvailable"
                            checked={isAvailable}
                            onChange={e => setIsAvailable(e.target.checked)}
                            className="rounded border-gray-300 text-brand-orange
                                focus:ring-2 focus:ring-brand-orange"
                        />
                        <label
                            htmlFor="isAvailable"
                            className="text-sm font-medium text-gray-700"
                        >
                            Available for ordering
                        </label>
                    </div>

                    {/* Submit */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full bg-brand-orange hover:bg-brand-orangeDark
                                text-white rounded-lg py-2 font-medium
                                transition-colors disabled:opacity-50"
                        >
                            {saving
                                ? 'Saving...'
                                : editItem
                                    ? 'Update Item'
                                    : 'Create Item'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}