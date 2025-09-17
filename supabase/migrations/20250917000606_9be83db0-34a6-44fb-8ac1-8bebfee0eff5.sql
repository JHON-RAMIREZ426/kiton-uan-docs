-- Remove the overly permissive policy that allows anyone to view all purchase orders
DROP POLICY IF EXISTS "Anyone can view purchase orders" ON public.purchase_orders;

-- Create a more secure policy for authenticated admin users to view their own orders
CREATE POLICY "Admins can view their own purchase orders" 
ON public.purchase_orders 
FOR SELECT 
USING (auth.uid() = created_by);

-- Create a security definer function to validate order access for public users
-- This function will only return data if both order_number and sede are provided
CREATE OR REPLACE FUNCTION public.validate_order_access(
  p_order_number text,
  p_sede text
)
RETURNS TABLE (
  id uuid,
  order_number text,
  sede text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  created_by uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return data if both parameters are provided and not empty
  IF p_order_number IS NULL OR p_order_number = '' OR p_sede IS NULL OR p_sede = '' THEN
    RETURN;
  END IF;
  
  -- Return matching order (only one should exist due to business logic)
  RETURN QUERY 
  SELECT po.id, po.order_number, po.sede, po.created_at, po.updated_at, po.created_by
  FROM public.purchase_orders po
  WHERE po.order_number = p_order_number AND po.sede = p_sede;
END;
$$;

-- Grant execute permission to anonymous users for the function
GRANT EXECUTE ON FUNCTION public.validate_order_access(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_order_access(text, text) TO authenticated;