import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="bg-white dark:bg-neutral-900">
      <section className="border-b bg-neutral-50 dark:bg-neutral-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Privacy Policy</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Your privacy is important to us. This policy explains what data we collect and how we use it.</p>
        </div>
      </section>

      <section>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">1. Information We Collect</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">We collect information you provide directly (such as name, email, phone, address) and information collected automatically (such as device and browsing data).</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">2. How We Use Information</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">We use your information to process orders, provide customer support, improve our services, prevent fraud, and comply with legal obligations.</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">3. Sharing of Information</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">We do not sell your personal information. We may share it with service providers who assist in order fulfillment, payments, analytics, and marketing, under confidentiality obligations.</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">4. Security</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">We implement safeguards designed to protect your information. However, no system is 100% secure, and we cannot guarantee absolute security.</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">5. Your Choices</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">You can update your account information at any time. You may opt out of non-essential communications and request deletion of your data where applicable by law.</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">6. Contact</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">Questions about this policy? Contact us at info@fici.com or +91 81220 03006.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
