// This is the fix for the update-item-status edge function to handle replacement rejection

// Add this new case in the switch statement after "approve_replacement" case:

case "reject_replacement": {
  if (!actorIsAdmin) {
    return unauthorized();
  }
  if (item.item_status !== "replacement_requested") {
    return jsonErr(400, "Item not in replacement requested state", corsHeaders);
  }

  if (!reason) {
    return jsonErr(400, "Rejection reason is required", corsHeaders);
  }

  const istNow = nowIST();
  await supabaseServiceClient
    .from("order_items")
    .update({
      item_status: "delivered", // or keep as "replacement_requested" with rejection flag
      replacement_reason: reason, // Store rejection reason
      replacement_rejected_at: istNow, // Add rejection timestamp
      replacement_approved_at: null, // Clear approved timestamp
    })
    .eq("order_item_id", order_item_id);

  console.log(`Replacement rejected for item ${order_item_id} with reason: ${reason}`);
  break;
}

// Also need to update the request_replacement case to ensure reason is properly mapped:

case "request_replacement": {
  if (!canActAsUser) {
    return unauthorized();
  }
  if (item.item_status !== "delivered") {
    return jsonErr(400, "Replacement can be requested only for delivered items", corsHeaders);
  }

  if (!reason) {
    return jsonErr(400, "Replacement reason is required", corsHeaders);
  }

  const deliveredAt = item.delivered_at || order.delivered_at || null;
  const deliveredDate = deliveredAt ? new Date(deliveredAt) : null;
  if (!deliveredDate) {
    return jsonErr(400, "Delivered timestamp not available", corsHeaders);
  }

  const now = new Date();
  const diffDays = (now.getTime() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays > 3) {
    return jsonErr(400, "Replacement window expired (3 days)", corsHeaders);
  }

  const istNow = nowIST();
  await supabaseServiceClient
    .from("order_items")
    .update({
      item_status: "replacement_requested",
      replacement_reason: reason, // Ensure reason is properly stored
      replacement_requested_at: istNow,
    })
    .eq("order_item_id", order_item_id);

  console.log(`Replacement requested for item ${order_item_id} with reason: ${reason}`);
  break;
}
