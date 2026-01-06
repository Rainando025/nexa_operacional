import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role: string;
  department_id?: string | null;
  sector_id?: string | null;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the requesting user is authenticated and is admin
    const authHeader = req.headers.get("Authorization");
    console.log("Auth Header present:", !!authHeader);

    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Create client with user's token to verify they're admin
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: requestingUser }, error: userError } = await userClient.auth.getUser();

    if (userError) {
      console.error("User Client Auth Error:", userError);
    }
    console.log("Requesting User:", requestingUser?.id);

    if (userError || !requestingUser) {
      throw new Error("Unauthorized: " + (userError?.message || "No user found"));
    }

    // Check if requesting user is admin
    const { data: isAdmin } = await userClient.rpc("is_admin", { _user_id: requestingUser.id });
    if (!isAdmin) {
      throw new Error("Only admins can create users");
    }

    // Parse request body
    const { email, password, name, role, department_id, sector_id }: CreateUserRequest = await req.json();

    if (!email || !password || !name || !role) {
      throw new Error("Missing required fields: email, password, name, role");
    }

    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    // Create admin client with service role key
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Create the user
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    if (createError) {
      throw createError;
    }

    if (!newUser.user) {
      throw new Error("Failed to create user");
    }

    // Update the profile with additional info (profile is auto-created by trigger)
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({
        name,
        role,
        department_id: department_id || null,
        sector_id: sector_id || null,
      })
      .eq("user_id", newUser.user.id);

    if (profileError) {
      console.error("Error updating profile:", profileError);
    }

    // Update user_roles with correct role
    const { error: roleError } = await adminClient
      .from("user_roles")
      .update({ role })
      .eq("user_id", newUser.user.id);

    if (roleError) {
      console.error("Error updating role:", roleError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUser.user.id,
          email: newUser.user.email
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || "Unknown error" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
