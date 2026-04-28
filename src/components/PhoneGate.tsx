"use client";

import { useState } from "react";

interface PhoneGateProps {
  topics: string[];
  onUnlock: () => void;
}

export default function PhoneGate({ topics, onUnlock }: PhoneGateProps) {
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, country_code: countryCode, phone, topics }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      localStorage.setItem("fitbrief_phone", phone);
      onUnlock();
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 max-w-md mx-auto mt-8">
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        Unlock the full newsletter
      </h3>
      <p className="text-gray-600 text-sm mb-6">
        Enter your details to read the complete edition. We save your info so
        your topic preferences are remembered next time.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 focus:border-green-500 focus:outline-none"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">
            Phone Number
          </label>
          <div className="flex gap-2">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="w-24 px-2 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 focus:border-green-500 focus:outline-none"
            >
              <option value="+91">+91</option>
              <option value="+1">+1</option>
              <option value="+44">+44</option>
              <option value="+61">+61</option>
              <option value="+971">+971</option>
              <option value="+65">+65</option>
              <option value="+81">+81</option>
            </select>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="flex-1 px-4 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 focus:border-green-500 focus:outline-none"
              placeholder="98765 43210"
            />
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? "Saving..." : "Read Full Newsletter"}
        </button>
      </form>
    </div>
  );
}
