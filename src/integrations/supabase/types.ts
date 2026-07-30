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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          created_at: string
          customer_email: string
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          id: string
          notes: string | null
          preferred_date: string | null
          scheduled_at: string | null
          service: string
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
          vehicle_description: string | null
          work_order_id: string | null
        }
        Insert: {
          created_at?: string
          customer_email: string
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          id?: string
          notes?: string | null
          preferred_date?: string | null
          scheduled_at?: string | null
          service: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          vehicle_description?: string | null
          work_order_id?: string | null
        }
        Update: {
          created_at?: string
          customer_email?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          id?: string
          notes?: string | null
          preferred_date?: string | null
          scheduled_at?: string | null
          service?: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          vehicle_description?: string | null
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      cars_for_sale: {
        Row: {
          created_at: string
          description: string | null
          featured: boolean
          id: string
          image_url: string | null
          make: string
          mileage: number | null
          model: string
          price_cents: number
          status: Database["public"]["Enums"]["car_status"]
          trim: string | null
          year: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          featured?: boolean
          id?: string
          image_url?: string | null
          make: string
          mileage?: number | null
          model: string
          price_cents: number
          status?: Database["public"]["Enums"]["car_status"]
          trim?: string | null
          year: number
        }
        Update: {
          created_at?: string
          description?: string | null
          featured?: boolean
          id?: string
          image_url?: string | null
          make?: string
          mileage?: number | null
          model?: string
          price_cents?: number
          status?: Database["public"]["Enums"]["car_status"]
          trim?: string | null
          year?: number
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          read: boolean
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          read?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          read?: boolean
        }
        Relationships: []
      }
      customer_messages: {
        Row: {
          body: string
          created_at: string
          customer_id: string
          id: string
          read_by_admin: boolean
          read_by_customer: boolean
          sender: string
        }
        Insert: {
          body: string
          created_at?: string
          customer_id: string
          id?: string
          read_by_admin?: boolean
          read_by_customer?: boolean
          sender: string
        }
        Update: {
          body?: string
          created_at?: string
          customer_id?: string
          id?: string
          read_by_admin?: boolean
          read_by_customer?: boolean
          sender?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_messages_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          unit_price_cents: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          unit_price_cents?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_id: string | null
          customer_name: string
          due_date: string | null
          id: string
          paid_at: string | null
          public_token: string
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal_cents: number
          tax_cents: number
          total_cents: number
          updated_at: string
          work_order_id: string | null
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_name: string
          due_date?: string | null
          id?: string
          paid_at?: string | null
          public_token?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal_cents?: number
          tax_cents?: number
          total_cents?: number
          updated_at?: string
          work_order_id?: string | null
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string
          due_date?: string | null
          id?: string
          paid_at?: string | null
          public_token?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal_cents?: number
          tax_cents?: number
          total_cents?: number
          updated_at?: string
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
      vehicles: {
        Row: {
          color: string | null
          created_at: string
          id: string
          make: string | null
          model: string | null
          owner_id: string
          plate: string | null
          vin: string | null
          year: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          make?: string | null
          model?: string | null
          owner_id: string
          plate?: string | null
          vin?: string | null
          year?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          make?: string | null
          model?: string | null
          owner_id?: string
          plate?: string | null
          vin?: string | null
          year?: number | null
        }
        Relationships: []
      }
      work_orders: {
        Row: {
          created_at: string
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          description: string
          id: string
          mechanic_id: string | null
          notes: string | null
          public_token: string
          status: Database["public"]["Enums"]["work_order_status"]
          updated_at: string
          vehicle_description: string
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          description: string
          id?: string
          mechanic_id?: string | null
          notes?: string | null
          public_token?: string
          status?: Database["public"]["Enums"]["work_order_status"]
          updated_at?: string
          vehicle_description: string
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          description?: string
          id?: string
          mechanic_id?: string | null
          notes?: string | null
          public_token?: string
          status?: Database["public"]["Enums"]["work_order_status"]
          updated_at?: string
          vehicle_description?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Enums: {
      app_role: "admin" | "customer" | "mechanic"
      booking_status:
        | "requested"
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
      car_status: "available" | "pending" | "sold"
      invoice_status: "draft" | "sent" | "paid" | "void"
      work_order_status: "intake" | "in_progress" | "ready" | "completed"
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
      app_role: ["admin", "customer", "mechanic"],
      booking_status: [
        "requested",
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
      ],
      car_status: ["available", "pending", "sold"],
      invoice_status: ["draft", "sent", "paid", "void"],
      work_order_status: ["intake", "in_progress", "ready", "completed"],
    },
  },
} as const
