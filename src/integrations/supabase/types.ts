export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_analysis_history: {
        Row: {
          analysis_date: string
          bmi_at_analysis: number | null
          created_at: string
          fat_at_analysis: number | null
          full_analysis: string
          id: string
          summary: string
          user_person: string
          weight_at_analysis: number | null
        }
        Insert: {
          analysis_date?: string
          bmi_at_analysis?: number | null
          created_at?: string
          fat_at_analysis?: number | null
          full_analysis: string
          id?: string
          summary: string
          user_person: string
          weight_at_analysis?: number | null
        }
        Update: {
          analysis_date?: string
          bmi_at_analysis?: number | null
          created_at?: string
          fat_at_analysis?: number | null
          full_analysis?: string
          id?: string
          summary?: string
          user_person?: string
          weight_at_analysis?: number | null
        }
        Relationships: []
      }
      bioimpedance: {
        Row: {
          bmi: number | null
          bmr: number | null
          body_fat_percent: number | null
          body_water_percent: number | null
          bone_mass: number | null
          created_at: string
          fat_mass: number | null
          id: string
          lean_mass: number | null
          measurement_date: string
          metabolic_age: number | null
          moisture_content: number | null
          monjaro_dose: number | null
          muscle_mass: number | null
          muscle_rate_percent: number | null
          patient_id: string | null
          protein_mass: number | null
          protein_percent: number | null
          skeletal_muscle_percent: number | null
          status: string | null
          subcutaneous_fat_percent: number | null
          updated_at: string
          user_person: Database["public"]["Enums"]["user_person"]
          visceral_fat: number | null
          week_number: number | null
          weight: number | null
          whr: number | null
        }
        Insert: {
          bmi?: number | null
          bmr?: number | null
          body_fat_percent?: number | null
          body_water_percent?: number | null
          bone_mass?: number | null
          created_at?: string
          fat_mass?: number | null
          id?: string
          lean_mass?: number | null
          measurement_date: string
          metabolic_age?: number | null
          moisture_content?: number | null
          monjaro_dose?: number | null
          muscle_mass?: number | null
          muscle_rate_percent?: number | null
          patient_id?: string | null
          protein_mass?: number | null
          protein_percent?: number | null
          skeletal_muscle_percent?: number | null
          status?: string | null
          subcutaneous_fat_percent?: number | null
          updated_at?: string
          user_person: Database["public"]["Enums"]["user_person"]
          visceral_fat?: number | null
          week_number?: number | null
          weight?: number | null
          whr?: number | null
        }
        Update: {
          bmi?: number | null
          bmr?: number | null
          body_fat_percent?: number | null
          body_water_percent?: number | null
          bone_mass?: number | null
          created_at?: string
          fat_mass?: number | null
          id?: string
          lean_mass?: number | null
          measurement_date?: string
          metabolic_age?: number | null
          moisture_content?: number | null
          monjaro_dose?: number | null
          muscle_mass?: number | null
          muscle_rate_percent?: number | null
          patient_id?: string | null
          protein_mass?: number | null
          protein_percent?: number | null
          skeletal_muscle_percent?: number | null
          status?: string | null
          subcutaneous_fat_percent?: number | null
          updated_at?: string
          user_person?: Database["public"]["Enums"]["user_person"]
          visceral_fat?: number | null
          week_number?: number | null
          weight?: number | null
          whr?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bioimpedance_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_fields_config: {
        Row: {
          created_at: string
          display_order: number | null
          field_label: string
          field_name: string
          field_type: string
          id: string
          is_required: boolean | null
          options: Json | null
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          field_label: string
          field_name: string
          field_type: string
          id?: string
          is_required?: boolean | null
          options?: Json | null
        }
        Update: {
          created_at?: string
          display_order?: number | null
          field_label?: string
          field_name?: string
          field_type?: string
          id?: string
          is_required?: boolean | null
          options?: Json | null
        }
        Relationships: []
      }
      monjaro_treatments: {
        Row: {
          application_date: string
          created_at: string
          dose: number
          id: string
          notes: string | null
          patient_id: string
          side_effects: string | null
          updated_at: string
          week_number: number | null
        }
        Insert: {
          application_date: string
          created_at?: string
          dose: number
          id?: string
          notes?: string | null
          patient_id: string
          side_effects?: string | null
          updated_at?: string
          week_number?: number | null
        }
        Update: {
          application_date?: string
          created_at?: string
          dose?: number
          id?: string
          notes?: string | null
          patient_id?: string
          side_effects?: string | null
          updated_at?: string
          week_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "monjaro_treatments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          change_value: number | null
          created_at: string
          id: string
          is_positive: boolean | null
          is_read: boolean | null
          message: string
          metric_name: string | null
          new_value: number | null
          notification_type: string
          old_value: number | null
          title: string
          user_person: string
        }
        Insert: {
          change_value?: number | null
          created_at?: string
          id?: string
          is_positive?: boolean | null
          is_read?: boolean | null
          message: string
          metric_name?: string | null
          new_value?: number | null
          notification_type: string
          old_value?: number | null
          title: string
          user_person: string
        }
        Update: {
          change_value?: number | null
          created_at?: string
          id?: string
          is_positive?: boolean | null
          is_read?: boolean | null
          message?: string
          metric_name?: string | null
          new_value?: number | null
          notification_type?: string
          old_value?: number | null
          title?: string
          user_person?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          address: string | null
          avatar_url: string | null
          birth_date: string | null
          created_at: string
          created_by: string | null
          custom_fields: Json | null
          email: string | null
          gender: string | null
          height: number | null
          id: string
          medical_notes: string | null
          name: string
          phone: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json | null
          email?: string | null
          gender?: string | null
          height?: number | null
          id?: string
          medical_notes?: string | null
          name: string
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json | null
          email?: string | null
          gender?: string | null
          height?: number | null
          id?: string
          medical_notes?: string | null
          name?: string
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      supplementation: {
        Row: {
          created_at: string
          dosage: string
          id: string
          notes: string | null
          supplement_name: string
          updated_at: string
          user_person: string
        }
        Insert: {
          created_at?: string
          dosage: string
          id?: string
          notes?: string | null
          supplement_name: string
          updated_at?: string
          user_person: string
        }
        Update: {
          created_at?: string
          dosage?: string
          id?: string
          notes?: string | null
          supplement_name?: string
          updated_at?: string
          user_person?: string
        }
        Relationships: []
      }
      user_goals: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          target_bmi: number | null
          target_body_fat: number | null
          target_muscle: number | null
          target_visceral_fat: number | null
          target_weight: number | null
          updated_at: string
          user_person: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          target_bmi?: number | null
          target_body_fat?: number | null
          target_muscle?: number | null
          target_visceral_fat?: number | null
          target_weight?: number | null
          updated_at?: string
          user_person: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          target_bmi?: number | null
          target_body_fat?: number | null
          target_muscle?: number | null
          target_visceral_fat?: number | null
          target_weight?: number | null
          updated_at?: string
          user_person?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_person: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_person: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_person?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_master: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "viewer"
      user_person: "reneer" | "ana_paula"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "viewer"],
      user_person: ["reneer", "ana_paula"],
    },
  },
} as const
