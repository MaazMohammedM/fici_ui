import React, { useState } from "react";
import { Mail, Send, Gift } from "lucide-react";

const NewsletterCTA: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
      // Here you would typically handle the newsletter subscription
      setTimeout(() => {
        setIsSubmitted(false);
        setEmail("");
      }, 3000);
    }
  };

  return (
    <section className="w-full py-16 sm:py-20 lg:py-24 bg-gradient-to-r from-black to-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Section Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-sm font-medium mb-6">
            <Gift className="w-4 h-4" />
            Exclusive Offers
          </div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
            Get 10% Off Your First Order
          </h2>
          
          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Subscribe to our newsletter and be the first to know about new arrivals, 
            exclusive offers, and style tips.
          </p>
        </div>

        {/* Newsletter Form */}
        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-300"
                  required
                />
              </div>
              <button
                type="submit"
                className="px-8 py-4 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-all duration-300 hover:scale-105 shadow-xl flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                Subscribe
              </button>
            </div>
          </form>
        ) : (
          <div className="max-w-md mx-auto p-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg">
            <div className="text-green-400 text-lg font-semibold mb-2">
              Thank you for subscribing!
            </div>
            <p className="text-gray-300">
              Check your email for your 10% discount code.
            </p>
          </div>
        )}

        {/* Benefits */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="space-y-2">
            <div className="text-2xl font-bold">10% OFF</div>
            <div className="text-sm text-gray-400">Your first order</div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold">EARLY ACCESS</div>
            <div className="text-sm text-gray-400">New collections</div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold">EXCLUSIVE DEALS</div>
            <div className="text-sm text-gray-400">Subscriber only</div>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="mt-8 text-sm text-gray-400">
          By subscribing, you agree to our Privacy Policy and Terms of Service. 
          No spam, unsubscribe anytime.
        </div>
      </div>
    </section>
  );
};

export default NewsletterCTA;
