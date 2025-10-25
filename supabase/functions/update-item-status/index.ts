import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY"); // for auth check
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"); // for writes
const RAZORPAY_SECRET = Deno.env.get("RAZORPAY_SECRET") || "";

const supabaseAuthClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseServiceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
        status: 405,
        headers: corsHeaders,
      });
    }

    const body = await req.json();
    const { action, order_item_id, order_id, reason } = body;

    if (!action || !order_item_id) {
      return new Response(JSON.stringify({
        error: "Missing action or order_item_id"
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Get caller session (if provided in Authorization)
    const authHeader = req.headers.get("authorization");
    let currentUser = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const { data: sessionData } = await supabaseAuthClient.auth.getUser(token);
      currentUser = sessionData?.user ?? null;
    }

    // Fetch order item and parent order with service role (we need full info)
    const { data: itemRows, error: itemError } = await supabaseServiceClient
      .from("order_items")
      .select("*, orders(order_id, user_id, guest_session_id, payment_method, payment_status, shipped_at, delivered_at, created_at)")
      .eq("order_item_id", order_item_id)
      .limit(1)
      .single();

    if (itemError || !itemRows) {
      console.error("fetch item error", itemError);
      return new Response(JSON.stringify({
        error: "Order item not found"
      }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    const item = itemRows;
    const order = item.orders;

    // Authorization: allow if:
    // - admin (check user profile role === 'admin')
    // - or currentUser.id === order.user_id
    // - or guest_session_id passed via body matches order.guest_session_id
    let actorIsAdmin = false;
    try {
      actorIsAdmin = !!currentUser && await isAdmin(currentUser.id);
    } catch (adminError) {
      console.error("Error checking admin status:", adminError);
      return new Response(JSON.stringify({
        error: "Failed to verify admin permissions"
      }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    const actorIsOwner = !!currentUser && currentUser.id === order.user_id;
    const actorIsGuest = body.guest_session_id && body.guest_session_id === order.guest_session_id;
    const canActAsUser = actorIsOwner || actorIsGuest;

    // Map allowed actions
    switch(action) {
      case "cancel_item":
        // User can cancel pending items only; admin can cancel any pending item
        if (!actorIsAdmin && !canActAsUser) {
          return new Response(JSON.stringify({
            error: "Unauthorized"
          }), {
            status: 403,
            headers: corsHeaders,
          });
        }
        if (item.item_status !== "pending") {
          return new Response(JSON.stringify({
            error: "Item not cancellable; status != pending"
          }), {
            status: 400,
            headers: corsHeaders,
          });
        }

        // For razorpay prepaid, refund will be initiated by admin later; here we set item_status cancelled and record reason
        await supabaseServiceClient.from("order_items").update({
          item_status: "cancelled",
          cancel_reason: reason || null,
          refunded_at: null
        }).eq("order_item_id", order_item_id);
        break;

      case "ship_item":
        // Only admin can ship
        if (!actorIsAdmin) {
          return new Response(JSON.stringify({
            error: "Unauthorized"
          }), {
            status: 403,
            headers: corsHeaders,
          });
        }
        if (item.item_status !== "pending") {
          return new Response(JSON.stringify({
            error: "Item not in pending state"
          }), {
            status: 400,
            headers: corsHeaders,
          });
        }

        await supabaseServiceClient.from("order_items").update({
          item_status: "shipped"
        }).eq("order_item_id", order_item_id);
        break;

      case "deliver_item":
        // Admin marks delivered
        if (!actorIsAdmin) {
          return new Response(JSON.stringify({
            error: "Unauthorized"
          }), {
            status: 403,
            headers: corsHeaders,
          });
        }
        if (item.item_status !== "shipped") {
          return new Response(JSON.stringify({
            error: "Item not shippable -> deliver requires shipped status"
          }), {
            status: 400,
            headers: corsHeaders,
          });
        }

        await supabaseServiceClient.from("order_items").update({
          item_status: "delivered"
        }).eq("order_item_id", order_item_id);

        // Optionally set delivered_at on order or item
        await supabaseServiceClient.from("orders").update({
          delivered_at: new Date().toISOString()
        }).eq("order_id", order.order_id);
        break;

      case "request_return":
        // User requests return after delivery and within 3 days
        if (!canActAsUser) {
          return new Response(JSON.stringify({
            error: "Unauthorized"
          }), {
            status: 403,
            headers: corsHeaders,
          });
        }
        if (item.item_status !== "delivered") {
          return new Response(JSON.stringify({
            error: "Return can be requested only for delivered items"
          }), {
            status: 400,
            headers: corsHeaders,
          });
        }

        // check delivered_at (use order.delivered_at or item-level if stored)
        const deliveredAt = item.refunded_at || order.delivered_at || null;
        // If you store delivered_at per item, use that; fallback to order.delivered_at
        const deliveredDate = deliveredAt ? new Date(deliveredAt) : null;

        if (!deliveredDate) {
          return new Response(JSON.stringify({
            error: "Delivered timestamp not available"
          }), {
            status: 400,
            headers: corsHeaders,
          });
        }

        const now = new Date();
        const diffDays = (now.getTime() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24);

        if (diffDays > 3) {
          return new Response(JSON.stringify({
            error: "Return window expired (3 days)"
          }), {
            status: 400,
            headers: corsHeaders,
          });
        }

        // mark return requested
        await supabaseServiceClient.from("order_items").update({
          item_status: "returned",
          return_reason: reason || null,
          return_requested_at: new Date().toISOString()
        }).eq("order_item_id", order_item_id);
        break;

      case "approve_return":
        // Admin approves return and can initiate refund (or set item to returned/refunded)
        if (!actorIsAdmin) {
          return new Response(JSON.stringify({
            error: "Unauthorized"
          }), {
            status: 403,
            headers: corsHeaders,
          });
        }
        if (item.item_status !== "returned") {
          return new Response(JSON.stringify({
            error: "Item not in return requested state"
          }), {
            status: 400,
            headers: corsHeaders,
          });
        }

        await supabaseServiceClient.from("order_items").update({
          item_status: "refunded",
          return_approved_at: new Date().toISOString(),
          refunded_at: new Date().toISOString()
        }).eq("order_item_id", order_item_id);

        // create refund record (insert into refunds) and optionally call provider
        await supabaseServiceClient.from("refunds").insert([
          {
            order_id: order.order_id,
            order_item_id,
            refund_amount: item.refund_amount ?? item.price_at_purchase ?? 0,
            refund_status: 'initiated',
            refund_method: order.payment_method,
            refund_reason: reason || 'Approved by admin'
          }
        ]);
        break;

      case "refund_item":
        // Admin initiates refund for an item (for Razorpay or COD post-delivery)
        if (!actorIsAdmin) {
          return new Response(JSON.stringify({
            error: "Unauthorized"
          }), {
            status: 403,
            headers: corsHeaders,
          });
        }

        // Refund allowed if item is delivered or cancelled (but depends on payment method)
        // For Razorpay (prepaid), refund can be initiated anytime payment_status = 'paid'
        if (order.payment_method === "razorpay" && order.payment_status === "paid") {
          // proceed
        } else if (order.payment_method === "cod") {
          // allow only if item_status === 'delivered' (i.e., payment collected)
          if (item.item_status !== "delivered" && item.item_status !== "refunded") {
            return new Response(JSON.stringify({
              error: "COD refund allowed only after delivery/payment collected"
            }), {
              status: 400,
              headers: corsHeaders,
            });
          }
        } else {
          return new Response(JSON.stringify({
            error: "Refund not supported for this payment method"
          }), {
            status: 400,
            headers: corsHeaders,
          });
        }

        // create refund record & update item_status/refunded_at
        const refundAmt = item.refund_amount ?? item.price_at_purchase ?? 0;
        const { error: insErr } = await supabaseServiceClient.from("refunds").insert([
          {
            order_id: order.order_id,
            order_item_id,
            refund_amount: refundAmt,
            refund_status: 'initiated',
            refund_method: order.payment_method,
            refund_reason: reason || 'Admin initiated refund'
          }
        ]);

        if (insErr) {
          console.error("refund insert err", insErr);
          return new Response(JSON.stringify({
            error: "Failed to create refund record"
          }), {
            status: 500,
            headers: corsHeaders,
          });
        }

        await supabaseServiceClient.from("order_items").update({
          item_status: "refunded",
          refunded_at: new Date().toISOString()
        }).eq("order_item_id", order_item_id);
        break;

      default:
        return new Response(JSON.stringify({
          error: "Unsupported action"
        }), {
          status: 400,
          headers: corsHeaders,
        });
    }

    // Recompute order status (non-critical, so handle errors gracefully)
    try {
      await supabaseServiceClient.rpc("recompute_order_status", {
        _order_id: order.order_id
      });
      console.log("Order status recomputed successfully");
    } catch (rpcError) {
      console.error("Failed to recompute order status:", rpcError);
      // Don't fail the entire operation if RPC fails, just log it
    }

    // Return success + latest order item state
    const { data: updatedItem } = await supabaseServiceClient.from("order_items").select("*").eq("order_item_id", order_item_id).single();
    const { data: updatedOrder } = await supabaseServiceClient.from("orders").select("*").eq("order_id", order.order_id).single();

    const responseData = {
      success: true,
      item: updatedItem,
      order: updatedOrder
    };

    console.log("📤 Edge Function returning:", JSON.stringify(responseData, null, 2));

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: corsHeaders,
    });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({
      error: "Server error",
      details: String(err)
    }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});

// Helper: unauthorized response
function unauthorized() {
  return new Response(JSON.stringify({
    error: "Unauthorized"
  }), {
    status: 403,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    }
  });
}

// Helper: check if user is admin using your user_profiles table
async function isAdmin(userId) {
  if (!userId) return false;

  try {
    const { data, error } = await supabaseServiceClient
      .from("user_profiles")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error checking admin status:", error);
      // If user_profiles table doesn't exist, fall back to checking user metadata
      if (error.code === '42P01') { // Table doesn't exist
        console.log("user_profiles table not found, checking user metadata");
        return await checkAdminFromMetadata(userId);
      }
      return false;
    }

    if (!data) return false;

    return data.role === "admin" || data.role === "superadmin";
  } catch (err) {
    console.error("Exception in isAdmin:", err);
    return false;
  }
}

// Fallback: Check admin status from user metadata if user_profiles table doesn't exist
async function checkAdminFromMetadata(userId) {
  try {
    const { data: userData, error } = await supabaseAuthClient.auth.admin.getUserById(userId);

    if (error || !userData?.user) {
      console.error("Error getting user by ID:", error);
      return false;
    }

    const user = userData.user;
    const userRole = user?.user_metadata?.role || user?.app_metadata?.role;

    return userRole === "admin" || userRole === "superadmin";
  } catch (err) {
    console.error("Exception in checkAdminFromMetadata:", err);
    return false;
  }
}

// Placeholder for refund provider call
async function handleRefund() {
  // Implement Razorpay/Twilio/whatever SDK call to perform refund
  // After success, update refunds row with provider_reference and refund_status='processed'
}
