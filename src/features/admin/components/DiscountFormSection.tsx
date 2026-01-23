// Improved DiscountFormSection.tsx
import React, { useState, useEffect } from "react";
import { Percent, MapPin, Info, AlertCircle } from "lucide-react";
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
  min_order?: string;
  max_discount_cap?: string;
  value?: string;
  starts_at?: string;
  ends_at?: string;
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
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load checkout rule on mount
  useEffect(() => {
    const loadCheckoutRule = async () => {
      try {
        setCheckoutRule(await getActiveCheckoutRule() || {
          rule_type: "amount",
          amount: null,
          percent: null,
          min_order: null,
          max_discount_cap: null,
          active: false,
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
      errors.min_order = "Minimum order amount cannot be negative";
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

    // Validate date range
    if (rule.starts_at && rule.ends_at && new Date(rule.starts_at) >= new Date(rule.ends_at)) {
      errors.ends_at = "End date must be after start date";
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
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save checkout rule:", error);
    } finally {
      setSavingCheckout(false);
    }
  };

  if (!checkoutRule) {
    return <div className="p-4">Loading discount settings...</div>;
  }

  return (
    <div className="space-y-6">
      {showTabs && (
        <div className="border-b border-gray-200 dark:border-gray-700">
          <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
            {showCheckoutDiscount && (
              <li className="me-2" role="presentation">
                <button
                  className={`inline-flex items-center p-4 border-b-2 rounded-t-lg ${
                    activeTab === "checkout"
                      ? "text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500"
                      : "hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
                  }`}
                  onClick={() => setActiveTab("checkout")}
                >
                  <Percent className="w-4 h-4 mr-2" />
                  <span>Checkout Discount</span>
                </button>
              </li>
            )}
            <li className="me-2" role="presentation">
              <button
                className={`inline-flex items-center p-4 border-b-2 rounded-t-lg ${
                  activeTab === "product"
                    ? "text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500"
                    : "hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
                }`}
                onClick={() => setActiveTab("product")}
              >
                <Percent className="w-4 h-4 mr-2" />
                <span>Product Discounts</span>
              </button>
            </li>
            <li className="me-2" role="presentation">
              <button
                className={`inline-flex items-center p-4 border-b-2 rounded-t-lg ${
                  activeTab === "pincode"
                    ? "text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500"
                    : "hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
                }`}
                onClick={() => setActiveTab("pincode")}
              >
                <MapPin className="w-4 h-4 mr-2" />
                <span>Pincode Management</span>
              </button>
            </li>
          </ul>
        </div>
      )}

      <div className="space-y-6">
        {saveSuccess && (
          <div className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-200 dark:text-green-800" role="alert">
            <span className="font-medium">Success!</span> Checkout discount settings saved successfully.
          </div>
        )}

        {(!showTabs || activeTab === "checkout") && showCheckoutDiscount && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Checkout Discount Settings</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Configure site-wide discounts applied during checkout
              </p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Discount Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Discount Type
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={checkoutRule.rule_type || "amount"}
                    onChange={(e) => {
                      const newType = e.target.value as "percent" | "amount";
                      setCheckoutRule({
                        ...checkoutRule,
                        rule_type: newType,
                        amount: newType === "amount" ? 0 : null,
                        percent: newType === "percent" ? 10 : null
                      });
                    }}
                  >
                    <option value="amount">Fixed Amount</option>
                    <option value="percent">Percentage</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {checkoutRule.rule_type === "percent" 
                      ? "Discount will be calculated as a percentage of the order total"
                      : "Fixed amount to be deducted from the order total"}
                  </p>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <div className="mt-1">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={!!checkoutRule.active}
                          onChange={(e) => {
                            setCheckoutRule({
                              ...checkoutRule,
                              active: e.target.checked,
                            });
                          }}
                        />
                        <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        <span className="ms-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                          {checkoutRule.active ? "Active" : "Inactive"}
                        </span>
                      </label>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {checkoutRule.active
                        ? "This discount is currently active and will be applied to eligible orders."
                        : "This discount is currently inactive and won't be applied to any orders."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Discount Value */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {checkoutRule.rule_type === "percent" ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Discount Percentage
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        className={`block w-full pr-10 sm:text-sm rounded-md ${
                          checkoutErrors.value
                            ? "border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500"
                            : "border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        }`}
                        value={checkoutRule.percent ?? ""}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (!/^\d*$/.test(raw)) return;
                          setCheckoutRule({
                            ...checkoutRule,
                            percent: raw === "" ? null : Number(raw),
                          });
                        }}
                        aria-invalid={!!checkoutErrors.value}
                        aria-describedby="percent-error"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">%</span>
                      </div>
                    </div>
                    {checkoutErrors.value && (
                      <p className="mt-2 text-sm text-red-600" id="percent-error">
                        {checkoutErrors.value}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Enter a value between 1 and 100
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Discount Amount
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">₹</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className={`block w-full pl-7 pr-12 sm:text-sm rounded-md ${
                          checkoutErrors.value
                            ? "border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500"
                            : "border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        }`}
                        value={checkoutRule.amount ?? ""}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (!/^\d*\.?\d*$/.test(raw)) return;
                          setCheckoutRule({
                            ...checkoutRule,
                            amount: raw === "" ? null : Number(raw),
                          });
                        }}
                        aria-invalid={!!checkoutErrors.value}
                        aria-describedby="amount-error"
                      />
                    </div>
                    {checkoutErrors.value && (
                      <p className="mt-2 text-sm text-red-600" id="amount-error">
                        {checkoutErrors.value}
                      </p>
                    )}
                  </div>
                )}

                {/* Max Discount Cap (only for percentage) */}
                {checkoutRule.rule_type === "percent" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Maximum Discount Cap (Optional)
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">₹</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className={`block w-full pl-7 sm:text-sm rounded-md ${
                          checkoutErrors.max_discount_cap
                            ? "border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500"
                            : "border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        }`}
                        value={checkoutRule.max_discount_cap ?? ""}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (!/^\d*\.?\d*$/.test(raw)) return;
                          setCheckoutRule({
                            ...checkoutRule,
                            max_discount_cap: raw === "" ? null : Number(raw),
                          });
                        }}
                        placeholder="No maximum"
                        aria-invalid={!!checkoutErrors.max_discount_cap}
                        aria-describedby="max-cap-error"
                      />
                    </div>
                    {checkoutErrors.max_discount_cap ? (
                      <p className="mt-2 text-sm text-red-600" id="max-cap-error">
                        {checkoutErrors.max_discount_cap}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Maximum amount this discount can apply (leave empty for no limit)
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Minimum Order Amount */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Minimum Order Amount (Optional)
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">₹</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={`block w-full pl-7 sm:text-sm rounded-md ${
                        checkoutErrors.min_order
                          ? "border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500"
                          : "border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      }`}
                      value={checkoutRule.min_order ?? ""}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (!/^\d*\.?\d*$/.test(raw)) return;
                        setCheckoutRule({
                          ...checkoutRule,
                          min_order: raw === "" ? null : Number(raw),
                        });
                      }}
                      placeholder="No minimum"
                      aria-invalid={!!checkoutErrors.min_order}
                      aria-describedby="min-order-error"
                    />
                  </div>
                  {checkoutErrors.min_order ? (
                    <p className="mt-2 text-sm text-red-600" id="min-order-error">
                      {checkoutErrors.min_order}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Minimum order total required to apply this discount
                    </p>
                  )}
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date (Optional)
                  </label>
                  <div className="mt-1">
                    <input
                      type="datetime-local"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={
                        checkoutRule.starts_at
                          ? new Date(checkoutRule.starts_at).toISOString().slice(0, 16)
                          : ""
                      }
                      onChange={(e) => {
                        setCheckoutRule({
                          ...checkoutRule,
                          starts_at: e.target.value
                            ? new Date(e.target.value).toISOString()
                            : null,
                        });
                      }}
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Date and time when this discount becomes active
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date (Optional)
                  </label>
                  <div className="mt-1">
                    <input
                      type="datetime-local"
                      className={`block w-full rounded-md ${
                        checkoutErrors.ends_at
                          ? "border-red-300 text-red-900 placeholder-red-300 focus:outline-none focus:ring-red-500 focus:border-red-500"
                          : "border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      } shadow-sm sm:text-sm`}
                      value={
                        checkoutRule.ends_at
                          ? new Date(checkoutRule.ends_at).toISOString().slice(0, 16)
                          : ""
                      }
                      onChange={(e) => {
                        setCheckoutRule({
                          ...checkoutRule,
                          ends_at: e.target.value
                            ? new Date(e.target.value).toISOString()
                            : null,
                        });
                      }}
                      aria-invalid={!!checkoutErrors.ends_at}
                      aria-describedby="end-date-error"
                    />
                    {checkoutErrors.ends_at ? (
                      <p className="mt-2 text-sm text-red-600" id="end-date-error">
                        {checkoutErrors.ends_at}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Date and time when this discount expires
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveCheckoutRule}
                    disabled={savingCheckout}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingCheckout ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      "Save Checkout Discount"
                    )}
                  </button>
                </div>
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Pincode Management</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage serviceable pincodes and delivery areas
              </p>
            </div>
            <PincodeManager />
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscountFormSection;