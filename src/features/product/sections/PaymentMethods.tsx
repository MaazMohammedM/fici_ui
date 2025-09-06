import React from "react";
import { CreditCard, Smartphone, Wallet } from "lucide-react";

const PaymentMethods: React.FC = () => (
  <div className="border rounded-xl p-4 bg-white dark:bg-gray-900 shadow-sm">
    <h3 className="text-lg font-semibold mb-3 text-primary dark:text-secondary">
      Secure Payment Options
    </h3>
    <div className="flex flex-wrap gap-4">
      <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <CreditCard className="w-5 h-5 text-accent" />
        Credit / Debit Cards
      </span>
      <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <Smartphone className="w-5 h-5 text-accent" />
        UPI / Net Banking
      </span>
      <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <Wallet className="w-5 h-5 text-accent" />
        Wallets & COD
      </span>
    </div>
  </div>
);

export default PaymentMethods;