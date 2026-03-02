const { db } = require('../config/firebaseConfig');

// Parse sizes from JSON string or object
function parseSizes(raw) {
  try {
    let v = raw;
    while (typeof v === 'string') v = JSON.parse(v);
    return typeof v === 'object' && v ? v : null;
  } catch {
    return null;
  }
}

// Validate stock availability before order
async function validateStockAvailability(items) {
  for (const item of items) {
    if (!item.product_id || !item.size || !item.quantity) continue;

    const productDoc = await db.collection('products')
      .doc(item.product_id)
      .get();

    if (!productDoc.exists) {
      throw new Error(`Product ${item.product_id} not found`);
    }

    const product = productDoc.data();
    const sizesObj = parseSizes(product?.sizes);
    
    if (!sizesObj) {
      throw new Error(`Invalid sizes data for product ${item.product_id}`);
    }

    const availableStock = Number(sizesObj[item.size] ?? 0);
    if (availableStock < Number(item.quantity)) {
      throw new Error(`Size ${item.size} Out Of Stock for this product, Kindly update the size or remove the item to place the order`);
    }
  }
}

// Update product inventory (reduce stock)
async function updateProductInventory(items) {
  for (const item of items) {
    if (!item.product_id || !item.size || !item.quantity) continue;

    const productDoc = await db.collection('products')
      .doc(item.product_id)
      .get();

    if (!productDoc.exists) continue;

    const product = productDoc.data();
    const sizesObj = parseSizes(product?.sizes);
    
    if (!sizesObj) continue;

    sizesObj[item.size] = Math.max(
      Number(sizesObj[item.size] ?? 0) - Number(item.quantity),
      0
    );

    await db.collection('products')
      .doc(item.product_id)
      .update({ sizes: JSON.stringify(sizesObj) });

    console.log(`Updated inventory for product ${item.product_id}, size ${item.size}: -${item.quantity}`);
  }
}

// Restore stock for cancelled items
async function restoreStockForCancelledItem(item, cancelReason) {
  if (cancelReason?.toLowerCase().includes("out of stock")) {
    console.log(`Skipping stock restore for item ${item.order_item_id} - cancelled due to out of stock`);
    return;
  }

  if (!item.product_id || !item.size || !item.quantity) {
    console.warn("Missing product_id, size, or quantity - cannot restore stock");
    return;
  }

  const productDoc = await db.collection('products')
    .doc(item.product_id)
    .get();

  if (!productDoc.exists) {
    console.warn(`Product ${item.product_id} not found for stock restore`);
    return;
  }

  const product = productDoc.data();
  const sizesObj = parseSizes(product?.sizes);
  
  if (!sizesObj) {
    console.warn("Could not parse sizes for product", item.product_id);
    return;
  }

  const currentStock = Number(sizesObj[item.size] ?? 0);
  sizesObj[item.size] = currentStock + Number(item.quantity);

  await db.collection('products')
    .doc(item.product_id)
    .update({ sizes: JSON.stringify(sizesObj) });

  console.log(`Restored ${item.quantity} units to product ${item.product_id}, size ${item.size}`);
}

module.exports = {
  parseSizes,
  validateStockAvailability,
  updateProductInventory,
  restoreStockForCancelledItem
};
