import React from 'react';

// পণ্যের তালিকা (ডামি ডাটা)
const products = [
  { id: 1, name: "প্রিমিয়াম টি-শার্ট", price: "৳ ৪৯৯", image: "👕" },
  { id: 3, name: "স্মার্ট ওয়াচ", price: "৳ ২,৪৯৯", image: "⌚" },
  { id: 2, name: "রানিং শু", price: "৳ ১,৯৯৯", image: "👟" },
  { id: 4, name: "সানগ্লাস", price: "৳ ৭৯৯", image: "🕶️" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* ব্যানার / Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16 text-center shadow-md">
        <h1 className="text-4xl font-extrabold mb-3">NIJUM SHOP-এ আপনাকে স্বাগতম! ✨</h1>
        <p className="text-lg opacity-90">সেরা মূল্যে সেরা ব্র্যান্ডের পণ্য কিনুন আমাদের কাছে।</p>
      </section>

      {/* প্রোডাক্ট গ্রিড / Product Section */}
      <main className="max-w-6xl mx-auto py-12 px-4">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-blue-600 pb-2 inline-block">
          জনপ্রিয় পণ্যসমূহ
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mt-4">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-md p-5 flex flex-col items-center hover:shadow-xl transition duration-300 transform hover:-translate-y-1">
              <div className="text-7xl mb-4 bg-gray-100 p-4 rounded-full">{product.image}</div>
              <h3 className="font-semibold text-lg text-gray-900">{product.name}</h3>
              <p className="text-blue-600 font-bold text-xl my-2">{product.price}</p>
              <button className="w-full mt-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium transition duration-200">
                কিনুন / কার্টে যোগ করুন
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}