"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/products")
      .then(r => r.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      });
  }, []);

  async function handleReserve(productId: string, warehouseId: string) {
    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, warehouseId, quantity: 1 }),
    });

    if (res.status === 409) {
      setError("❌ Not enough stock available!");
      return;
    }

    const reservation = await res.json();
    router.push(`/reservation/${reservation.id}`);
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500 text-lg">Loading products...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="bg-slate-800 text-white p-6 rounded-xl mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2">🛍️ Allo Inventory</h1>
        <p className="text-slate-300">Reserve products before they run out!</p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-xl mb-6 text-center font-medium">
          {error}
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <div key={product.id}
            className="border rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition">
            <h2 className="text-xl font-semibold mb-1">{product.name}</h2>
            <p className="text-gray-500 text-sm mb-2">{product.description}</p>
            <p className="text-2xl font-bold text-blue-600 mb-4">
              ₹{product.price.toLocaleString()}
            </p>

            <div className="space-y-2">
              {product.stockLevels.map((stock: any) => (
                <div key={stock.id}
                  className="flex items-center justify-between
                             border rounded-lg p-3 bg-gray-50">
                  <div>
                    <p className="font-medium text-sm">
                      {stock.warehouse.name}
                    </p>
                    <p className={`text-xs ${stock.available > 0
                      ? "text-green-600"
                      : "text-red-500"}`}>
                      {stock.available > 0
                        ? `${stock.available} units available`
                        : "Out of stock"}
                    </p>
                  </div>
                  <button
                    disabled={stock.available === 0}
                    onClick={() => handleReserve(product.id, stock.warehouseId)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg
                               text-sm font-medium
                               disabled:opacity-50 disabled:cursor-not-allowed
                               hover:bg-blue-700 transition"
                  >
                    Reserve
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}