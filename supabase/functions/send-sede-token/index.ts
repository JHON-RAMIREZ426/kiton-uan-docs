import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendTokenRequest {
  sede: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sede }: SendTokenRequest = await req.json();

    if (!sede) {
      return new Response(
        JSON.stringify({ error: "Sede es requerida" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get sede information first
    const { data: sedeData, error: sedeError } = await supabase
      .from('sedes')
      .select('id, name, email')
      .eq('name', sede)
      .single();

    if (sedeError || !sedeData) {
      console.error('Error finding sede:', sedeError);
      return new Response(
        JSON.stringify({ error: "Sede no encontrada" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get existing token or create new one
    const { data: tokenData, error: tokenError } = await supabase
      .rpc('get_or_create_sede_token', {
        p_sede: sede,
        p_email: sedeData.email
      });

    if (tokenError) {
      console.error('Error getting/creating token:', tokenError);
      return new Response(
        JSON.stringify({ error: "Error generando token" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const token = tokenData[0]?.token;
    const isNew = tokenData[0]?.is_new;

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Error generando token" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Send email with token
    const emailResponse = await resend.emails.send({
      from: "Portal de Órdenes de Compra <noreply@notificaciones.kitongroup.com>",
      to: [sedeData.email],
      subject: `Código de acceso para ${sede}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; font-size: 24px; margin-bottom: 10px;">Portal de Órdenes de Compra</h1>
            <h2 style="color: #666; font-size: 18px; font-weight: normal;">Universidad Antonio Nariño</h2>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0 0 15px 0; font-size: 16px; color: #333;">
              Su código de acceso para la sede <strong>${sede}</strong> es:
            </p>
            <div style="text-align: center; margin: 20px 0;">
              <span style="display: inline-block; background-color: #007bff; color: white; font-size: 32px; font-weight: bold; padding: 15px 30px; border-radius: 8px; letter-spacing: 3px;">
                ${token}
              </span>
            </div>
            <p style="margin: 15px 0 0 0; font-size: 14px; color: #666; text-align: center;">
              Este código ${isNew ? 'ha sido generado' : 'sigue siendo válido'} para su sede.
            </p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #333;">
              <strong>¿Cómo usar el código?</strong>
            </p>
            <ol style="margin: 0; padding-left: 20px; font-size: 14px; color: #666;">
              <li>Ingrese al portal de órdenes de compra</li>
              <li>Seleccione su sede: <strong>${sede}</strong></li>
              <li>Ingrese el código: <strong>${token}</strong></li>
              <li>Acceda a la información de sus órdenes</li>
            </ol>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #999;">
              Este código es exclusivo para ${sede} y tiene vigencia indefinida.<br>
              Si tiene problemas para acceder, comuníquese con el administrador.
            </p>
          </div>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: isNew ? "Nuevo código enviado" : "Código reenviado",
        token: token // Solo para propósitos de desarrollo
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-sede-token function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

// Helper function to get email for each sede
function getSedeEmail(sede: string): string {
  const sedeEmails: { [key: string]: string } = {
    "Bogotá - Sede Principal": "comercial@kitongroup.com",
    "Medellín - Sede Norte": "medellin@kitongroup.com",
    "Cali - Sede Sur": "cali@kitongroup.com",
    "Barranquilla - Sede Caribe": "barranquilla@kitongroup.com",
    "Bucaramanga - Sede Oriental": "bucaramanga@kitongroup.com",
    "Pereira - Sede Eje Cafetero": "pereira@kitongroup.com",
    "casa brayan": "brayan@test.com"
  };
  
  return sedeEmails[sede] || "admin@kitongroup.com";
}

serve(handler);