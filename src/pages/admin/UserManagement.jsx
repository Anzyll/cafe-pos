import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Users, Shield, Check } from 'lucide-react';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [newRole, setNewRole] = useState('');

    useEffect(() => {
        const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleRoleUpdate = async (userId) => {
        if (!newRole) return;
        try {
            await updateDoc(doc(db, 'users', userId), { role: newRole });
            setEditingId(null);
            setNewRole('');
        } catch (error) {
            console.error("Error updating role:", error);
            alert("Failed to update role");
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
                <Users className="text-blue-600" />
                User & Staff Management
            </h3>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Role</th>
                            <th className="px-4 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" className="text-center py-4">Loading users...</td></tr>
                        ) : users.map(user => (
                            <tr key={user.id} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-900">{user.name || 'N/A'}</td>
                                <td className="px-4 py-3 text-gray-500">{user.email}</td>
                                <td className="px-4 py-3">
                                    {editingId === user.id ? (
                                        <select
                                            value={newRole || user.role}
                                            onChange={(e) => setNewRole(e.target.value)}
                                            className="border rounded px-2 py-1"
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="waiter">Waiter</option>
                                            <option value="cashier">Cashier</option>
                                        </select>
                                    ) : (
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                                user.role === 'waiter' ? 'bg-orange-100 text-orange-700' :
                                                    'bg-green-100 text-green-700'
                                            }`}>
                                            {user.role}
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    {editingId === user.id ? (
                                        <div className="flex gap-2">
                                            <button onClick={() => handleRoleUpdate(user.id)} className="text-green-600 hover:text-green-800"><Check size={18} /></button>
                                            <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600">Cancel</button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => { setEditingId(user.id); setNewRole(user.role); }}
                                            className="text-blue-600 hover:underline"
                                        >
                                            Edit Role
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
