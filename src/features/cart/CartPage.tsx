import React from "react";
import cartItems from "../data/cartItems.json";
// import images from "../data/images";



interface CartItem {
  id: number;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

const CartPage: React.FC = () => {
  const totalAmount = cartItems.reduce(
    (acc: number, item: CartItem) => acc + item.price * item.quantity,
    0
  );

  return (
    <div className="container mx-auto px-3 py-8">
      <h2 className="text-2xl font-bold mb-6 text-center">Your Cart</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cartItems.map((item: CartItem) => (
          <div
            key={item.id}
            className="bg-white rounded-lg shadow-md p-4 flex flex-col"
          >
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-40 object-cover rounded-md mb-4"
            />
            <h3 className="text-lg font-semibold mb-2">{item.name}</h3>
            <p className="text-gray-600 mb-1">Price: ${item.price.toFixed(2)}</p>
            <p className="text-gray-600 mb-4">Qty: {item.quantity}</p>
            <div className="mt-auto text-right font-bold text-primary">
              Total: ${(item.price * item.quantity).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 text-right">
        <h3 className="text-xl font-bold">Grand Total: ${totalAmount.toFixed(2)}</h3>
        <button className="mt-4 px-6 py-2 bg-primary text-white rounded hover:bg-accent transition">
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
};

export default CartPage;
