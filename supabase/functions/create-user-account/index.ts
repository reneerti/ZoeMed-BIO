import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the requesting user is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header required");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !requestingUser) {
      throw new Error("Unauthorized");
    }

    // Check if requesting user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .single();

    if (roleError || roleData?.role !== "admin") {
      throw new Error("Only admins can create user accounts");
    }

    const { email, password, patientId } = await req.json();

    if (!email || !password || !patientId) {
      throw new Error("Email, password, and patientId are required");
    }

    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    // Create the user account
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      throw new Error(createError.message);
    }

    // Link the user to the patient record
    const { error: updateError } = await supabaseAdmin
      .from("patients")
      .update({ user_id: newUser.user.id })
      .eq("id", patientId);

    if (updateError) {
      // Rollback: delete the user if linking fails
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      throw new Error("Failed to link user to patient: " + updateError.message);
    }

    // Create viewer role for the new user
    const { error: roleInsertError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: newUser.user.id, role: "viewer" });

    if (roleInsertError) {
      console.error("Failed to create role:", roleInsertError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId: newUser.user.id,
        message: "User account created successfully" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating user account:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
