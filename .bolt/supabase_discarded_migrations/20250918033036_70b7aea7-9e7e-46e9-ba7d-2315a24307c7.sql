-- Create table for sede access tokens
CREATE TABLE public.sede_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sede TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.sede_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies for sede tokens
CREATE POLICY "Anyone can validate tokens" 
ON public.sede_tokens 
FOR SELECT 
USING (true);

CREATE POLICY "System can create tokens" 
ON public.sede_tokens 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update tokens" 
ON public.sede_tokens 
FOR UPDATE 
USING (true);

-- Create function to generate 6-digit token
CREATE OR REPLACE FUNCTION public.generate_sede_token()
RETURNS TEXT AS $$
DECLARE
  new_token TEXT;
  token_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 6-digit random number
    new_token := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- Check if token already exists
    SELECT EXISTS(SELECT 1 FROM public.sede_tokens WHERE token = new_token AND is_active = true) INTO token_exists;
    
    -- If token doesn't exist, break loop
    IF NOT token_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN new_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to validate token
CREATE OR REPLACE FUNCTION public.validate_sede_token(p_sede TEXT, p_token TEXT)
RETURNS TABLE(id UUID, sede TEXT, token TEXT, email TEXT, is_valid BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update last_used_at and return token info
  UPDATE public.sede_tokens 
  SET last_used_at = now()
  WHERE sede_tokens.sede = p_sede 
    AND sede_tokens.token = p_token 
    AND sede_tokens.is_active = true;
  
  -- Return token validation result
  RETURN QUERY 
  SELECT st.id, st.sede, st.token, st.email, true as is_valid
  FROM public.sede_tokens st
  WHERE st.sede = p_sede 
    AND st.token = p_token 
    AND st.is_active = true;
END;
$$;

-- Create function to get or create sede token
CREATE OR REPLACE FUNCTION public.get_or_create_sede_token(p_sede TEXT, p_email TEXT)
RETURNS TABLE(token TEXT, is_new BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_token TEXT;
  new_token TEXT;
BEGIN
  -- Check if active token exists for this sede
  SELECT st.token INTO existing_token
  FROM public.sede_tokens st
  WHERE st.sede = p_sede AND st.is_active = true
  ORDER BY st.created_at DESC
  LIMIT 1;
  
  IF existing_token IS NOT NULL THEN
    -- Return existing token
    RETURN QUERY SELECT existing_token, false;
  ELSE
    -- Generate new token
    new_token := public.generate_sede_token();
    
    -- Insert new token
    INSERT INTO public.sede_tokens (sede, token, email)
    VALUES (p_sede, new_token, p_email);
    
    -- Return new token
    RETURN QUERY SELECT new_token, true;
  END IF;
END;
$$;

-- Insert default sede emails (you can modify these)
INSERT INTO public.sede_tokens (sede, token, email, is_active) VALUES
('Bogotá - Sede Principal', '123456', 'bogota@universidad.edu.co', true),
('Medellín - Sede Norte', '234567', 'medellin@universidad.edu.co', true),
('Cali - Sede Sur', '345678', 'cali@universidad.edu.co', true),
('Barranquilla - Sede Caribe', '456789', 'barranquilla@universidad.edu.co', true),
('Bucaramanga - Sede Oriente', '567890', 'bucaramanga@universidad.edu.co', true),
('casa brayan', '999999', 'brayan@test.com', true)
ON CONFLICT (token) DO NOTHING;