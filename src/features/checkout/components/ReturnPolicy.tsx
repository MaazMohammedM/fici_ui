import React from "react";

const ReturnsPolicy: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
        Returns Policy
      </h2>
      <p className="text-gray-600 dark:text-gray-400">
        Items can be returned within <strong>7 days</strong> of delivery in their
        original condition. Refunds will be processed within 5–7 business days.
      </p>
    </div>
  );
};

export default ReturnsPolicy;