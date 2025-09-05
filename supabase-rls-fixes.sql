-- Fix RLS policies for guest orders and payments

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create their own orders" ON orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can create their own payments" ON payments;
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;

-- Orders table policies
CREATE POLICY "Allow authenticated users to create orders" ON orders
FOR INSERT TO authenticated
WITH CHECK (
  (auth.uid() = user_id AND order_type = 'registered') OR
  (guest_session_id IS NOT NULL AND order_type = 'guest')
);

CREATE POLICY "Allow users to view their orders" ON orders
FOR SELECT TO authenticated
USING (
  auth.uid() = user_id OR 
  (order_type = 'guest' AND guest_session_id IS NOT NULL)
);

CREATE POLICY "Allow service role full access to orders" ON orders
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- Payments table policies  
CREATE POLICY "Allow authenticated users to create payments" ON payments
FOR INSERT TO authenticated
WITH CHECK (
  (auth.uid() = user_id AND payment_type = 'registered') OR
  (guest_session_id IS NOT NULL AND payment_type = 'guest')
);

CREATE POLICY "Allow users to view their payments" ON payments
FOR SELECT TO authenticated
USING (
  auth.uid() = user_id OR 
  (payment_type = 'guest' AND guest_session_id IS NOT NULL)
);

CREATE POLICY "Allow service role full access to payments" ON payments
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- Order items policies
DROP POLICY IF EXISTS "Users can view their order items" ON order_items;
CREATE POLICY "Allow users to view their order items" ON order_items
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.order_id = order_items.order_id 
    AND (
      orders.user_id = auth.uid() OR 
      (orders.order_type = 'guest' AND orders.guest_session_id IS NOT NULL)
    )
  )
);

CREATE POLICY "Allow service role full access to order_items" ON order_items
FOR ALL TO service_role
USING (true)
WITH CHECK (true);
