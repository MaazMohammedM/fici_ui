import React, { useEffect, useState } from "react";
import {
  getActiveProductDiscountsForProducts,
  upsertProductDiscount,
  type ProductDiscountRule,
} from "@lib/discounts";

type ProductErrors = {
  value?: string;
  max_discount_cap?: string;
};

type BannerState =
  | {
      type: "success" | "error";
      message: string;
    }
  | null;

type ProductDiscountFormProps = {
  allProducts: any[];
  singleProductId?: string; // Optional: if provided, only show discount for this product
};

const ProductDiscountForm: React.FC<ProductDiscountFormProps> = ({
  allProducts,
  singleProductId,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [productRule, setProductRule] = useState<ProductDiscountRule | null>(
    null
  );
  const [savingProduct, setSavingProduct] = useState(false);
  const [productErrors, setProductErrors] = useState<ProductErrors>({});

  const [productDiscountsMap, setProductDiscountsMap] = useState<
    Record<string, ProductDiscountRule>
  >({});
  const [loadingProductDiscounts, setLoadingProductDiscounts] = useState(false);

  const [banner, setBanner] = useState<BannerState>(null);

  // ---------- VALIDATION ----------
  const validateProductRule = (rule: ProductDiscountRule): ProductErrors => {
    const errors: ProductErrors = {};

    if (rule.mode === "percent") {
      const pct = rule.value ?? 0;
      if (pct <= 0 || pct > 100) {
        errors.value = "Percent discount must be between 1 and 100.";
      }
      if (rule.max_discount_cap != null && rule.max_discount_cap < 0) {
        errors.max_discount_cap = "Maximum discount cap cannot be negative.";
      }
    } else {
      const amt = rule.value ?? 0;
      if (amt <= 0) {
        errors.value = "Amount discount must be greater than 0.";
      }
    }

    setProductErrors(errors);
    return errors;
  };

  // Load product discount rule when product changes
  useEffect(() => {
    if (!selectedProductId) {
      setProductRule(null);
      setProductErrors({});
      return;
    }

    // Check if we already have the discount data for this product
    const existing = productDiscountsMap[selectedProductId];
    if (existing) {
      setProductRule(existing);
      validateProductRule(existing);
      return;
    }

    // Only fetch if we don't have the data yet
    const fetchProductDiscount = async () => {
      try {
        const map = await getActiveProductDiscountsForProducts([selectedProductId]);
        const found = map[selectedProductId];
        const fallback: ProductDiscountRule = {
          product_id: selectedProductId,
          mode: "amount",
          value: 0,
          base: "price",
          active: true,
          starts_at: null,
          ends_at: null,
          max_discount_cap: null,
        };
        const toUse = found || fallback;
        
        // Update the rule
        setProductRule(toUse);
        
        // Update the map if we found a discount
        if (found) {
          setProductDiscountsMap(prev => ({
            ...prev,
            [selectedProductId]: found,
          }));
        }
        
        validateProductRule(toUse);
      } catch (error) {
        console.error('Error fetching product discount:', error);
      }
    };

    fetchProductDiscount();
    // Only depend on selectedProductId, not productDiscountsMap to prevent infinite loops
  }, [selectedProductId]);

  // Auto-select single product if provided
  useEffect(() => {
    if (singleProductId && selectedProductId !== singleProductId) {
      setSelectedProductId(singleProductId);
    }
  }, [singleProductId, selectedProductId]);

  // Load a map of all active product discounts for listing
  useEffect(() => {
    if (!allProducts || allProducts.length === 0) return;

    (async () => {
      try {
        setLoadingProductDiscounts(true);
        const ids = allProducts.map((p: any) => p.product_id).filter(Boolean);
        if (!ids.length) {
          setProductDiscountsMap({});
          return;
        }
        const map = await getActiveProductDiscountsForProducts(ids);
        setProductDiscountsMap(map);
      } finally {
        setLoadingProductDiscounts(false);
      }
    })();
  }, [allProducts]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-6">
      {/* Banner */}
      {banner && (
        <div
          className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-50 bg-green-500 text-white px-4 sm:px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 max-w-md sm:max-w-none border ${
            banner.type === "success"
              ? "border-green-400"
              : "bg-red-500 text-white border-red-400"
          }`}
        >
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={
                banner.type === "success"
                  ? "M5 13l4 4L19 7"
                  : "M6 18L18 6M6 6l12 12"
              }
            />
          </svg>
          <span className="text-sm sm:text-base flex-1 pr-2">
            {banner.message}
          </span>
          <button
            onClick={() => setBanner(null)}
            className="flex-shrink-0 p-1 hover:bg-green-600 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-300"
            aria-label="Close message"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      <h3 className="text-lg font-semibold mb-4">Product Discounts</h3>
      <div className="space-y-3">
        {!singleProductId ? (
          <label className="text-sm">
            Select Product
            <select
              className="mt-1 w-full border rounded p-2 bg-transparent"
              value={selectedProductId}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedProductId(value);
                if (!value) {
                  setProductRule(null);
                  setProductErrors({});
                  return;
                }
                const existing = productDiscountsMap[value];
                const baseRule: ProductDiscountRule =
                  existing ?? {
                    product_id: value,
                    mode: "amount",
                    value: 0,
                    base: "price",
                    active: true,
                    starts_at: null,
                    ends_at: null,
                    max_discount_cap: null,
                  };
                setProductRule(baseRule);
                validateProductRule(baseRule);
              }}
            >
              <option value="">-- Choose a product --</option>
              {allProducts.map((p: any) => (
                <option key={p.product_id} value={p.product_id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="text-sm">
            <span className="font-medium">Product:</span> {allProducts.find(p => p.product_id === singleProductId)?.name || singleProductId}
          </div>
        )}
        {selectedProductId && productRule && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">
                Mode
                <select
                  className="mt-1 w-full border rounded p-2 bg-transparent"
                  value={productRule.mode}
                  onChange={(e) => {
                    const nextRule: ProductDiscountRule = {
                      ...productRule,
                      product_id: selectedProductId,
                      mode: e.target.value as any,
                    };
                    setProductRule(nextRule);
                    validateProductRule(nextRule);
                  }}
                >
                  <option value="amount">Amount</option>
                  <option value="percent">Percent</option>
                </select>
              </label>
              <label className="text-sm">
                Base
                <select
                  className="mt-1 w-full border rounded p-2 bg-transparent"
                  value={productRule.base || "price"}
                  onChange={(e) => {
                    const nextRule: ProductDiscountRule = {
                      ...productRule,
                      product_id: selectedProductId,
                      base: e.target.value as any,
                    };
                    setProductRule(nextRule);
                    validateProductRule(nextRule);
                  }}
                >
                  <option value="price">Price</option>
                  <option value="mrp">MRP</option>
                </select>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">
                Value
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full border rounded p-2 bg-transparent"
                  value={productRule.value ?? ""}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (!/^\d*$/.test(raw)) return;
                    const nextRule: ProductDiscountRule = {
                      ...productRule,
                      product_id: selectedProductId,
                      value: raw === "" ? (null as any) : Number(raw),
                    };
                    setProductRule(nextRule);
                    validateProductRule(nextRule);
                  }}
                />
                {productErrors.value && (
                  <p className="mt-1 text-xs text-red-500">
                    {productErrors.value}
                  </p>
                )}
              </label>
              <label className="text-sm">
                Active
                <input
                  type="checkbox"
                  className="ml-2 align-middle"
                  checked={!!productRule.active}
                  onChange={(e) => {
                    const nextRule: ProductDiscountRule = {
                      ...productRule,
                      product_id: selectedProductId,
                      active: e.target.checked,
                    };
                    setProductRule(nextRule);
                    validateProductRule(nextRule);
                  }}
                />
              </label>
            </div>

            {/* Max Cap only for percent mode */}
            {productRule.mode === "percent" && (
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">
                  Max Cap (₹)
                                            <input
                                              type="number"
                                              min={0}
                                              className="mt-1 w-full border rounded p-2 bg-transparent"
                                              value={productRule.max_discount_cap ?? ""}
                                              onChange={(e) => {
                                                const raw = e.target.value;
                                                if (!/^\d*$/.test(raw)) return;
                                                const nextRule: ProductDiscountRule = {
                                                  ...productRule,
                                                  product_id: selectedProductId,
                                                  max_discount_cap:
                                                    raw === "" ? null : Number(raw),
                                                };
                                                setProductRule(nextRule);
                                                validateProductRule(nextRule);
                                              }}
                                            />
                                            {productErrors.max_discount_cap && (
                                              <p className="mt-1 text-xs text-red-500">
                                                {productErrors.max_discount_cap}
                                              </p>
                                            )}
                                          </label>
                                        </div>
                                      )}
                  
                                      <div className="grid grid-cols-2 gap-3">
                                        <label className="text-sm">
                                          Starts At
                                          <input
                                            type="datetime-local"
                                            className="mt-1 w-full border rounded p-2 bg-transparent"
                                            value={
                                              productRule.starts_at
                                                ? new Date(productRule.starts_at)
                                                    .toISOString()
                                                    .slice(0, 16)
                                                : ""
                                            }
                                            onChange={(e) => {
                                              const nextRule: ProductDiscountRule = {
                                                ...productRule,
                                                product_id: selectedProductId,
                                                starts_at: e.target.value
                                                  ? new Date(e.target.value).toISOString()
                                                  : null,
                                              };
                                              setProductRule(nextRule);
                                              validateProductRule(nextRule);
                                            }}
                                          />
                                        </label>
                                        <label className="text-sm">
                                          Ends At
                                          <input
                                            type="datetime-local"
                                            className="mt-1 w-full border rounded p-2 bg-transparent"
                                            value={
                                              productRule.ends_at
                                                ? new Date(productRule.ends_at)
                                                    .toISOString()
                                                    .slice(0, 16)
                                                : ""
                                            }
                                            onChange={(e) => {
                                              const nextRule: ProductDiscountRule = {
                                                ...productRule,
                                                product_id: selectedProductId,
                                                ends_at: e.target.value
                                                  ? new Date(e.target.value).toISOString()
                                                  : null,
                                              };
                                              setProductRule(nextRule);
                                              validateProductRule(nextRule);
                                            }}
                                          />
                                        </label>
                                      </div>
                                      <div className="flex justify-end">
                                        <button
                                          disabled={
                                            savingProduct ||
                                            !productRule ||
                                            Object.keys(productErrors).length > 0
                                          }
                                          onClick={async () => {
                                            if (!productRule) return;
                                            try {
                                              setSavingProduct(true);
                                              const toSave: ProductDiscountRule = {
                                                ...productRule,
                                                product_id: selectedProductId,
                                              };
                  
                                              const errors = validateProductRule(toSave);
                                              if (Object.keys(errors).length > 0) {
                                                // Errors are displayed inline
                                                return;
                                              }
                  
                                              await upsertProductDiscount(toSave);
                                              if (toSave.active) {
                                                setProductDiscountsMap((prev) => ({
                                                  ...prev,
                                                  [selectedProductId]: toSave,
                                                }));
                                              } else {
                                                setProductDiscountsMap((prev) => {
                                                  const copy = { ...prev };
                                                  delete copy[selectedProductId];
                                                  return copy;
                                                });
                                              }
                                              setBanner({
                                                type: "success",
                                                message: "Product discount saved",
                                              });
                                            } catch (e) {
                                              setBanner({
                                                type: "error",
                                                message: "Failed to save product discount",
                                              });
                                            } finally {
                                              setSavingProduct(false);
                                            }
                                          }}
                                          className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
                                        >
                                          {savingProduct ? "Saving..." : "Save"}
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
 {/* Active discounts list */}
              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold">Active Product Discounts</h4>
                  {loadingProductDiscounts && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Loading...
                    </span>
                  )}
                </div>
                {Object.keys(productDiscountsMap).length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    No active product discounts found.
                  </p>
                ) : (
                  <div className="max-h-64 overflow-y-auto text-xs sm:text-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="py-1 pr-2 font-medium">Product</th>
                          <th className="py-1 pr-2 font-medium">Type</th>
                          <th className="py-1 pr-2 font-medium">Base</th>
                          <th className="py-1 pr-2 font-medium">Value</th>
                          <th className="py-1 pr-2 font-medium">Window</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(productDiscountsMap).map(
                          ([productId, rule]) => {
                            const product = allProducts.find(
                              (p: any) => p.product_id === productId
                            );
                            const label = product ? product.name : productId;
                            const valueLabel =
                              rule.mode === "percent"
                                ? `${rule.value}%`
                                : `₹${rule.value}`;
                            const windowLabel =
                              rule.starts_at || rule.ends_at
                                ? `${
                                    rule.starts_at
                                      ? new Date(
                                          rule.starts_at as string
                                        ).toLocaleDateString()
                                      : "—"
                                  } → ${
                                    rule.ends_at
                                      ? new Date(
                                          rule.ends_at as string
                                        ).toLocaleDateString()
                                      : "—"
                                  }`
                                : "Always on";
                            return (
                              <tr
                                key={productId}
                                className="border-b border-gray-100 dark:border-gray-800 last:border-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900"
                                onClick={() => {
                                  // Selecting a row makes the discount editable
                                  setSelectedProductId(productId);
                                  setProductRule(rule);
                                  validateProductRule(rule);
                                }}
                              >
                                <td
                                  className="py-1 pr-2 truncate max-w-[10rem]"
                                  title={label}
                                >
                                  {label}
                                </td>
                                <td className="py-1 pr-2 capitalize">
                                  {rule.mode}
                                </td>
                                <td className="py-1 pr-2 uppercase">
                                  {rule.base || "price"}
                                </td>
                                <td className="py-1 pr-2">{valueLabel}</td>
                                <td className="py-1 pr-2 text-[0.7rem] sm:text-xs">
                                  {windowLabel}
                                </td>
                              </tr>
                            );
                          }
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>)}
export default ProductDiscountForm;