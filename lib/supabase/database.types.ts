export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string;
          description: string | null;
          icon: string;
          id: string;
          is_active: boolean;
          name: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          icon?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          icon?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      contacts: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          label: string | null;
          sort_order: number;
          type: string;
          updated_at: string;
          value: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          label?: string | null;
          sort_order?: number;
          type: string;
          updated_at?: string;
          value: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          label?: string | null;
          sort_order?: number;
          type?: string;
          updated_at?: string;
          value?: string;
        };
        Relationships: [];
      };
      locations: {
        Row: {
          address: string | null;
          area: string | null;
          city: string;
          created_at: string;
          hours: Json | null;
          hours_note: string | null;
          id: string;
          image_url: string | null;
          is_active: boolean;
          map_url: string | null;
          name: string;
          phone: string | null;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          area?: string | null;
          city: string;
          created_at?: string;
          hours?: Json | null;
          hours_note?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          map_url?: string | null;
          name: string;
          phone?: string | null;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          area?: string | null;
          city?: string;
          created_at?: string;
          hours?: Json | null;
          hours_note?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          map_url?: string | null;
          name?: string;
          phone?: string | null;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          badge: string | null;
          category_id: string;
          created_at: string;
          description: string | null;
          details: string | null;
          highlight_word: string | null;
          id: string;
          image_url: string | null;
          ingredients: string[];
          is_available: boolean;
          is_featured: boolean;
          name: string;
          price: number | null;
          sort_order: number;
          tagline: string | null;
          updated_at: string;
        };
        Insert: {
          badge?: string | null;
          category_id: string;
          created_at?: string;
          description?: string | null;
          details?: string | null;
          highlight_word?: string | null;
          id?: string;
          image_url?: string | null;
          ingredients?: string[];
          is_available?: boolean;
          is_featured?: boolean;
          name: string;
          price?: number | null;
          sort_order?: number;
          tagline?: string | null;
          updated_at?: string;
        };
        Update: {
          badge?: string | null;
          category_id?: string;
          created_at?: string;
          description?: string | null;
          details?: string | null;
          highlight_word?: string | null;
          id?: string;
          image_url?: string | null;
          ingredients?: string[];
          is_available?: boolean;
          is_featured?: boolean;
          name?: string;
          price?: number | null;
          sort_order?: number;
          tagline?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          role?: Database["public"]["Enums"]["app_role"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          updated_at?: string;
        };
        Relationships: [];
      };
      promotion_products: {
        Row: {
          product_id: string;
          promotion_id: string;
        };
        Insert: {
          product_id: string;
          promotion_id: string;
        };
        Update: {
          product_id?: string;
          promotion_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "promotion_products_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "promotion_products_promotion_id_fkey";
            columns: ["promotion_id"];
            isOneToOne: false;
            referencedRelation: "promotions";
            referencedColumns: ["id"];
          },
        ];
      };
      promotions: {
        Row: {
          created_at: string;
          description: string | null;
          discount_type: string;
          discount_value: number;
          ends_on: string | null;
          id: string;
          is_active: boolean;
          starts_on: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          discount_type: string;
          discount_value: number;
          ends_on?: string | null;
          id?: string;
          is_active?: boolean;
          starts_on?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          discount_type?: string;
          discount_value?: number;
          ends_on?: string | null;
          id?: string;
          is_active?: boolean;
          starts_on?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          author_name: string;
          comment: string;
          created_at: string;
          id: string;
          is_published: boolean;
          rating: number;
          reviewed_on: string | null;
          source: string | null;
          updated_at: string;
        };
        Insert: {
          author_name: string;
          comment: string;
          created_at?: string;
          id?: string;
          is_published?: boolean;
          rating: number;
          reviewed_on?: string | null;
          source?: string | null;
          updated_at?: string;
        };
        Update: {
          author_name?: string;
          comment?: string;
          created_at?: string;
          id?: string;
          is_published?: boolean;
          rating?: number;
          reviewed_on?: string | null;
          source?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      social_links: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          label: string | null;
          platform: string;
          sort_order: number;
          updated_at: string;
          url: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          label?: string | null;
          platform: string;
          sort_order?: number;
          updated_at?: string;
          url: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          label?: string | null;
          platform?: string;
          sort_order?: number;
          updated_at?: string;
          url?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      save_promotion: {
        Args: {
          description?: string;
          discount_type: string;
          discount_value: number;
          ends_on?: string;
          is_active: boolean;
          product_ids: string[];
          promotion_id?: string;
          starts_on: string;
          title: string;
        };
        Returns: string;
      };
    };
    Enums: {
      app_role: "admin" | "user";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const;
