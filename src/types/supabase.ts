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
      activities: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          message: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          message: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          message?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      agenda_events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          event_date: string
          event_time: string | null
          event_type: Database["public"]["Enums"]["agenda_event_type"]
          id: string
          location: string | null
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date: string
          event_time?: string | null
          event_type?: Database["public"]["Enums"]["agenda_event_type"]
          id?: string
          location?: string | null
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date?: string
          event_time?: string | null
          event_type?: Database["public"]["Enums"]["agenda_event_type"]
          id?: string
          location?: string | null
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agenda_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      demands: {
        Row: {
          assigned_to: string | null
          category: Database["public"]["Enums"]["demand_category"]
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          neighborhood: string | null
          priority: Database["public"]["Enums"]["demand_priority"]
          status: Database["public"]["Enums"]["demand_status"]
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["demand_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          neighborhood?: string | null
          priority?: Database["public"]["Enums"]["demand_priority"]
          status?: Database["public"]["Enums"]["demand_status"]
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["demand_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          neighborhood?: string | null
          priority?: Database["public"]["Enums"]["demand_priority"]
          status?: Database["public"]["Enums"]["demand_status"]
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "demands_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_pages: {
        Row: {
          bio: string | null
          created_at: string
          headline: string | null
          id: string
          is_published: boolean
          photo_url: string | null
          proposals: Json
          slug: string
          social_links: Json
          tenant_id: string
          updated_at: string
          video_url: string | null
          whatsapp: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          headline?: string | null
          id?: string
          is_published?: boolean
          photo_url?: string | null
          proposals?: Json
          slug: string
          social_links?: Json
          tenant_id: string
          updated_at?: string
          video_url?: string | null
          whatsapp?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          headline?: string | null
          id?: string
          is_published?: boolean
          photo_url?: string | null
          proposals?: Json
          slug?: string
          social_links?: Json
          tenant_id?: string
          updated_at?: string
          video_url?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "landing_pages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderships: {
        Row: {
          created_at: string
          estimated_votes: number
          id: string
          name: string
          region: string | null
          supporter_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          estimated_votes?: number
          id?: string
          name: string
          region?: string | null
          supporter_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          estimated_votes?: number
          id?: string
          name?: string
          region?: string | null
          supporter_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaderships_supporter_id_fkey"
            columns: ["supporter_id"]
            isOneToOne: false
            referencedRelation: "supporters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaderships_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_snapshots: {
        Row: {
          created_at: string
          created_by: string | null
          data: Json
          id: string
          recorded_at: string
          snapshot_type: Database["public"]["Enums"]["poll_snapshot_type"]
          tenant_id: string
          title: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data?: Json
          id?: string
          recorded_at?: string
          snapshot_type: Database["public"]["Enums"]["poll_snapshot_type"]
          tenant_id: string
          title?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data?: Json
          id?: string
          recorded_at?: string
          snapshot_type?: Database["public"]["Enums"]["poll_snapshot_type"]
          tenant_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "poll_snapshots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          platform_role: Database["public"]["Enums"]["platform_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          platform_role?: Database["public"]["Enums"]["platform_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          platform_role?: Database["public"]["Enums"]["platform_role"]
          updated_at?: string
        }
        Relationships: []
      }
      supporters: {
        Row: {
          city: string | null
          created_at: string
          created_by: string | null
          electoral_section: string | null
          electoral_zone: string | null
          id: string
          interest: string | null
          leadership_id: string | null
          name: string
          neighborhood: string | null
          notes: string | null
          phone: string | null
          source: Database["public"]["Enums"]["supporter_source"]
          status: Database["public"]["Enums"]["supporter_status"]
          support_level: Database["public"]["Enums"]["support_level"]
          tags: string[]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          created_by?: string | null
          electoral_section?: string | null
          electoral_zone?: string | null
          id?: string
          interest?: string | null
          leadership_id?: string | null
          name: string
          neighborhood?: string | null
          notes?: string | null
          phone?: string | null
          source?: Database["public"]["Enums"]["supporter_source"]
          status?: Database["public"]["Enums"]["supporter_status"]
          support_level?: Database["public"]["Enums"]["support_level"]
          tags?: string[]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          created_by?: string | null
          electoral_section?: string | null
          electoral_zone?: string | null
          id?: string
          interest?: string | null
          leadership_id?: string | null
          name?: string
          neighborhood?: string | null
          notes?: string | null
          phone?: string | null
          source?: Database["public"]["Enums"]["supporter_source"]
          status?: Database["public"]["Enums"]["supporter_status"]
          support_level?: Database["public"]["Enums"]["support_level"]
          tags?: string[]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supporters_leadership_id_fkey"
            columns: ["leadership_id"]
            isOneToOne: false
            referencedRelation: "leaderships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supporters_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["tenant_role"]
          status: Database["public"]["Enums"]["invitation_status"]
          tenant_id: string
          token: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["tenant_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          tenant_id: string
          token?: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["tenant_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          tenant_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_members: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["tenant_role"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["tenant_role"]
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["tenant_role"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_user_id: string | null
          plan: Database["public"]["Enums"]["tenant_plan"]
          slug: string
          status: Database["public"]["Enums"]["tenant_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_user_id?: string | null
          plan?: Database["public"]["Enums"]["tenant_plan"]
          slug: string
          status?: Database["public"]["Enums"]["tenant_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_user_id?: string | null
          plan?: Database["public"]["Enums"]["tenant_plan"]
          slug?: string
          status?: Database["public"]["Enums"]["tenant_status"]
          updated_at?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          id: string
          notifications: Json
          tenant_id: string
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notifications?: Json
          tenant_id: string
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notifications?: Json
          tenant_id?: string
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_team_invitation: { Args: { p_token: string }; Returns: string }
      can_manage_tenant: { Args: { p_tenant_id: string }; Returns: boolean }
      can_write_tenant: { Args: { p_tenant_id: string }; Returns: boolean }
      get_public_landing: { Args: { p_slug: string }; Returns: Json }
      get_tenant_dashboard_metrics: {
        Args: { p_tenant_id: string }
        Returns: Json
      }
      is_super_admin: { Args: never; Returns: boolean }
      log_activity: {
        Args: {
          p_entity_id?: string
          p_entity_type?: string
          p_message: string
          p_tenant_id: string
        }
        Returns: undefined
      }
      register_supporter_from_landing: {
        Args: {
          p_city?: string
          p_interest?: string
          p_name: string
          p_neighborhood?: string
          p_notes?: string
          p_phone?: string
          p_slug: string
        }
        Returns: string
      }
      setup_politician_tenant: {
        Args: { p_headline?: string; p_slug: string; p_tenant_name: string }
        Returns: string
      }
      tenant_role: {
        Args: { p_tenant_id: string }
        Returns: Database["public"]["Enums"]["tenant_role"]
      }
      user_tenant_ids: { Args: never; Returns: string[] }
    }
    Enums: {
      agenda_event_type: "reuniao" | "evento" | "caminhada" | "visita"
      demand_category:
        | "saude"
        | "educacao"
        | "infraestrutura"
        | "seguranca"
        | "iluminacao"
      demand_priority: "baixa" | "media" | "alta"
      demand_status: "aberto" | "em_andamento" | "resolvido"
      invitation_status: "pending" | "accepted" | "expired" | "revoked"
      platform_role: "user" | "super_admin"
      poll_snapshot_type:
        | "intencao_voto"
        | "aprovacao_bairro"
        | "crescimento_apoiadores"
        | "custom"
      support_level: "forte" | "medio" | "fraco" | "indeciso"
      supporter_source: "manual" | "landing" | "import"
      supporter_status:
        | "interessado"
        | "apoiador"
        | "lideranca"
        | "oposicao"
        | "indeciso"
      tenant_plan: "trial" | "basic" | "pro" | "enterprise"
      tenant_role:
        | "owner"
        | "coordinator"
        | "advisor"
        | "leadership"
        | "operator"
        | "viewer"
      tenant_status: "active" | "suspended" | "pending" | "trial" | "cancelled"
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
      agenda_event_type: ["reuniao", "evento", "caminhada", "visita"],
      demand_category: [
        "saude",
        "educacao",
        "infraestrutura",
        "seguranca",
        "iluminacao",
      ],
      demand_priority: ["baixa", "media", "alta"],
      demand_status: ["aberto", "em_andamento", "resolvido"],
      invitation_status: ["pending", "accepted", "expired", "revoked"],
      platform_role: ["user", "super_admin"],
      poll_snapshot_type: [
        "intencao_voto",
        "aprovacao_bairro",
        "crescimento_apoiadores",
        "custom",
      ],
      support_level: ["forte", "medio", "fraco", "indeciso"],
      supporter_source: ["manual", "landing", "import"],
      supporter_status: [
        "interessado",
        "apoiador",
        "lideranca",
        "oposicao",
        "indeciso",
      ],
      tenant_plan: ["trial", "basic", "pro", "enterprise"],
      tenant_role: [
        "owner",
        "coordinator",
        "advisor",
        "leadership",
        "operator",
        "viewer",
      ],
      tenant_status: ["active", "suspended", "pending", "trial", "cancelled"],
    },
  },
} as const
