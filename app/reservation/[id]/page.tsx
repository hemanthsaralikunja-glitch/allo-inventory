"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ReservationPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params);  // ← fix for Next.js 15
  const [reservation, setReservation] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/reservations/${id}`)
      .then(r => {
        if (!r.ok) throw new Error("Failed to fetch");
        return r.json();
      })
      .then(data => {
        setReservation(data);
        const secondsLeft = Math.floor(
          (new Date(data.expiresAt).getTime() - Date.now()) / 1000
        );
        setTimeLeft(Math.max(0, secondsLeft));
      })
      .catch(() => setMessage("❌ Failed to load reservation"));
  }, [id]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  async function handleConfirm() {
    const res = await fetch(`/api/reservations/${id}/confirm`,
      { method: "POST" }
    );
    if (res.status === 410) {
      setMessage("❌ Reservation expired!");
      return;
    }
    const data = await res.json();
    setReservation(data);
    setMessage("✅ Purchase confirmed! Thank you.");
  }

  async function handleCancel() {
    const res = await fetch(`/api/reservations/${id}/release`,
      { method: "POST" }
    );
    const data = await res.json();
    setReservation(data);
    setMessage("🚫 Reservation cancelled.");
  }

  if (!reservation && !message) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500 text-lg">Loading reservation...</p>
    </div>
  );

  if (message && !reservation) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-red-500 text-lg mb-4">{message}</p>
        <button onClick={() => router.push("/")}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl">
          ← Back to Products
        </button>
      </div>
    </div>
  );

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <div className="max-w-lg mx-auto p-6">
      <div className="bg-slate-800 text-white p-4 rounded-xl mb-6 text-center">
        <h1 className="text-2xl font-bold">🛒 Checkout</h1>
      </div>

      <div className="border rounded-xl p-6 bg-white shadow-sm mb-6">
        <h2 className="text-xl font-semibold">{reservation?.product?.name}</h2>
        <p className="text-gray-500 text-sm">{reservation?.warehouse?.name}</p>
        <p className="text-3xl font-bold text-blue-600 mt-2">
          ₹{reservation?.product?.price.toLocaleString()}
        </p>
        <p className="mt-2 text-gray-600">
          Quantity: <strong>{reservation?.quantity}</strong>
        </p>
        <div className="mt-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium
            ${reservation?.status === "PENDING"   ? "bg-yellow-100 text-yellow-800" : ""}
            ${reservation?.status === "CONFIRMED" ? "bg-green-100 text-green-800"  : ""}
            ${reservation?.status === "RELEASED"  ? "bg-red-100 text-red-800"      : ""}
          `}>
            {reservation?.status}
          </span>
        </div>
      </div>

      {reservation?.status === "PENDING" && (
        <div className={`text-center p-4 rounded-xl mb-6
          ${timeLeft > 60 ? "bg-blue-50" : "bg-red-50"}`}>
          <p className="text-sm text-gray-500 mb-1">Reservation expires in</p>
          <p className={`text-5xl font-bold
            ${timeLeft > 60 ? "text-blue-600" : "text-red-600"}`}>
            {mins}:{secs.toString().padStart(2, "0")}
          </p>
          {timeLeft === 0 && (
            <p className="text-red-600 mt-2 font-medium">
              ⚠️ Reservation expired!
            </p>
          )}
        </div>
      )}

      {message && (
        <div className="p-4 rounded-xl bg-gray-50 border mb-6 text-center font-medium">
          {message}
        </div>
      )}

      {reservation?.status === "PENDING" && timeLeft > 0 && (
        <div className="flex gap-4">
          <button onClick={handleConfirm}
            className="flex-1 bg-green-600 text-white py-4
                       rounded-xl font-semibold text-lg
                       hover:bg-green-700 transition">
            ✅ Confirm Purchase
          </button>
          <button onClick={handleCancel}
            className="flex-1 bg-red-100 text-red-700 py-4
                       rounded-xl font-semibold text-lg
                       hover:bg-red-200 transition">
            ❌ Cancel
          </button>
        </div>
      )}

      {(reservation?.status !== "PENDING" || timeLeft === 0) && (
        <button onClick={() => router.push("/")}
          className="w-full bg-blue-600 text-white py-4
                     rounded-xl font-semibold text-lg
                     hover:bg-blue-700 transition mt-4">
          ← Back to Products
        </button>
      )}
    </div>
  );
}