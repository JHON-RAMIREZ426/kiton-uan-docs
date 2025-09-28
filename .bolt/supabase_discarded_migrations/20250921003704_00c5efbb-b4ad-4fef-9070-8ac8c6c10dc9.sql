-- Drop and recreate the function to fix the ambiguous column reference
DROP FUNCTION IF EXISTS get_all_orders_for_admin_sede(text);

CREATE OR REPLACE FUNCTION get_all_orders_for_admin_sede(p_sede text)
RETURNS TABLE (
  sede_name text,
  order_id uuid,
  order_number text,
  order_sede text,
  order_created_at timestamp with time zone,
  is_admin_sede boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- First check if the requesting sede is an admin sede
  IF NOT EXISTS (
    SELECT 1 FROM public.sedes s
    WHERE s.name = p_sede AND s.is_admin_sede = true AND s.is_active = true
  ) THEN
    -- If not an admin sede, return only orders from their own sede
    RETURN QUERY 
    SELECT 
      po.sede as sede_name,
      po.id as order_id,
      po.order_number,
      po.sede as order_sede,
      po.created_at as order_created_at,
      false as is_admin_sede
    FROM public.purchase_orders po
    WHERE po.sede = p_sede
    ORDER BY po.created_at DESC;
  ELSE
    -- If admin sede, return all orders organized by sede
    RETURN QUERY 
    SELECT 
      po.sede as sede_name,
      po.id as order_id,
      po.order_number,
      po.sede as order_sede,
      po.created_at as order_created_at,
      true as is_admin_sede
    FROM public.purchase_orders po
    ORDER BY po.sede ASC, po.created_at DESC;
  END IF;
END;
$$;