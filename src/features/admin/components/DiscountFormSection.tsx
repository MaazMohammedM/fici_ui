// @ts-nocheck
import React, { useState, useEffect } from "react";
import { Percent, MapPin } from "lucide-react";
import { PincodeManager } from "./PincodeManager";
import ProductDiscountForm from "./ProductDiscountForm";
import {
  getActiveCheckoutRule,
  upsertCheckoutRule,
  type CheckoutRule,
} from "@lib/discounts";

type DiscountFormSectionProps = {
  allProducts: any[];
  singleProductId?: string;
  showTabs?: boolean;
  showCheckoutDiscount?: boolean;
};

type CheckoutErrors = {
  min_cart_value?: string;
  max_discount_cap?: string;
  value?: string;
};

const DiscountFormSection: React.FC<DiscountFormSectionProps> = ({
  allProducts,
  singleProductId,
  showTabs = true,
  showCheckoutDiscount = true,
}) => {
  const [activeTab, setActiveTab] = useState<string>("checkout");
  const [checkoutRule, setCheckoutRule] = useState<CheckoutRule | null>(null);
  const [savingCheckout, setSavingCheckout] = useState(false);
  const [checkoutErrors, setCheckoutErrors] = useState<CheckoutErrors>({});

  // Load checkout rule on mount
  useEffect(() => {
    const loadCheckoutRule = async () => {
      try {
        const rule = await getActiveCheckoutRule();
        setCheckoutRule(rule || {
          rule_type: "amount",
          amount: 0,
          percent: null,
          min_order: null,
          max_discount_cap: null,
          active: true,
          starts_at: null,
          ends_at: null
        });
      } catch (error) {
        console.error("Failed to load checkout rule:", error);
      }
    };
    loadCheckoutRule();
  }, []);

  // Validate checkout rule
  const validateCheckoutRule = (rule: CheckoutRule): boolean => {
    const errors: CheckoutErrors = {};

    if (rule.min_order != null && rule.min_order < 0) {
      errors.min_cart_value = "Minimum order amount cannot be negative";
    }

    if (rule.rule_type === "percent") {
      const pct = rule.percent ?? 0;
      if (pct <= 0 || pct > 100) {
        errors.value = "Percent discount must be between 1 and 100";
      }
      if (rule.max_discount_cap != null && rule.max_discount_cap < 0) {
        errors.max_discount_cap = "Maximum discount cap cannot be negative";
      }
    } else {
      const amt = rule.amount ?? 0;
      if (amt <= 0) {
        errors.value = "Amount discount must be greater than 0";
      }
    }

    setCheckoutErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save checkout rule
  const handleSaveCheckoutRule = async () => {
    if (!checkoutRule) return;

    const isValid = validateCheckoutRule(checkoutRule);
    if (!isValid) return;

    try {
      setSavingCheckout(true);
      await upsertCheckoutRule(checkoutRule);
    } catch (error) {
      console.error("Failed to save checkout rule:", error);
    } finally {
      setSavingCheckout(false);
    }
  };

  if (!checkoutRule) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {showTabs && (
        <div className="border-b border-gray-200 dark:border-gray-700">
          <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
            {showCheckoutDiscount && (
              <li className="me-2" role="presentation">
                <button
                  className={`inline-block p-4 border-b-2 rounded-t-lg ${
                    activeTab === "checkout"
                      ? "text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500"
                      : "hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
                  }`}
                  onClick={() => setActiveTab("checkout")}
                >
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4" />
                    <span>Checkout Discount</span>
                  </div>
                </button>
              </li>
            )}
            <li className="me-2" role="presentation">
              <button
                className={`inline-block p-4 border-b-2 rounded-t-lg ${
                  activeTab === "product"
                    ? "text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500"
                    : "hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
                }`}
                onClick={() => setActiveTab("product")}
              >
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4" />
                  <span>Product Discounts</span>
                </div>
              </button>
            </li>
            <li className="me-2" role="presentation">
              <button
                className={`inline-block p-4 border-b-2 rounded-t-lg ${
                  activeTab === "pincode"
                    ? "text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500"
                    : "hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
                }`}
                onClick={() => setActiveTab("pincode")}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>Pincode Management</span>
                </div>
              </button>
            </li>
          </ul>
        </div>
      )}

      <div className="space-y-4">
        {(!showTabs || activeTab === "checkout") && showCheckoutDiscount && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Checkout Discount</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">
                  Type
                  <select
                    className="mt-1 w-full border rounded p-2 bg-transparent dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                    value={checkoutRule.rule_type || "amount"}
                    onChange={(e) => {
                      setCheckoutRule({
                        ...checkoutRule,
                        rule_type: e.target.value as "percent" | "amount",
                        amount: e.target.value === "amount" ? 0 : null,
                        percent: e.target.value === "percent" ? 10 : null
                      });
                    }}
                  >
                    <option value="amount">Amount</option>
                    <option value="percent">Percent</option>
                  </select>
                </label>
                <label className="text-sm flex items-center">
                  Active
                  <input
                    type="checkbox"
                    checked={!!checkoutRule.active}
                    onChange={(e) => {
                      setCheckoutRule({
                        ...checkoutRule,
                        active: e.target.checked,
                      });
                    }}
                    className="ml-2"
                  />
                </label>
              </div>

              {checkoutRule.rule_type === "percent" ? (
                <label className="text-sm">
                  Percent (%)
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="mt-1 w-full border rounded p-2 bg-transparent dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                    value={checkoutRule.percent ?? ""}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (!/^\d*$/.test(raw)) return;
                      setCheckoutRule({
                        ...checkoutRule,
                        percent: raw === "" ? null : Number(raw),
                      });
                    }}
                  />
                  {checkoutErrors.value && (
                    <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                      {checkoutErrors.value}
                    </p>
                  )}
                </label>
              ) : (
                <label className="text-sm">
                  Amount (₹)
                  <input
                    type="number"
                    min={0}
                    className="mt-1 w-full border rounded p-2 bg-transparent dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                    value={checkoutRule.amount ?? ""}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (!/^\d*$/.test(raw)) return;
                      setCheckoutRule({
                        ...checkoutRule,
                        amount: raw === "" ? null : Number(raw),
                      });
                    }}
                  />
                  {checkoutErrors.value && (
                    <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                      {checkoutErrors.value}
                    </p>
                  )}
                </label>
              )}

              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">
                  Min Order (₹)
                  <input
                    type="number"
                    min={0}
                    className="mt-1 w-full border rounded p-2 bg-transparent dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                    value={checkoutRule.min_order ?? ""}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (!/^\d*$/.test(raw)) return;
                      setCheckoutRule({
                        ...checkoutRule,
                        min_order: raw === "" ? null : Number(raw),
                      });
                    }}
                  />
                  {checkoutErrors.min_cart_value && (
                    <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                      {checkoutErrors.min_cart_value}
                    </p>
                  )}
                </label>
                <label className="text-sm">
                  Max Cap (₹)
                  <input
                    type="number"
                    min={0}
                    className="mt-1 w-full border rounded p-2 bg-transparent dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                    value={checkoutRule.max_discount_cap ?? ""}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (!/^\d*$/.test(raw)) return;
                      setCheckoutRule({
                        ...checkoutRule,
                        max_discount_cap: raw === "" ? null : Number(raw),
                      });
                    }}
                  />
                  {checkoutErrors.max_discount_cap && (
                    <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                      {checkoutErrors.max_discount_cap}
                    </p>
                  )}
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveCheckoutRule}
                  disabled={savingCheckout}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingCheckout ? "Saving..." : "Save Checkout Discount"}
                </button>
              </div>
            </div>
          </div>
        )}

        {(!showTabs || activeTab === "product") && (
          <ProductDiscountForm
            allProducts={allProducts}
            singleProductId={singleProductId}
          />
        )}

        {(!showTabs || activeTab === "pincode") && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Pincode Management</h3>
            <PincodeManager />
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscountFormSection;