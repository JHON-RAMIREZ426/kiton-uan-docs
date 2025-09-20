-- Add is_admin_sede column to sedes table
ALTER TABLE public.sedes 
ADD COLUMN is_admin_sede BOOLEAN NOT NULL DEFAULT false;

-- Add comment to explain the column
COMMENT ON COLUMN public.sedes.is_admin_sede IS 'Indicates if this sede is an administrator sede that receives documents from all other sedes';

-- Create an index for better performance when querying admin sedes
CREATE INDEX idx_sedes_is_admin_sede ON public.sedes(is_admin_sede) WHERE is_admin_sede = true;