import React from 'react';

const TermsOfService: React.FC = () => {
  return (
    <div className="bg-white dark:bg-neutral-900">
      <section className="border-b bg-neutral-50 dark:bg-neutral-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Terms of Service</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Please read these terms carefully before using our website.</p>
        </div>
      </section>

      <section>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">1. Acceptance of Terms</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">By accessing or using our site, you agree to be bound by these Terms and all applicable laws and regulations.</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">2. Use of the Website</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">You may use the website for lawful purposes only and must not engage in any activity that disrupts the platform or infringes on others' rights.</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">3. Products and Orders</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">Product availability, pricing, and promotions are subject to change without notice. Orders are subject to acceptance and availability.</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">4. Limitation of Liability</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">To the fullest extent permitted by law, we shall not be liable for any indirect, incidental, or consequential damages arising from your use of the site.</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">5. Changes</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">We may update these Terms from time to time. Continued use of the website constitutes acceptance of the revised Terms.</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">6. Contact</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">For any questions, contact us at info@fici.com or +91 81220 03006.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TermsOfService;
