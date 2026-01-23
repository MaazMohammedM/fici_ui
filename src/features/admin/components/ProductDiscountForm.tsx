// @ts-nocheck
// FULL FILE – Optimized, DB-aligned, clean structure

import React, { useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  Info,
  AlertCircle,
} from "lucide-react";

import {
  getActiveProductDiscountsForProducts,
  upsertProductDiscount,
  type ProductDiscountRule,
} from "@lib/discounts";

import type { Product } from "../../../types/product";

/* ======================================================
   TYPES
====================================================== */

type ProductErrors = Partial<Record<
  | "name"
  | "promotion_type"
  | "value"
  | "max_discount_cap"
  | "priority"
  | "ends_at",
  string
>>;

type BannerState =
  | { type: "success" | "error"; message: string }
  | null;

type Props = {
  allProducts: Product[];
  singleProductId?: string;
};

/* ======================================================
   CONSTANTS
====================================================== */

const PROMOTION_TYPES = [
  { value: "clearance", label: "Clearance Sale" },
  { value: "flash_sale", label: "Flash Sale" },
  { value: "deal_of_the_day", label: "Deal of the Day" },
  { value: "campaign", label: "Campaign" },
  { value: "generic", label: "Generic" },
] as const;

/* ======================================================
   SMALL REUSABLE UI
====================================================== */

const ErrorText = ({ text }: { text?: string }) =>
  text ? <p className="text-xs text-red-600 mt-1">{text}</p> : null;

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-3">
    <h4 className="text-sm font-semibold text-gray-700">{title}</h4>
    {children}
  </div>
);

/* ======================================================
   MAIN COMPONENT
====================================================== */

const ProductDiscountForm: React.FC<Props> = ({
  allProducts,
  singleProductId,
}) => {
  /* ---------------- STATE ---------------- */

  const [selectedProductId, setSelectedProductId] = useState(
    singleProductId || ""
  );

  const [productRule, setProductRule] =
    useState<ProductDiscountRule | null>(null);

  const [errors, setErrors] = useState<ProductErrors>({});
  const [banner, setBanner] = useState<BannerState>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const [discountMap, setDiscountMap] = useState<
    Record<string, ProductDiscountRule>
  >({});

  /* ---------------- DERIVED ---------------- */

  const selectedProduct = useMemo(
    () =>
      allProducts.find((p) => p.product_id === selectedProductId) || null,
    [allProducts, selectedProductId]
  );

  /* ---------------- VALIDATION ---------------- */

  const validate = (rule: ProductDiscountRule) => {
    const e: ProductErrors = {};

    if (!rule.name?.trim()) e.name = "Promotion name is required";
    if (!rule.promotion_type)
      e.promotion_type = "Promotion type is required";

    if (rule.mode === "percent") {
      if (rule.value <= 0 || rule.value > 100)
        e.value = "Percentage must be between 1–100";
      if (rule.max_discount_cap != null && rule.max_discount_cap < 0)
        e.max_discount_cap = "Max cap cannot be negative";
    } else {
      if (rule.value <= 0) e.value = "Amount must be greater than 0";
    }

    if (
      rule.starts_at &&
      rule.ends_at &&
      new Date(rule.starts_at) >= new Date(rule.ends_at)
    ) {
      e.ends_at = "End date must be after start date";
    }

    if (rule.priority < 0 || rule.priority > 1000)
      e.priority = "Priority must be between 0–1000";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ---------------- LOAD ---------------- */

  useEffect(() => {
    if (!selectedProductId) return setProductRule(null);

    const load = async () => {
      try {
        setLoading(true);
        const map = await getActiveProductDiscountsForProducts([
          selectedProductId,
        ]);

        const existing = map[selectedProductId];

        const rule: ProductDiscountRule = {
          product_id: selectedProductId,
          name: `${selectedProduct?.name ?? "Product"} Discount`,
          promotion_type: "generic",
          mode: "amount",
          value: 10,
          base: "price",
          active: true,
          starts_at: null,
          ends_at: null,
          max_discount_cap: null,
          priority: 100,
          stackable: false,
          promo_tag: "",
          ...existing,
        };

        setProductRule(rule);
        validate(rule);
      } catch {
        setBanner({ type: "error", message: "Failed to load discount" });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [selectedProductId]);

  /* ---------------- SAVE ---------------- */

  const handleSave = async () => {
    if (!productRule || !validate(productRule)) {
      setBanner({ type: "error", message: "Fix validation errors" });
      return;
    }

    try {
      setSaving(true);
      await upsertProductDiscount(productRule);
      setDiscountMap((m) => ({
        ...m,
        [productRule.product_id]: productRule,
      }));
      setBanner({ type: "success", message: "Discount saved successfully" });
    } catch {
      setBanner({ type: "error", message: "Save failed" });
    } finally {
      setSaving(false);
    }
  };

  /* ======================================================
     RENDER
  ====================================================== */

  return (
    <div className="space-y-6">
      {/* BANNER */}
      {banner && (
        <div
          className={`p-4 rounded-lg flex gap-2 ${
            banner.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {banner.type === "success" ? <Info /> : <AlertCircle />}
          <span>{banner.message}</span>
        </div>
      )}

      {/* FORM */}
      <div className="bg-white rounded-xl shadow p-6 space-y-6">
        <h2 className="text-xl font-semibold">Product Discount Settings</h2>

        {/* PRODUCT SELECT */}
        <div>
          <label className="text-sm font-medium">Product</label>
          <select
            className="mt-1 w-full border rounded p-2"
            value={selectedProductId}
            disabled={!!singleProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
          >
            <option value="">Select product</option>
            {allProducts.map((p) => (
              <option key={p.product_id} value={p.product_id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* RULE */}
        {productRule && selectedProduct && (
          <>
            <Section title="Basic Details">
              <input
                className="w-full border rounded p-2"
                placeholder="Promotion Name"
                value={productRule.name}
                onChange={(e) =>
                  setProductRule({ ...productRule, name: e.target.value })
                }
              />
              <ErrorText text={errors.name} />

              <div className="flex flex-wrap gap-2">
                {PROMOTION_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() =>
                      setProductRule({
                        ...productRule,
                        promotion_type: t.value,
                      })
                    }
                    className={`px-3 py-1 rounded-full text-xs ${
                      productRule.promotion_type === t.value
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <ErrorText text={errors.promotion_type} />
            </Section>

            <Section title="Discount Logic">
              <div className="flex gap-3">
                {["percent", "amount"].map((m) => (
                  <button
                    key={m}
                    onClick={() =>
                      setProductRule({ ...productRule, mode: m })
                    }
                    className={`px-4 py-1 rounded ${
                      productRule.mode === m
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <input
                type="number"
                className="w-full border rounded p-2"
                value={productRule.value}
                onChange={(e) =>
                  setProductRule({
                    ...productRule,
                    value: Number(e.target.value),
                  })
                }
              />
              <ErrorText text={errors.value} />

              {productRule.mode === "percent" && (
                <>
                  <input
                    type="number"
                    className="w-full border rounded p-2"
                    placeholder="Max discount cap (₹)"
                    value={productRule.max_discount_cap ?? ""}
                    onChange={(e) =>
                      setProductRule({
                        ...productRule,
                        max_discount_cap:
                          e.target.value === ""
                            ? null
                            : Number(e.target.value),
                      })
                    }
                  />
                  <ErrorText text={errors.max_discount_cap} />
                </>
              )}
            </Section>

            <Section title="Schedule">
              <DatePicker
                selected={
                  productRule.starts_at
                    ? new Date(productRule.starts_at)
                    : null
                }
                onChange={(d) =>
                  setProductRule({
                    ...productRule,
                    starts_at: d?.toISOString() ?? null,
                  })
                }
                showTimeSelect
                placeholderText="Start Date"
                className="w-full border rounded p-2"
              />

              <DatePicker
                selected={
                  productRule.ends_at ? new Date(productRule.ends_at) : null
                }
                onChange={(d) =>
                  setProductRule({
                    ...productRule,
                    ends_at: d?.toISOString() ?? null,
                  })
                }
                showTimeSelect
                placeholderText="End Date"
                className="w-full border rounded p-2"
              />
              <ErrorText text={errors.ends_at} />
            </Section>

            <Section title="Advanced">
              <input
                type="number"
                className="w-full border rounded p-2"
                placeholder="Priority"
                value={productRule.priority}
                onChange={(e) =>
                  setProductRule({
                    ...productRule,
                    priority: Number(e.target.value),
                  })
                }
              />
              <ErrorText text={errors.priority} />

              <input
                className="w-full border rounded p-2"
                placeholder="Promo Tag (e.g. BEST DEAL)"
                value={productRule.promo_tag ?? ""}
                onChange={(e) =>
                  setProductRule({
                    ...productRule,
                    promo_tag: e.target.value,
                  })
                }
              />

              <label className="flex gap-2 items-center text-sm">
                <input
                  type="checkbox"
                  checked={productRule.stackable}
                  onChange={(e) =>
                    setProductRule({
                      ...productRule,
                      stackable: e.target.checked,
                    })
                  }
                />
                Stackable with other discounts
              </label>

              <label className="flex gap-2 items-center text-sm">
                <input
                  type="checkbox"
                  checked={productRule.active}
                  onChange={(e) =>
                    setProductRule({
                      ...productRule,
                      active: e.target.checked,
                    })
                  }
                />
                Active
              </label>
            </Section>

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 text-white px-5 py-2 rounded"
              >
                {saving ? "Saving..." : "Save Discount"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProductDiscountForm;