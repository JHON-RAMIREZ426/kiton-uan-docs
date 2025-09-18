/*
  # Sede Management System

  1. New Tables
    - `sedes` - Store sede information (name, email, address, phone)
    - `admin_sede_access` - Control which sedes each admin can access
    - Update `sede_tokens` to reference the new sedes table

  2. Security
    - Enable RLS on all new tables
    - Add policies for admin access control
    - Update existing policies

  3. Functions
    - Update token generation functions
    - Add sede management functions
*/

-- Create sedes table
CREATE TABLE IF NOT EXISTS public.sedes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin_sede_access table
CREATE TABLE IF NOT EXISTS public.admin_sede_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sede_id UUID NOT NULL REFERENCES public.sedes(id) ON DELETE CASCADE,
  can_view BOOLEAN NOT NULL DEFAULT true,
  can_edit BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(admin_id, sede_id)
);

-- Add sede_id to existing tables if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sede_tokens' AND column_name = 'sede_id'
  ) THEN
    ALTER TABLE public.sede_tokens ADD COLUMN sede_id UUID REFERENCES public.sedes(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchase_orders' AND column_name = 'sede_id'
  ) THEN
    ALTER TABLE public.purchase_orders ADD COLUMN sede_id UUID REFERENCES public.sedes(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.sedes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sede_access ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sedes
CREATE POLICY "Admins can view sedes they have access to"
ON public.sedes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_sede_access asa
    WHERE asa.sede_id = sedes.id 
    AND asa.admin_id = auth.uid()
    AND asa.can_view = true
  )
  OR 
  EXISTS (
    SELECT 1 FROM public.admin_profiles ap
    WHERE ap.user_id = auth.uid()
    AND ap.company = 'KITON GROUP SAS'
  )
);

CREATE POLICY "Super admins can manage sedes"
ON public.sedes
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_profiles ap
    WHERE ap.user_id = auth.uid()
    AND ap.company = 'KITON GROUP SAS'
  )
);

-- RLS Policies for admin_sede_access
CREATE POLICY "Admins can view their sede access"
ON public.admin_sede_access
FOR SELECT
USING (admin_id = auth.uid());

CREATE POLICY "Super admins can manage sede access"
ON public.admin_sede_access
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_profiles ap
    WHERE ap.user_id = auth.uid()
    AND ap.company = 'KITON GROUP SAS'
  )
);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_sedes_updated_at
  BEFORE UPDATE ON public.sedes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default sedes
INSERT INTO public.sedes (name, email, address, phone) VALUES
('Bogotá - Sede Principal', 'comercial@kitongroup.com', 'Carrera 7 #32-16, Bogotá', '+57 1 234-5678'),
('Medellín - Sede Norte', 'medellin@kitongroup.com', 'Carrera 43A #1-50, Medellín', '+57 4 234-5678'),
('Cali - Sede Sur', 'cali@kitongroup.com', 'Avenida 6N #23-61, Cali', '+57 2 234-5678'),
('Barranquilla - Sede Caribe', 'barranquilla@kitongroup.com', 'Carrera 53 #75-180, Barranquilla', '+57 5 234-5678'),
('Bucaramanga - Sede Oriental', 'bucaramanga@kitongroup.com', 'Carrera 27 #34-18, Bucaramanga', '+57 7 234-5678'),
('Pereira - Sede Eje Cafetero', 'pereira@kitongroup.com', 'Carrera 7 #19-20, Pereira', '+57 6 234-5678'),
('casa brayan', 'brayan@test.com', 'Casa de Brayan', '+57 300 123-4567')
ON CONFLICT (name) DO NOTHING;

-- Update existing sede_tokens to reference sedes table
UPDATE public.sede_tokens 
SET sede_id = s.id 
FROM public.sedes s 
WHERE sede_tokens.sede = s.name 
AND sede_tokens.sede_id IS NULL;

-- Update existing purchase_orders to reference sedes table
UPDATE public.purchase_orders 
SET sede_id = s.id 
FROM public.sedes s 
WHERE purchase_orders.sede = s.name 
AND purchase_orders.sede_id IS NULL;

-- Create function to get sede token with sede info
CREATE OR REPLACE FUNCTION public.get_sede_token_info(p_sede_name TEXT)
RETURNS TABLE (
  token TEXT,
  sede_id UUID,
  sede_name TEXT,
  sede_email TEXT,
  is_active BOOLEAN,
  last_used_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    st.token,
    s.id as sede_id,
    s.name as sede_name,
    s.email as sede_email,
    st.is_active,
    st.last_used_at
  FROM public.sede_tokens st
  JOIN public.sedes s ON s.id = st.sede_id
  WHERE s.name = p_sede_name
  AND st.is_active = true;
END;
$$;

-- Create function to get all sedes with tokens for admin
CREATE OR REPLACE FUNCTION public.get_admin_sedes_with_tokens()
RETURNS TABLE (
  sede_id UUID,
  sede_name TEXT,
  sede_email TEXT,
  sede_address TEXT,
  sede_phone TEXT,
  sede_is_active BOOLEAN,
  token TEXT,
  token_last_used TIMESTAMP WITH TIME ZONE,
  can_view BOOLEAN,
  can_edit BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as sede_id,
    s.name as sede_name,
    s.email as sede_email,
    s.address as sede_address,
    s.phone as sede_phone,
    s.is_active as sede_is_active,
    st.token,
    st.last_used_at as token_last_used,
    COALESCE(asa.can_view, true) as can_view,
    COALESCE(asa.can_edit, false) as can_edit
  FROM public.sedes s
  LEFT JOIN public.sede_tokens st ON s.id = st.sede_id AND st.is_active = true
  LEFT JOIN public.admin_sede_access asa ON s.id = asa.sede_id AND asa.admin_id = auth.uid()
  WHERE 
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.user_id = auth.uid()
      AND ap.company = 'KITON GROUP SAS'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.admin_sede_access asa2
      WHERE asa2.sede_id = s.id 
      AND asa2.admin_id = auth.uid()
      AND asa2.can_view = true
    )
  ORDER BY s.name;
END;
$$;