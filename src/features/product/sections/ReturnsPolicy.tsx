import React from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";

const ReturnsPolicy: React.FC = () => (
  <div className="border rounded-xl p-4 bg-white dark:bg-gray-900 shadow-sm">
    <h3 className="text-lg font-semibold mb-3 text-primary dark:text-secondary">
      Returns & Assurance
    </h3>
    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
      <li className="flex items-center gap-2">
        <RefreshCw className="w-5 h-5 text-green-600" />
        7-day hassle-free returns
      </li>
      <li className="flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-green-600" />
        100% Original Products
      </li>
    </ul>
  </div>
);

export default ReturnsPolicy;