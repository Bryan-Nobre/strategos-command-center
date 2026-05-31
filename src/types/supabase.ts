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
      agenda_event_attendees: {
        Row: {
          created_at: string
          event_id: string
          id: string
          notes: string | null
          role: Database["public"]["Enums"]["agenda_attendee_role"]
          status: Database["public"]["Enums"]["agenda_attendee_status"]
          supporter_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          notes?: string | null
          role?: Database["public"]["Enums"]["agenda_attendee_role"]
          status?: Database["public"]["Enums"]["agenda_attendee_status"]
          supporter_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          notes?: string | null
          role?: Database["public"]["Enums"]["agenda_attendee_role"]
          status?: Database["public"]["Enums"]["agenda_attendee_status"]
          supporter_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agenda_event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "agenda_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_event_attendees_supporter_id_fkey"
            columns: ["supporter_id"]
            isOneToOne: false
            referencedRelation: "supporters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_event_attendees_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      agenda_events: {
        Row: {
          city: string | null
          created_at: string
          created_by: string | null
          description: string | null
          event_date: string
          event_time: string | null
          event_type: Database["public"]["Enums"]["agenda_event_type"]
          expected_attendance: number | null
          id: string
          leadership_id: string | null
          location: string | null
          neighborhood: string | null
          status: Database["public"]["Enums"]["agenda_event_status"]
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date: string
          event_time?: string | null
          event_type?: Database["public"]["Enums"]["agenda_event_type"]
          expected_attendance?: number | null
          id?: string
          leadership_id?: string | null
          location?: string | null
          neighborhood?: string | null
          status?: Database["public"]["Enums"]["agenda_event_status"]
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date?: string
          event_time?: string | null
          event_type?: Database["public"]["Enums"]["agenda_event_type"]
          expected_attendance?: number | null
          id?: string
          leadership_id?: string | null
          location?: string | null
          neighborhood?: string | null
          status?: Database["public"]["Enums"]["agenda_event_status"]
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agenda_events_leadership_id_fkey"
            columns: ["leadership_id"]
            isOneToOne: false
            referencedRelation: "leaderships"
            referencedColumns: ["id"]
          },
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
          normalized_city: string | null
          normalized_neighborhood: string | null
          priority: Database["public"]["Enums"]["demand_priority"]
          requester_city: string | null
          requester_name: string | null
          requester_phone: string | null
          source: Database["public"]["Enums"]["demand_source"]
          status: Database["public"]["Enums"]["demand_status"]
          supporter_id: string | null
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
          normalized_city?: string | null
          normalized_neighborhood?: string | null
          priority?: Database["public"]["Enums"]["demand_priority"]
          requester_city?: string | null
          requester_name?: string | null
          requester_phone?: string | null
          source?: Database["public"]["Enums"]["demand_source"]
          status?: Database["public"]["Enums"]["demand_status"]
          supporter_id?: string | null
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
          normalized_city?: string | null
          normalized_neighborhood?: string | null
          priority?: Database["public"]["Enums"]["demand_priority"]
          requester_city?: string | null
          requester_name?: string | null
          requester_phone?: string | null
          source?: Database["public"]["Enums"]["demand_source"]
          status?: Database["public"]["Enums"]["demand_status"]
          supporter_id?: string | null
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
          display_name: string | null
          headline: string | null
          id: string
          is_published: boolean
          lgpd_controller_cpf: string | null
          lgpd_controller_email: string | null
          lgpd_controller_name: string | null
          lgpd_revoke_consent_url: string | null
          photo_url: string | null
          proposals: Json
          public_code: string
          slug: string
          social_links: Json
          tenant_id: string
          theme: Json
          updated_at: string
          video_url: string | null
          whatsapp: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          display_name?: string | null
          headline?: string | null
          id?: string
          is_published?: boolean
          lgpd_controller_cpf?: string | null
          lgpd_controller_email?: string | null
          lgpd_controller_name?: string | null
          lgpd_revoke_consent_url?: string | null
          photo_url?: string | null
          proposals?: Json
          public_code?: string
          slug: string
          social_links?: Json
          tenant_id: string
          theme?: Json
          updated_at?: string
          video_url?: string | null
          whatsapp?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          display_name?: string | null
          headline?: string | null
          id?: string
          is_published?: boolean
          lgpd_controller_cpf?: string | null
          lgpd_controller_email?: string | null
          lgpd_controller_name?: string | null
          lgpd_revoke_consent_url?: string | null
          photo_url?: string | null
          proposals?: Json
          public_code?: string
          slug?: string
          social_links?: Json
          tenant_id?: string
          theme?: Json
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
          actor_type: Database["public"]["Enums"]["leadership_actor_type"]
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
          actor_type?: Database["public"]["Enums"]["leadership_actor_type"]
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
          actor_type?: Database["public"]["Enums"]["leadership_actor_type"]
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
      leadership_chapas: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_published: boolean
          leadership_id: string
          name: string
          subtitle: string | null
          tenant_id: string
          updated_at: string
          vote_weight: number
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_published?: boolean
          leadership_id: string
          name: string
          subtitle?: string | null
          tenant_id: string
          updated_at?: string
          vote_weight?: number
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_published?: boolean
          leadership_id?: string
          name?: string
          subtitle?: string | null
          tenant_id?: string
          updated_at?: string
          vote_weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "leadership_chapas_leadership_id_fkey"
            columns: ["leadership_id"]
            isOneToOne: false
            referencedRelation: "leaderships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leadership_chapas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      supporter_chapa_pledges: {
        Row: {
          chapa_id: string
          created_at: string
          id: string
          supporter_id: string
          tenant_id: string
        }
        Insert: {
          chapa_id: string
          created_at?: string
          id?: string
          supporter_id: string
          tenant_id: string
        }
        Update: {
          chapa_id?: string
          created_at?: string
          id?: string
          supporter_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supporter_chapa_pledges_chapa_id_fkey"
            columns: ["chapa_id"]
            isOneToOne: false
            referencedRelation: "leadership_chapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supporter_chapa_pledges_supporter_id_fkey"
            columns: ["supporter_id"]
            isOneToOne: false
            referencedRelation: "supporters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supporter_chapa_pledges_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      supporter_leadership_links: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          leadership_id: string
          relationship_type: Database["public"]["Enums"]["supporter_leadership_relationship"]
          source: Database["public"]["Enums"]["supporter_leadership_link_source"]
          supporter_id: string
          tenant_id: string
          updated_at: string
          weight: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          leadership_id: string
          relationship_type?: Database["public"]["Enums"]["supporter_leadership_relationship"]
          source?: Database["public"]["Enums"]["supporter_leadership_link_source"]
          supporter_id: string
          tenant_id: string
          updated_at?: string
          weight?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          leadership_id?: string
          relationship_type?: Database["public"]["Enums"]["supporter_leadership_relationship"]
          source?: Database["public"]["Enums"]["supporter_leadership_link_source"]
          supporter_id?: string
          tenant_id?: string
          updated_at?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "supporter_leadership_links_leadership_id_fkey"
            columns: ["leadership_id"]
            isOneToOne: false
            referencedRelation: "leaderships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supporter_leadership_links_supporter_id_fkey"
            columns: ["supporter_id"]
            isOneToOne: false
            referencedRelation: "supporters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supporter_leadership_links_tenant_id_fkey"
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
      geo_enrichment_logs: {
        Row: {
          cache_hit: boolean
          cep: string | null
          created_at: string
          error_message: string | null
          id: string
          latency_ms: number | null
          provider: string | null
          success: boolean
          supporter_id: string
          tenant_id: string
        }
        Insert: {
          cache_hit?: boolean
          cep?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          latency_ms?: number | null
          provider?: string | null
          success?: boolean
          supporter_id: string
          tenant_id: string
        }
        Update: {
          cache_hit?: boolean
          cep?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          latency_ms?: number | null
          provider?: string | null
          success?: boolean
          supporter_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "geo_enrichment_logs_supporter_id_fkey"
            columns: ["supporter_id"]
            isOneToOne: false
            referencedRelation: "supporters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "geo_enrichment_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      postal_code_cache: {
        Row: {
          cep: string
          city_name: string | null
          expires_at: string
          fetched_at: string
          geo_confidence: string | null
          geo_precision: string | null
          ibge_city_code: string | null
          latitude: number | null
          longitude: number | null
          neighborhood: string | null
          provider: string
          raw_response: Json
          state_uf: string | null
          street: string | null
        }
        Insert: {
          cep: string
          city_name?: string | null
          expires_at: string
          fetched_at?: string
          geo_confidence?: string | null
          geo_precision?: string | null
          ibge_city_code?: string | null
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          provider: string
          raw_response?: Json
          state_uf?: string | null
          street?: string | null
        }
        Update: {
          cep?: string
          city_name?: string | null
          expires_at?: string
          fetched_at?: string
          geo_confidence?: string | null
          geo_precision?: string | null
          ibge_city_code?: string | null
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          provider?: string
          raw_response?: Json
          state_uf?: string | null
          street?: string | null
        }
        Relationships: []
      }
      supporters: {
        Row: {
          address_complement: string | null
          address_number: string | null
          birth_date: string | null
          cep: string | null
          city: string | null
          created_at: string
          created_by: string | null
          duplicate_group_key: string | null
          electoral_section: string | null
          electoral_zone: string | null
          email: string | null
          id: string
          lgpd_consent_at: string | null
          street: string | null
          voting_place_name: string | null
          interest: string | null
          is_possible_duplicate: boolean
          last_activity_at: string | null
          activity_score: number
          engagement_status: Database["public"]["Enums"]["supporter_engagement_status"]
          geo_confidence: string | null
          geo_enriched_at: string | null
          geo_enrichment_attempts: number
          geo_enrichment_failed: boolean
          geo_last_attempt_at: string | null
          geo_last_error: string | null
          geo_pending: boolean
          geo_precision: string | null
          geo_processing_at: string | null
          geo_source: string | null
          ibge_city_code: string | null
          latitude: number | null
          leadership_id: string | null
          longitude: number | null
          name: string
          neighborhood: string | null
          normalized_city: string | null
          normalized_neighborhood: string | null
          notes: string | null
          phone: string | null
          source: Database["public"]["Enums"]["supporter_source"]
          state_uf: string | null
          status: Database["public"]["Enums"]["supporter_status"]
          support_level: Database["public"]["Enums"]["support_level"]
          tags: string[]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          address_complement?: string | null
          address_number?: string | null
          birth_date?: string | null
          cep?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          duplicate_group_key?: string | null
          electoral_section?: string | null
          electoral_zone?: string | null
          email?: string | null
          id?: string
          lgpd_consent_at?: string | null
          street?: string | null
          voting_place_name?: string | null
          interest?: string | null
          is_possible_duplicate?: boolean
          last_activity_at?: string | null
          activity_score?: number
          engagement_status?: Database["public"]["Enums"]["supporter_engagement_status"]
          geo_confidence?: string | null
          geo_enriched_at?: string | null
          geo_enrichment_attempts?: number
          geo_enrichment_failed?: boolean
          geo_last_attempt_at?: string | null
          geo_last_error?: string | null
          geo_pending?: boolean
          geo_precision?: string | null
          geo_processing_at?: string | null
          geo_source?: string | null
          ibge_city_code?: string | null
          latitude?: number | null
          leadership_id?: string | null
          longitude?: number | null
          name: string
          neighborhood?: string | null
          normalized_city?: string | null
          normalized_neighborhood?: string | null
          notes?: string | null
          phone?: string | null
          source?: Database["public"]["Enums"]["supporter_source"]
          state_uf?: string | null
          status?: Database["public"]["Enums"]["supporter_status"]
          support_level?: Database["public"]["Enums"]["support_level"]
          tags?: string[]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          cep?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          duplicate_group_key?: string | null
          electoral_section?: string | null
          electoral_zone?: string | null
          email?: string | null
          id?: string
          interest?: string | null
          is_possible_duplicate?: boolean
          last_activity_at?: string | null
          activity_score?: number
          engagement_status?: Database["public"]["Enums"]["supporter_engagement_status"]
          geo_confidence?: string | null
          geo_enriched_at?: string | null
          geo_enrichment_attempts?: number
          geo_enrichment_failed?: boolean
          geo_last_attempt_at?: string | null
          geo_last_error?: string | null
          geo_pending?: boolean
          geo_precision?: string | null
          geo_processing_at?: string | null
          geo_source?: string | null
          ibge_city_code?: string | null
          latitude?: number | null
          leadership_id?: string | null
          longitude?: number | null
          name?: string
          neighborhood?: string | null
          normalized_city?: string | null
          normalized_neighborhood?: string | null
          notes?: string | null
          phone?: string | null
          source?: Database["public"]["Enums"]["supporter_source"]
          state_uf?: string | null
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
          custom_role_id: string | null
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
          custom_role_id?: string | null
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
          custom_role_id?: string | null
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
            foreignKeyName: "team_invitations_custom_role_id_fkey"
            columns: ["custom_role_id"]
            isOneToOne: false
            referencedRelation: "tenant_roles"
            referencedColumns: ["id"]
          },
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
          custom_role_id: string | null
          id: string
          role: Database["public"]["Enums"]["tenant_role"]
          status: Database["public"]["Enums"]["tenant_member_status"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_role_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["tenant_role"]
          status?: Database["public"]["Enums"]["tenant_member_status"]
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_role_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["tenant_role"]
          status?: Database["public"]["Enums"]["tenant_member_status"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_members_custom_role_id_fkey"
            columns: ["custom_role_id"]
            isOneToOne: false
            referencedRelation: "tenant_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_full_access: boolean
          is_system: boolean
          name: string
          permissions: Json
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_full_access?: boolean
          is_system?: boolean
          name: string
          permissions?: Json
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_full_access?: boolean
          is_system?: boolean
          name?: string
          permissions?: Json
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_admin_crm: {
        Row: {
          comment: string | null
          plan_period_end: string | null
          plan_period_start: string | null
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          comment?: string | null
          plan_period_end?: string | null
          plan_period_start?: string | null
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          comment?: string | null
          plan_period_end?: string | null
          plan_period_start?: string | null
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_admin_crm_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
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
      tenant_notifications: {
        Row: {
          action_route: string | null
          action_search: Json
          actor_user_id: string | null
          body: string | null
          category: string
          created_at: string
          dedupe_key: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          read_at: string | null
          severity: string
          tenant_id: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_route?: string | null
          action_search?: Json
          actor_user_id?: string | null
          body?: string | null
          category: string
          created_at?: string
          dedupe_key?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          read_at?: string | null
          severity?: string
          tenant_id: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_route?: string | null
          action_search?: Json
          actor_user_id?: string | null
          body?: string | null
          category?: string
          created_at?: string
          dedupe_key?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          read_at?: string | null
          severity?: string
          tenant_id?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
      geo_enrichment_metrics_v: {
        Row: {
          tenant_id: string
          pending_count: number
          failed_count: number
          success_24h: number
          cache_hit_ratio: number | null
          avg_attempts: number
          with_cep_pct: number | null
          geo_enriched_pct: number | null
        }
        Relationships: []
      }
      leadership_chapa_metrics_v: {
        Row: {
          chapa_id: string
          leadership_id: string
          pledge_count: number
          pledged_votes: number
          tenant_id: string
        }
        Relationships: []
      }
      leadership_political_metrics_v: {
        Row: {
          chapa_count: number
          leadership_id: string
          linked_supporters_count: number
          manual_links_count: number
          pledge_links_count: number
          pledged_supporters_count: number
          pledged_votes: number
          primary_supporters_count: number
          tenant_id: string
          total_relationships: number
          unique_supporters: number
        }
        Relationships: []
      }
      supporter_political_summary_v: {
        Row: {
          has_primary_link: boolean
          leadership_ids: string[]
          leadership_names: string[]
          link_count: number
          primary_leadership_id: string | null
          primary_leadership_name: string | null
          supporter_id: string
          tenant_id: string
        }
        Relationships: []
      }
      leadership_operational_summary_v: {
        Row: {
          actor_type: Database["public"]["Enums"]["leadership_actor_type"]
          chapa_count: number
          created_at: string
          estimated_votes: number
          landing_only_network: boolean
          leadership_id: string
          leadership_region: string | null
          linked_supporters: number
          manual_links_count: number
          name: string
          pledge_links_count: number
          pledged_supporters_count: number
          pledged_votes: number
          political_strength_score: number
          primary_supporters: number
          secondary_supporters: number
          supporter_id: string | null
          tenant_id: string
          top_neighborhood: string | null
          top_neighborhood_concentration_pct: number | null
          top_neighborhood_count: number | null
          weekly_growth: number
        }
        Relationships: []
      }
    }
    Functions: {
      accept_team_invitation: { Args: { p_token: string }; Returns: string }
      can_manage_tenant: { Args: { p_tenant_id: string }; Returns: boolean }
      can_write_tenant: { Args: { p_tenant_id: string }; Returns: boolean }
      get_public_landing: { Args: { p_public_code: string }; Returns: Json }
      resolve_landing_public_code: { Args: { p_ref: string }; Returns: string }
      get_tenant_operational_dashboard: {
        Args: { p_tenant_id: string }
        Returns: Json
      }
      get_tenant_reports_summary: {
        Args: {
          p_tenant_id: string
          p_from: string
          p_to: string
          p_neighborhood?: string
          p_city?: string
          p_source?: string
          p_status?: string
          p_support_level?: string
          p_leadership_id?: string
          p_assigned_to?: string
        }
        Returns: Json
      }
      get_tenant_dashboard_metrics: {
        Args: { p_tenant_id: string }
        Returns: Json
      }
      get_tenant_plan_usage: {
        Args: { p_tenant_id: string }
        Returns: Json
      }
      list_plan_limit_definitions: { Args: never; Returns: Json }
      list_plan_limit_definitions_admin: { Args: never; Returns: Json }
      update_plan_limit_definition: {
        Args: {
          p_exports_enabled: boolean
          p_highlight_style?: string
          p_is_highlighted?: boolean
          p_max_regions: number | null
          p_max_supporters: number | null
          p_max_team_members: number | null
          p_plan: Database["public"]["Enums"]["tenant_plan"]
          p_polls_enabled: boolean
          p_price_label?: string
          p_tagline?: string
        }
        Returns: Json
      }
      get_my_tenant_permissions: { Args: { p_tenant_id: string }; Returns: Json }
      get_unread_notification_count: { Args: { p_tenant_id: string }; Returns: number }
      list_my_notifications: {
        Args: {
          p_limit?: number
          p_tenant_id: string
          p_unread_only?: boolean
        }
        Returns: Json
      }
      mark_all_notifications_read: { Args: { p_tenant_id: string }; Returns: number }
      mark_notification_read: { Args: { p_notification_id: string }; Returns: boolean }
      notify_supporter_import_completed: {
        Args: { p_count: number; p_tenant_id: string }
        Returns: string
      }
      list_tenant_roles: { Args: { p_tenant_id: string }; Returns: Json }
      upsert_tenant_role: {
        Args: {
          p_description: string
          p_name: string
          p_permissions: Json
          p_role_id: string | null
          p_tenant_id: string
        }
        Returns: Json
      }
      delete_tenant_role: { Args: { p_role_id: string }; Returns: undefined }
      update_member_custom_role: {
        Args: { p_custom_role_id: string; p_member_id: string }
        Returns: undefined
      }
      list_team_members_enriched: { Args: { p_tenant_id: string }; Returns: Json }
      validate_team_provision_request: {
        Args: { p_email: string; p_tenant_id: string }
        Returns: undefined
      }
      update_team_member_details: {
        Args: {
          p_custom_role_id?: string | null
          p_full_name?: string | null
          p_member_id: string
          p_phone?: string | null
        }
        Returns: undefined
      }
      set_team_member_status: {
        Args: {
          p_member_id: string
          p_status: Database["public"]["Enums"]["tenant_member_status"]
        }
        Returns: undefined
      }
      remove_team_member: { Args: { p_member_id: string }; Returns: undefined }
      assert_can_manage_team_member: { Args: { p_member_id: string }; Returns: Json }
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
      apply_supporter_geo_from_cep: {
        Args: { p_geo_payload: Json; p_supporter_id: string }
        Returns: undefined
      }
      claim_geo_enrichment_batch: {
        Args: { p_limit?: number }
        Returns: {
          supporter_id: string
          tenant_id: string
          cep: string
          geo_source: string | null
          geo_pending: boolean
          geo_enrichment_attempts: number
        }[]
      }
      process_pending_geo_enrichment: {
        Args: { p_limit?: number }
        Returns: Json
      }
      fail_geo_enrichment: {
        Args: {
          p_supporter_id: string
          p_error: string
          p_provider?: string | null
          p_cache_hit?: boolean
          p_latency_ms?: number | null
        }
        Returns: undefined
      }
      insert_geo_enrichment_log: {
        Args: {
          p_supporter_id: string
          p_tenant_id: string
          p_cep?: string | null
          p_provider?: string | null
          p_cache_hit?: boolean
          p_success?: boolean
          p_error_message?: string | null
          p_latency_ms?: number | null
        }
        Returns: undefined
      }
      geo_source_priority: {
        Args: { p_source?: string }
        Returns: number
      }
      get_postal_code_cache: {
        Args: { p_cep: string }
        Returns: Json
      }
      normalize_cep: {
        Args: { p_input?: string }
        Returns: string
      }
      register_supporter_from_landing: {
        Args: {
          p_address_complement?: string
          p_address_number?: string
          p_birth_date?: string
          p_cep?: string
          p_chapa_ids?: string[]
          p_city?: string
          p_email?: string
          p_interest?: string
          p_lgpd_consent?: boolean
          p_name: string
          p_neighborhood?: string
          p_notes?: string
          p_phone?: string
          p_primary_leadership_id?: string
          p_public_code: string
          p_state_uf?: string
          p_street?: string
          p_voting_place_name?: string
        }
        Returns: Json
      }
      search_public_polling_places: {
        Args: {
          p_limit?: number
          p_query?: string
          p_state_uf?: string
        }
        Returns: {
          address: string | null
          id: string
          municipality: string
          name: string
          state_uf: string
        }[]
      }
      upsert_postal_code_cache: {
        Args: { p_payload: Json }
        Returns: undefined
      }
      find_possible_duplicate_supporter: {
        Args: {
          p_tenant_id: string
          p_phone?: string
          p_email?: string
          p_exclude_id?: string
        }
        Returns: string
      }
      normalize_neighborhood: {
        Args: { p_text?: string }
        Returns: string
      }
      normalize_city: {
        Args: { p_text?: string }
        Returns: string
      }
      recompute_supporter_leadership_primary: {
        Args: { p_supporter_id: string }
        Returns: string
      }
      recompute_supporter_activity_state: {
        Args: { p_supporter_id: string }
        Returns: undefined
      }
      sync_supporter_links_from_pledges: {
        Args: { p_supporter_id: string }
        Returns: undefined
      }
      supporter_matches_leadership_filter: {
        Args: { p_leadership_id: string | null; p_supporter_id: string }
        Returns: boolean
      }
      get_leadership_operational_detail: {
        Args: {
          p_leadership_id: string
          p_segment?: string
          p_search?: string | null
          p_limit?: number
          p_offset?: number
        }
        Returns: Json
      }
      get_manual_goals_config: {
        Args: { p_tenant_id: string }
        Returns: Json
      }
      upsert_tenant_admin_crm: {
        Args: {
          p_clear_comment?: boolean
          p_clear_plan_period_end?: boolean
          p_clear_plan_period_start?: boolean
          p_comment?: string | null
          p_plan_period_end?: string | null
          p_plan_period_start?: string | null
          p_tenant_id: string
        }
        Returns: undefined
      }
      upsert_manual_goals_config: {
        Args: { p_goals?: Json; p_tenant_id: string }
        Returns: undefined
      }
      notify_agenda_daily_reminders: { Args: never; Returns: number }
      register_demand_from_landing: {
        Args: {
          p_category?: Database["public"]["Enums"]["demand_category"]
          p_city?: string
          p_description?: string
          p_neighborhood?: string
          p_priority?: Database["public"]["Enums"]["demand_priority"]
          p_requester_name?: string
          p_requester_phone?: string
          p_public_code: string
          p_title: string
        }
        Returns: string
      }
      search_tenant: {
        Args: {
          p_limit_per_module?: number
          p_query: string
          p_tenant_id: string
        }
        Returns: Json
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
      agenda_attendee_role: "acompanhante" | "convidado" | "lideranca"
      agenda_attendee_status: "convidado" | "confirmado" | "compareceu" | "nao_compareceu"
      agenda_event_status: "agendado" | "confirmado" | "realizado" | "cancelado"
      agenda_event_type: "reuniao" | "evento" | "caminhada" | "visita"
      demand_category:
        | "saude"
        | "educacao"
        | "infraestrutura"
        | "seguranca"
        | "iluminacao"
        | "melhorias"
        | "outros"
      demand_priority: "baixa" | "media" | "alta"
      demand_source: "manual" | "landing"
      demand_status: "aberto" | "em_andamento" | "resolvido"
      invitation_status: "pending" | "accepted" | "expired" | "revoked"
      platform_role: "user" | "super_admin"
      poll_snapshot_type:
        | "intencao_voto"
        | "aprovacao_bairro"
        | "crescimento_apoiadores"
        | "custom"
      support_level: "forte" | "medio" | "fraco" | "indeciso"
      supporter_leadership_link_source:
        | "landing"
        | "manual"
        | "import"
        | "migration"
        | "system"
      leadership_actor_type:
        | "coordinator"
        | "candidate"
        | "regional_leader"
        | "grassroots"
        | "influencer"
        | "volunteer_hub"
      supporter_leadership_relationship: "pledge" | "assigned" | "imported" | "legacy"
      supporter_activity_event_type:
        | "landing_signup"
        | "pledge_added"
        | "leadership_linked"
        | "demand_created"
        | "supporter_updated"
        | "imported"
        | "manual_created"
      supporter_activity_event_source:
        | "landing"
        | "manual"
        | "import"
        | "system"
        | "migration"
        | "crm"
      supporter_engagement_status: "hot" | "warm" | "cold" | "inactive"
      supporter_source: "manual" | "landing" | "import"
      supporter_status:
        | "interessado"
        | "apoiador"
        | "lideranca"
        | "oposicao"
        | "indeciso"
      tenant_member_status: "active" | "suspended"
      tenant_plan: "start" | "basic" | "pro" | "enterprise"
      tenant_role:
        | "owner"
        | "coordinator"
        | "advisor"
        | "leadership"
        | "operator"
        | "viewer"
      tenant_status: "active" | "suspended" | "pending" | "cancelled"
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
      agenda_attendee_role: ["acompanhante", "convidado", "lideranca"],
      agenda_attendee_status: ["convidado", "confirmado", "compareceu", "nao_compareceu"],
      agenda_event_status: ["agendado", "confirmado", "realizado", "cancelado"],
      agenda_event_type: ["reuniao", "evento", "caminhada", "visita"],
      demand_category: [
        "saude",
        "educacao",
        "infraestrutura",
        "seguranca",
        "iluminacao",
        "melhorias",
        "outros",
      ],
      demand_priority: ["baixa", "media", "alta"],
      demand_source: ["manual", "landing"],
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
      supporter_leadership_link_source: ["landing", "manual", "import", "migration", "system"],
      leadership_actor_type: [
        "coordinator",
        "candidate",
        "regional_leader",
        "grassroots",
        "influencer",
        "volunteer_hub",
      ],
      supporter_leadership_relationship: ["pledge", "assigned", "imported", "legacy"],
      supporter_source: ["manual", "landing", "import"],
      supporter_status: [
        "interessado",
        "apoiador",
        "lideranca",
        "oposicao",
        "indeciso",
      ],
      tenant_member_status: ["active", "suspended"],
      tenant_plan: ["start", "basic", "pro", "enterprise"],
      tenant_role: [
        "owner",
        "coordinator",
        "advisor",
        "leadership",
        "operator",
        "viewer",
      ],
      tenant_status: ["active", "suspended", "pending", "cancelled"],
    },
  },
} as const
