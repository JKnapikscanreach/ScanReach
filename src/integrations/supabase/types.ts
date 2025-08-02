export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      customers: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      microsite_buttons: {
        Row: {
          action_type: string
          action_value: string
          card_id: string
          created_at: string
          id: string
          label: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          action_type: string
          action_value: string
          card_id: string
          created_at?: string
          id?: string
          label: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          action_type?: string
          action_value?: string
          card_id?: string
          created_at?: string
          id?: string
          label?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      microsite_cards: {
        Row: {
          content: string | null
          created_at: string
          id: string
          is_collapsed: boolean
          media_url: string | null
          microsite_id: string
          sort_order: number
          title: string | null
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          is_collapsed?: boolean
          media_url?: string | null
          microsite_id: string
          sort_order?: number
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          is_collapsed?: boolean
          media_url?: string | null
          microsite_id?: string
          sort_order?: number
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      microsite_content: {
        Row: {
          created_at: string
          header_image_url: string | null
          id: string
          microsite_id: string
          theme_config: Json | null
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          header_image_url?: string | null
          id?: string
          microsite_id: string
          theme_config?: Json | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          header_image_url?: string | null
          id?: string
          microsite_id?: string
          theme_config?: Json | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      microsite_scans: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          microsite_id: string
          scanned_at: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          microsite_id: string
          scanned_at?: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          microsite_id?: string
          scanned_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      microsites: {
        Row: {
          created_at: string
          id: string
          last_scan_at: string | null
          name: string
          scan_count: number
          status: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_scan_at?: string | null
          name: string
          scan_count?: number
          status?: string
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_scan_at?: string | null
          name?: string
          scan_count?: number
          status?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          material: string
          order_id: string
          product_id: string
          quantity: number
          size: string
          unit_price: number
          variant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          material: string
          order_id: string
          product_id: string
          quantity: number
          size: string
          unit_price: number
          variant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          material?: string
          order_id?: string
          product_id?: string
          quantity?: number
          size?: string
          unit_price?: number
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          currency: string
          customer_id: string
          external_id: string | null
          id: string
          printful_order_id: string | null
          qr_data_url: string
          shipping_address: Json
          status: string
          total_cost: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          customer_id: string
          external_id?: string | null
          id?: string
          printful_order_id?: string | null
          qr_data_url: string
          shipping_address: Json
          status?: string
          total_cost: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          customer_id?: string
          external_id?: string | null
          id?: string
          printful_order_id?: string | null
          qr_data_url?: string
          shipping_address?: Json
          status?: string
          total_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_products: {
        Row: {
          catalog_product_id: string
          created_at: string
          id: string
          name: string
          printful_sync_product_id: string
          updated_at: string
        }
        Insert: {
          catalog_product_id: string
          created_at?: string
          id?: string
          name: string
          printful_sync_product_id: string
          updated_at?: string
        }
        Update: {
          catalog_product_id?: string
          created_at?: string
          id?: string
          name?: string
          printful_sync_product_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      sync_variants: {
        Row: {
          catalog_variant_id: string
          color: string | null
          created_at: string
          id: string
          name: string
          printful_sync_variant_id: string
          size: string | null
          sync_product_id: string
          updated_at: string
        }
        Insert: {
          catalog_variant_id: string
          color?: string | null
          created_at?: string
          id?: string
          name: string
          printful_sync_variant_id: string
          size?: string | null
          sync_product_id: string
          updated_at?: string
        }
        Update: {
          catalog_variant_id?: string
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          printful_sync_variant_id?: string
          size?: string | null
          sync_product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_variants_sync_product_id_fkey"
            columns: ["sync_product_id"]
            isOneToOne: false
            referencedRelation: "sync_products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string
          id: string
          last_login: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_login?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_login?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          company_name: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          is_admin: boolean
          last_name: string
          subscription_status: string
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          is_admin?: boolean
          last_name: string
          subscription_status?: string
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          is_admin?: boolean
          last_name?: string
          subscription_status?: string
          updated_at?: string
        }
        Relationships: []
      }
      variant_mappings: {
        Row: {
          catalog_variant_id: string
          created_at: string
          id: string
          sync_variant_id: string
        }
        Insert: {
          catalog_variant_id: string
          created_at?: string
          id?: string
          sync_variant_id: string
        }
        Update: {
          catalog_variant_id?: string
          created_at?: string
          id?: string
          sync_variant_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_admin_status: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
