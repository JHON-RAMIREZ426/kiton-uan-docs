-- Fix the ambiguous column reference in get_all_orders_for_admin_sede function
CREATE OR REPLACE FUNCTION get_all_orders_for_admin_sede(p_sede text)
RETURNS TABLE (
  id uuid,
  order_number text,
  sede text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  created_by uuid,
  sede_id uuid,
  is_admin_sede boolean
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if the sede is an admin sede
  IF EXISTS (
    SELECT 1 
    FROM sedes s 
    WHERE s.name = p_sede AND s.is_admin_sede = true
  ) THEN
    -- If admin sede, return all orders grouped by sede
    RETURN QUERY
    SELECT 
      po.id,
      po.order_number,
      po.sede,
      po.created_at,
      po.updated_at,
      po.created_by,
      po.sede_id,
      COALESCE(s.is_admin_sede, false) as is_admin_sede
    FROM purchase_orders po
    LEFT JOIN sedes s ON po.sede = s.name
    ORDER BY po.sede, po.created_at DESC;
  ELSE
    -- If not admin sede, return only orders for that sede
    RETURN QUERY
    SELECT 
      po.id,
      po.order_number,
      po.sede,
      po.created_at,
      po.updated_at,
      po.created_by,
      po.sede_id,
      COALESCE(s.is_admin_sede, false) as is_admin_sede
    FROM purchase_orders po
    LEFT JOIN sedes s ON po.sede = s.name
    WHERE po.sede = p_sede
    ORDER BY po.created_at DESC;
  END IF;
END;
$$;