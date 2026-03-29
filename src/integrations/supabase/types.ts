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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          created_at: string
          customer_id: string | null
          description: string | null
          id: string
          lead_id: string | null
          metadata: Json | null
          type: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          description?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          type: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          description?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          action_type: string
          condition: Json
          created_at: string
          custom_message: string | null
          delay_minutes: number
          id: string
          is_active: boolean
          last_run_at: string | null
          name: string
          template_id: string | null
          trigger_type: string
          updated_at: string
        }
        Insert: {
          action_type?: string
          condition?: Json
          created_at?: string
          custom_message?: string | null
          delay_minutes?: number
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          name: string
          template_id?: string | null
          trigger_type: string
          updated_at?: string
        }
        Update: {
          action_type?: string
          condition?: Json
          created_at?: string
          custom_message?: string | null
          delay_minutes?: number
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          name?: string
          template_id?: string | null
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "message_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          age_group: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          instructor: string | null
          is_active: boolean | null
          max_participants: number | null
          name: string
          payment_link: string | null
          price: number | null
          schedule: string | null
          semester: string | null
          start_date: string | null
          track: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          age_group?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          instructor?: string | null
          is_active?: boolean | null
          max_participants?: number | null
          name: string
          payment_link?: string | null
          price?: number | null
          schedule?: string | null
          semester?: string | null
          start_date?: string | null
          track?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          age_group?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          instructor?: string | null
          is_active?: boolean | null
          max_participants?: number | null
          name?: string
          payment_link?: string | null
          price?: number | null
          schedule?: string | null
          semester?: string | null
          start_date?: string | null
          track?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: []
      }
      custom_column_values: {
        Row: {
          created_at: string
          custom_column_id: string
          entity_id: string
          id: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          custom_column_id: string
          entity_id: string
          id?: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          custom_column_id?: string
          entity_id?: string
          id?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_column_values_custom_column_id_fkey"
            columns: ["custom_column_id"]
            isOneToOne: false
            referencedRelation: "custom_columns"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_columns: {
        Row: {
          column_label: string
          column_name: string
          column_type: string
          created_at: string
          display_order: number | null
          entity_type: string
          id: string
          is_required: boolean | null
          options: Json | null
        }
        Insert: {
          column_label: string
          column_name: string
          column_type?: string
          created_at?: string
          display_order?: number | null
          entity_type: string
          id?: string
          is_required?: boolean | null
          options?: Json | null
        }
        Update: {
          column_label?: string
          column_name?: string
          column_type?: string
          created_at?: string
          display_order?: number | null
          entity_type?: string
          id?: string
          is_required?: boolean | null
          options?: Json | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          lead_id: string | null
          name: string
          notes: string | null
          phone: string
          tags: string[] | null
          total_purchases: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          lead_id?: string | null
          name: string
          notes?: string | null
          phone: string
          tags?: string[] | null
          total_purchases?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          lead_id?: string | null
          name?: string
          notes?: string | null
          phone?: string
          tags?: string[] | null
          total_purchases?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      ea_campaign_templates: {
        Row: {
          cpt_type: string
          created_at: string
          id: string
          name: string
          steps: Json
          updated_at: string
        }
        Insert: {
          cpt_type: string
          created_at?: string
          id?: string
          name: string
          steps?: Json
          updated_at?: string
        }
        Update: {
          cpt_type?: string
          created_at?: string
          id?: string
          name?: string
          steps?: Json
          updated_at?: string
        }
        Relationships: []
      }
      ea_campaigns: {
        Row: {
          created_at: string
          event_id: string
          id: string
          status: string
          template_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          status?: string
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          status?: string
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ea_campaigns_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ea_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ea_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "ea_campaign_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      ea_events: {
        Row: {
          cpt_type: string
          created_at: string
          early_bird_price: number | null
          event_date: string | null
          extra_fields: Json | null
          id: string
          image_url: string | null
          location: string | null
          price: number | null
          synced_at: string | null
          title: string
          url: string | null
        }
        Insert: {
          cpt_type?: string
          created_at?: string
          early_bird_price?: number | null
          event_date?: string | null
          extra_fields?: Json | null
          id?: string
          image_url?: string | null
          location?: string | null
          price?: number | null
          synced_at?: string | null
          title: string
          url?: string | null
        }
        Update: {
          cpt_type?: string
          created_at?: string
          early_bird_price?: number | null
          event_date?: string | null
          extra_fields?: Json | null
          id?: string
          image_url?: string | null
          location?: string | null
          price?: number | null
          synced_at?: string | null
          title?: string
          url?: string | null
        }
        Relationships: []
      }
      ea_logs: {
        Row: {
          created_at: string
          id: string
          level: string
          log_type: string
          message: string
          metadata: Json | null
          source: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          level?: string
          log_type?: string
          message: string
          metadata?: Json | null
          source?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          level?: string
          log_type?: string
          message?: string
          metadata?: Json | null
          source?: string | null
        }
        Relationships: []
      }
      ea_scheduled_posts: {
        Row: {
          approved_at: string | null
          campaign_id: string | null
          content_email: string | null
          content_facebook: string | null
          content_instagram: string | null
          content_whatsapp: string | null
          created_at: string
          event_id: string | null
          id: string
          phase: string | null
          platforms: string[] | null
          published_at: string | null
          status: string
          target_date: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          campaign_id?: string | null
          content_email?: string | null
          content_facebook?: string | null
          content_instagram?: string | null
          content_whatsapp?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          phase?: string | null
          platforms?: string[] | null
          published_at?: string | null
          status?: string
          target_date: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          campaign_id?: string | null
          content_email?: string | null
          content_facebook?: string | null
          content_instagram?: string | null
          content_whatsapp?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          phase?: string | null
          platforms?: string[] | null
          published_at?: string | null
          status?: string
          target_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ea_scheduled_posts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ea_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ea_scheduled_posts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "ea_events"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          amount_paid: number | null
          course_id: string
          created_at: string
          customer_id: string
          discount: number | null
          enrolled_at: string
          id: string
          notes: string | null
          payment_status: string | null
          status: string
          student_notes: string | null
          updated_at: string
        }
        Insert: {
          amount_paid?: number | null
          course_id: string
          created_at?: string
          customer_id: string
          discount?: number | null
          enrolled_at?: string
          id?: string
          notes?: string | null
          payment_status?: string | null
          status?: string
          student_notes?: string | null
          updated_at?: string
        }
        Update: {
          amount_paid?: number | null
          course_id?: string
          created_at?: string
          customer_id?: string
          discount?: number | null
          enrolled_at?: string
          id?: string
          notes?: string | null
          payment_status?: string | null
          status?: string
          student_notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_ups: {
        Row: {
          created_at: string
          customer_id: string | null
          id: string
          lead_id: string | null
          message: string
          scheduled_at: string
          status: string | null
          type: string | null
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          id?: string
          lead_id?: string | null
          message: string
          scheduled_at: string
          status?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          id?: string
          lead_id?: string | null
          message?: string
          scheduled_at?: string
          status?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base: {
        Row: {
          content: string
          created_at: string
          embedding: string | null
          id: string
          source_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          source_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          source_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          ad_name: string | null
          campaign_id: string | null
          created_at: string
          email: string | null
          id: string
          interest: string | null
          last_interaction_at: string | null
          name: string
          phone: string
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          ad_name?: string | null
          campaign_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          interest?: string | null
          last_interaction_at?: string | null
          name: string
          phone: string
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          ad_name?: string | null
          campaign_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          interest?: string | null
          last_interaction_at?: string | null
          name?: string
          phone?: string
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      message_templates: {
        Row: {
          content: string
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          placeholders: string[] | null
          type: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          placeholders?: string[] | null
          type?: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          placeholders?: string[] | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          lead_id: string
          sender: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          lead_id: string
          sender: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          lead_id?: string
          sender?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          link: string | null
          message: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      show_performances: {
        Row: {
          created_at: string
          id: string
          is_cancelled: boolean | null
          notes: string | null
          performance_date: string
          seats_available: number | null
          show_id: string
          ticket_link: string | null
          updated_at: string
          venue: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_cancelled?: boolean | null
          notes?: string | null
          performance_date: string
          seats_available?: number | null
          show_id: string
          ticket_link?: string | null
          updated_at?: string
          venue?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_cancelled?: boolean | null
          notes?: string | null
          performance_date?: string
          seats_available?: number | null
          show_id?: string
          ticket_link?: string | null
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "show_performances_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      shows: {
        Row: {
          age_restriction: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          name: string
          price: number | null
          ticket_link: string | null
          updated_at: string
          venue: string | null
          vip_price: number | null
        }
        Insert: {
          age_restriction?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          price?: number | null
          ticket_link?: string | null
          updated_at?: string
          venue?: string | null
          vip_price?: number | null
        }
        Update: {
          age_restriction?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number | null
          ticket_link?: string | null
          updated_at?: string
          venue?: string | null
          vip_price?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_knowledge_base: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          similarity: number
          title: string
        }[]
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
