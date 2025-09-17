-- Create a function to get purchase orders by sede for public access
CREATE OR REPLACE FUNCTION public.get_orders_by_sede(p_sede text)
RETURNS TABLE (
  id uuid,
  order_number text,
  sede text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return data if sede parameter is provided and not empty
  IF p_sede IS NULL OR p_sede = '' THEN
    RETURN;
  END IF;
  
  -- Return orders for the specified sede
  RETURN QUERY 
  SELECT po.id, po.order_number, po.sede, po.created_at
  FROM public.purchase_orders po
  WHERE po.sede = p_sede
  ORDER BY po.created_at DESC;
END;
$$;

-- Grant execute permission to anonymous users for the function
GRANT EXECUTE ON FUNCTION public.get_orders_by_sede(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_orders_by_sede(text) TO authenticated;