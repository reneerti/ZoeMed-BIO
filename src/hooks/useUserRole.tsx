import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type UserRole = "admin" | "viewer" | "master" | null;

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Error fetching role:", error);
          setRole("viewer"); // Default to viewer if error
        } else {
          setRole(data?.role as UserRole || "viewer");
        }
      } catch (err) {
        console.error("Error:", err);
        setRole("viewer");
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [user]);

  const isAdmin = role === "admin" || role === "master";
  const isViewer = role === "viewer";
  const isMaster = role === "master";

  return { role, isAdmin, isViewer, isMaster, loading };
};
