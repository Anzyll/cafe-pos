import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus } from "lucide-react";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("waiter");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        name,
        role,
        createdAt: new Date().toISOString(),
      });

      navigate("/login");
    } catch (err) {
      console.error(err);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-orange/5 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-md w-full max-w-md p-8 border border-brand-orange/20">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <UserPlus className="text-brand-orange" size={28} />
          <h2 className="text-2xl font-bold text-gray-800">Create Account</h2>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
                                       className="
  mt-1 block w-full rounded-md
  border border-gray-300 p-2
  focus:outline-none
  focus:border-brand-orange
  focus:ring-1
  focus:ring-brand-orange
"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="
  mt-1 block w-full rounded-md
  border border-gray-300 p-2
  focus:outline-none
  focus:border-brand-orange
  focus:ring-1
  focus:ring-brand-orange
"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="
  mt-1 block w-full rounded-md
  border border-gray-300 p-2
  focus:outline-none
  focus:border-brand-orange
  focus:ring-1
  focus:ring-brand-orange
"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 p-2
                                focus:border-brand-orange focus:ring-brand-orange"
            >
              <option value="waiter">Waiter</option>
              <option value="cashier">Cashier</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 rounded-md
                            text-sm font-medium text-white
                            bg-brand-orange hover:bg-brand-orangeDark
                            focus:outline-none focus:ring-2 focus:ring-brand-orange
                            disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-4 text-center">
          <Link
            to="/login"
            className="text-sm text-brand-orange hover:underline"
          >
            Already have an account? Login
          </Link>
        </div>
      </div>
    </div>
  );
}
