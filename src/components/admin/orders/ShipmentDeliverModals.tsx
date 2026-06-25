import React, { useEffect } from 'react';
import { Edit } from 'lucide-react';
import type { Order, OrderItem } from '../../../types/order-common';
import { getThumbnailUrl } from '../../../lib/utils/imageOptimization';
import type { ShipmentFormState } from '../../../types/adminOrders';

// Tracking URL mapping for courier partners
const TRACKING_URLS: Record<string, string> = {
  stcourier: 'https://stcourier.com/track/shipment',
  professional: 'https://www.tpcindia.com/',
  dtdc: 'https://www.dtdc.com/track-your-shipment/',
  india_post: 'https://www.indiapost.gov.in/',
  shree_maruti: 'https://shreemaruti.com/track-shipment/',
  delhivery: 'https://www.delhivery.com/track-v2/package/',
};

// Partners that support tracking ID in URL
const PARTNERS_WITH_TRACKING_ID = ['delhivery'];

/* ─── ShipmentModal ────────────────────────────────────────────── */
interface ShipmentModalProps {
  isOpen: boolean;
  order: Order | null;
  shipmentForm: ShipmentFormState;
  setShipmentForm: React.Dispatch<React.SetStateAction<ShipmentFormState>>;
  showCustomPartnerInput: boolean;
  setShowCustomPartnerInput: React.Dispatch<React.SetStateAction<boolean>>;
  selectedItemsForShip: string[];
  setSelectedItemsForShip: React.Dispatch<React.SetStateAction<string[]>>;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  processingAction: string | null;
}

export const ShipmentModal: React.FC<ShipmentModalProps> = ({
  isOpen,
  order,
  shipmentForm,
  setShipmentForm,
  showCustomPartnerInput,
  setShowCustomPartnerInput,
  selectedItemsForShip,
  setSelectedItemsForShip,
  onClose,
  onSubmit,
  processingAction,
}) => {
  if (!isOpen || !order) return null;

  const isSubmitting = processingAction?.includes('shipment') ?? false;

  const isShippingPartnerValid = showCustomPartnerInput
    ? shipmentForm.shipping_partner &&
      shipmentForm.shipping_partner !== 'other' &&
      shipmentForm.shipping_partner.trim() !== ''
    : Boolean(shipmentForm.shipping_partner);

  const submitDisabled =
    isSubmitting ||
    selectedItemsForShip.length === 0 ||
    !isShippingPartnerValid ||
    !shipmentForm.tracking_id;

  // Auto-populate tracking URL based on partner and tracking ID
  useEffect(() => {
    if (shipmentForm.shipping_partner && shipmentForm.shipping_partner !== 'other') {
      const baseUrl = TRACKING_URLS[shipmentForm.shipping_partner];
      if (baseUrl) {
        if (PARTNERS_WITH_TRACKING_ID.includes(shipmentForm.shipping_partner) && shipmentForm.tracking_id) {
          setShipmentForm((prev) => ({ ...prev, tracking_url: `${baseUrl}${shipmentForm.tracking_id}` }));
        } else if (!PARTNERS_WITH_TRACKING_ID.includes(shipmentForm.shipping_partner)) {
          setShipmentForm((prev) => ({ ...prev, tracking_url: baseUrl }));
        }
      }
    }
  }, [shipmentForm.shipping_partner, shipmentForm.tracking_id, setShipmentForm]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 my-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Ship Order Items</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Order #{order.order_id.slice(-8)}</p>

        {/* Item Selection */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Items to Ship</label>
            <button
              onClick={() => {
                const shippableItems = order.order_items
                  .filter((item) => item.item_status === 'pending')
                  .map((item) => item.order_item_id);
                setSelectedItemsForShip(shippableItems);
              }}
              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Select All Shippable
            </button>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4">
            {order.order_items.map((item) => {
              const checked = selectedItemsForShip.includes(item.order_item_id);
              return (
                <label
                  key={item.order_item_id}
                  className={`flex items-center gap-3 p-2 sm:p-3 ${checked ? 'bg-primary/10' : 'hover:bg-gray-50'} rounded-lg cursor-pointer transition-colors`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      setSelectedItemsForShip((prev) =>
                        checked ? prev.filter((id) => id !== item.order_item_id) : [...prev, item.order_item_id]
                      );
                    }}
                    className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary/50"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.product_name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Size: {item.size} • Qty: {item.quantity} • Status: {item.item_status || 'pending'}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {selectedItemsForShip.length} item(s) selected
          </p>
        </div>

        {/* Shipping Details */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Shipping Partner *
            </label>
            <select
              value={shipmentForm.shipping_partner}
              onChange={(e) => {
                const value = e.target.value;
                setShipmentForm((prev) => ({ ...prev, shipping_partner: value }));
                setShowCustomPartnerInput(value === 'other');
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select Partner</option>
              <option value="stcourier">ST Courier</option>
              <option value="professional">Professional (TPC)</option>
              <option value="dtdc">DTDC</option>
              <option value="india_post">India Post</option>
              <option value="shree_maruti">Shree Maruti</option>
              <option value="delhivery">Delhivery</option>
              <option value="other">Other</option>
            </select>
          </div>

          {showCustomPartnerInput && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Custom Shipping Partner Name *
              </label>
              <input
                type="text"
                value={shipmentForm.shipping_partner === 'other' ? '' : shipmentForm.shipping_partner}
                onChange={(e) => setShipmentForm((prev) => ({ ...prev, shipping_partner: e.target.value }))}
                placeholder="Enter shipping partner name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tracking ID *
            </label>
            <input
              type="text"
              value={shipmentForm.tracking_id}
              onChange={(e) => setShipmentForm((prev) => ({ ...prev, tracking_id: e.target.value }))}
              placeholder="Enter tracking ID"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tracking URL (Optional)
            </label>
            <input
              type="url"
              value={shipmentForm.tracking_url}
              onChange={(e) => setShipmentForm((prev) => ({ ...prev, tracking_url: e.target.value }))}
              placeholder="https://tracking.partner.com/track/..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={submitDisabled}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Shipping...' : `Ship ${selectedItemsForShip.length} Item(s)`}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── EditShippingModal ───────────────────────────────────────────── */
interface EditShippingModalProps {
  isOpen: boolean;
  item: OrderItem | null;
  shipmentForm: ShipmentFormState;
  setShipmentForm: React.Dispatch<React.SetStateAction<ShipmentFormState>>;
  showCustomPartnerInput: boolean;
  setShowCustomPartnerInput: React.Dispatch<React.SetStateAction<boolean>>;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  processingAction: string | null;
}

export const EditShippingModal: React.FC<EditShippingModalProps> = ({
  isOpen,
  item,
  shipmentForm,
  setShipmentForm,
  showCustomPartnerInput,
  setShowCustomPartnerInput,
  onClose,
  onSubmit,
  processingAction,
}) => {
  if (!isOpen || !item) return null;

  const isSubmitting = processingAction?.includes('edit-shipment') ?? false;

  const isShippingPartnerValid = showCustomPartnerInput
    ? shipmentForm.shipping_partner &&
      shipmentForm.shipping_partner !== 'other' &&
      shipmentForm.shipping_partner.trim() !== ''
    : Boolean(shipmentForm.shipping_partner);

  const submitDisabled =
    isSubmitting ||
    !isShippingPartnerValid ||
    !shipmentForm.tracking_id;

  // Auto-populate tracking URL based on partner and tracking ID
  useEffect(() => {
    if (shipmentForm.shipping_partner && shipmentForm.shipping_partner !== 'other') {
      const baseUrl = TRACKING_URLS[shipmentForm.shipping_partner];
      if (baseUrl) {
        if (PARTNERS_WITH_TRACKING_ID.includes(shipmentForm.shipping_partner) && shipmentForm.tracking_id) {
          setShipmentForm((prev) => ({ ...prev, tracking_url: `${baseUrl}${shipmentForm.tracking_id}` }));
        } else if (!PARTNERS_WITH_TRACKING_ID.includes(shipmentForm.shipping_partner)) {
          setShipmentForm((prev) => ({ ...prev, tracking_url: baseUrl }));
        }
      }
    }
  }, [shipmentForm.shipping_partner, shipmentForm.tracking_id, setShipmentForm]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 my-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Edit Shipping Details</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{item.product_name}</p>

        {/* Shipping Details */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Shipping Partner *
            </label>
            <select
              value={shipmentForm.shipping_partner}
              onChange={(e) => {
                const value = e.target.value;
                setShipmentForm((prev) => ({ ...prev, shipping_partner: value }));
                setShowCustomPartnerInput(value === 'other');
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select Partner</option>
              <option value="stcourier">ST Courier</option>
              <option value="professional">Professional (TPC)</option>
              <option value="dtdc">DTDC</option>
              <option value="india_post">India Post</option>
              <option value="shree_maruti">Shree Maruti</option>
              <option value="delhivery">Delhivery</option>
              <option value="other">Other</option>
            </select>
          </div>

          {showCustomPartnerInput && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Custom Shipping Partner Name *
              </label>
              <input
                type="text"
                value={shipmentForm.shipping_partner === 'other' ? '' : shipmentForm.shipping_partner}
                onChange={(e) => setShipmentForm((prev) => ({ ...prev, shipping_partner: e.target.value }))}
                placeholder="Enter shipping partner name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tracking ID *
            </label>
            <input
              type="text"
              value={shipmentForm.tracking_id}
              onChange={(e) => setShipmentForm((prev) => ({ ...prev, tracking_id: e.target.value }))}
              placeholder="Enter tracking ID"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tracking URL (Optional)
            </label>
            <input
              type="url"
              value={shipmentForm.tracking_url}
              onChange={(e) => setShipmentForm((prev) => ({ ...prev, tracking_url: e.target.value }))}
              placeholder="https://tracking.partner.com/track/..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={submitDisabled}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Updating...' : 'Update Details'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── DeliverModal ─────────────────────────────────────────────── */
interface DeliverModalProps {
  isOpen: boolean;
  order: Order | null;
  selectedItemsForDeliver: string[];
  setSelectedItemsForDeliver: React.Dispatch<React.SetStateAction<string[]>>;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  processingAction: string | null;
}

export const DeliverModal: React.FC<DeliverModalProps> = ({
  isOpen,
  order,
  selectedItemsForDeliver,
  setSelectedItemsForDeliver,
  onClose,
  onSubmit,
  processingAction,
}) => {
  if (!isOpen || !order) return null;

  const isSubmitting = processingAction?.includes('deliver') ?? false;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 my-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Mark Items as Delivered</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Order #{order.order_id.slice(-8)}</p>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Items to Mark as Delivered
            </label>
            <button
              onClick={() => {
                const deliverableItems = order.order_items
                  .filter((item) => item.item_status === 'shipped')
                  .map((item) => item.order_item_id);
                setSelectedItemsForDeliver(deliverableItems);
              }}
              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Select All Deliverable
            </button>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            {order.order_items.map((item) => {
              const isDisabled = item.item_status !== 'shipped';
              const checked = selectedItemsForDeliver.includes(item.order_item_id);
              return (
                <label
                  key={item.order_item_id}
                  className={`flex items-center gap-3 p-2 rounded ${
                    isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      setSelectedItemsForDeliver((prev) =>
                        e.target.checked
                          ? [...prev, item.order_item_id]
                          : prev.filter((id) => id !== item.order_item_id)
                      );
                    }}
                    disabled={isDisabled}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <img
                    src={getThumbnailUrl(item.thumbnail_url)}
                    alt={item.product_name}
                    className="w-10 h-10 rounded object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.product_name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Size: {item.size} • Qty: {item.quantity} • Status: {item.item_status || 'pending'}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {selectedItemsForDeliver.length} item(s) selected
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={isSubmitting || selectedItemsForDeliver.length === 0}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Processing...' : `Mark ${selectedItemsForDeliver.length} Item(s) as Delivered`}
          </button>
        </div>
      </div>
    </div>
  );
};
