import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the order_id from request body
    const { order_id } = await req.json()

    if (!order_id) {
      throw new Error('order_id is required')
    }

    // Fetch current order items
    const { data: items, error: fetchError } = await supabaseClient
      .from('order_items')
      .select('item_status')
      .eq('order_id', order_id)

    if (fetchError) {
      throw fetchError
    }

    if (!items || items.length === 0) {
      throw new Error('No items found for this order')
    }

    // Calculate aggregate status
    const statuses = items.map(item => item.item_status || 'pending')
    const allCancelled = statuses.every(s => s === 'cancelled')
    const allDelivered = statuses.every(s => s === 'delivered')
    const allShipped = statuses.every(s => s === 'shipped')
    const allRefunded = statuses.every(s => s === 'refunded')

    const someCancelled = statuses.some(s => s === 'cancelled')
    const someDelivered = statuses.some(s => s === 'delivered')
    const someShipped = statuses.some(s => s === 'shipped')
    const someRefunded = statuses.some(s => s === 'refunded')

    let newOrderStatus: string

    if (allCancelled) newOrderStatus = 'cancelled'
    else if (allDelivered) newOrderStatus = 'delivered'
    else if (allShipped && !someDelivered && !someCancelled) newOrderStatus = 'shipped'
    else if (allRefunded) newOrderStatus = 'cancelled' // Treat all refunded as cancelled
    else if (someCancelled || someRefunded) {
      if (someDelivered) newOrderStatus = 'partially_delivered'
      else if (someShipped) newOrderStatus = 'partially_cancelled'
      else newOrderStatus = 'partially_cancelled'
    }
    else if (someDelivered && (someShipped || statuses.some(s => s === 'pending'))) {
      newOrderStatus = 'partially_delivered'
    }
    else if (someShipped && !allShipped) {
      newOrderStatus = 'partially_shipped'
    }
    else {
      newOrderStatus = 'pending'
    }

    // Update order status
    const { error: updateError } = await supabaseClient
      .from('orders')
      .update({
        status: newOrderStatus,
        updated_at: new Date().toISOString()
      })
      .eq('order_id', order_id)

    if (updateError) {
      throw updateError
    }

    return new Response(
      JSON.stringify({
        success: true,
        order_id,
        new_status: newOrderStatus,
        message: `Order status updated to ${newOrderStatus}`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error updating order status:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
