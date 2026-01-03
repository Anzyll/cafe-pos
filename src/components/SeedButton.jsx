// import { useState } from 'react';
// import { writeBatch, doc, collection } from 'firebase/firestore';
// import { db } from '../lib/firebase';
// import { Database } from 'lucide-react';

// const INITIAL_MENU = [
//     { name: 'Espresso', price: 120, category: 'Coffee' },
//     { name: 'Cappuccino', price: 180, category: 'Coffee' },
//     { name: 'Latte', price: 200, category: 'Coffee' },
//     { name: 'Cold Brew', price: 220, category: 'Coffee' },
//     { name: 'Croissant', price: 150, category: 'Food' },
//     { name: 'Sandwich', price: 250, category: 'Food' },
//     { name: 'Cheesecake', price: 300, category: 'Food' }
// ];

// const INITIAL_TABLES = [
//     { number: 1, floor: 'Ground', status: 'free' },
//     { number: 2, floor: 'Ground', status: 'free' },
//     { number: 3, floor: 'Ground', status: 'free' },
//     { number: 4, floor: 'Ground', status: 'free' },
//     { number: 101, floor: 'First', status: 'free' },
//     { number: 102, floor: 'First', status: 'free' },
//     { number: 103, floor: 'First', status: 'free' },
//     { number: 104, floor: 'First', status: 'free' }
// ];

// export default function SeedButton() {
//     const [loading, setLoading] = useState(false);
//     const [msg, setMsg] = useState('');

//     const handleSeed = async () => {
//         if (!confirm('This will Overwrite/Add initial data. Continue?')) return;
//         setLoading(true);
//         setMsg('');

//         try {
//             const batch = writeBatch(db);

//             // Add Menu
//             INITIAL_MENU.forEach((item) => {
//                 const ref = doc(collection(db, 'menu'));
//                 batch.set(ref, { ...item, isAvailable: true });
//             });

//             // Add Tables
//             INITIAL_TABLES.forEach((table) => {
//                 const ref = doc(collection(db, 'tables'));
//                 batch.set(ref, table);
//             });

//             await batch.commit();
//             setMsg('Database Seeding Completed!');
//         } catch (error) {
//             console.error(error);
//             setMsg('Error seeding data: ' + error.message);
//         }
//         setLoading(false);
//     };

//     return (
//         <div className="mt-6 p-4 border rounded-lg bg-yellow-50">
//             <h3 className="font-bold flex items-center gap-2 mb-2 text-yellow-800">
//                 <Database size={18} />
//                 Dev Tools
//             </h3>
//             <button
//                 onClick={handleSeed}
//                 disabled={loading}
//                 className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 text-sm font-medium"
//             >
//                 {loading ? 'Seeding...' : 'Seed Initial Data'}
//             </button>
//             {msg && <p className="text-sm mt-2 text-gray-700">{msg}</p>}
//         </div>
//     );
// }
