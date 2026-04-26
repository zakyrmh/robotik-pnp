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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string
          summary: string | null
          table_name: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          summary?: string | null
          table_name: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          summary?: string | null
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      division_research_logs: {
        Row: {
          content: string
          created_at: string | null
          division_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          division_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          division_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "division_research_logs_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "division_research_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      divisions: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      education_details: {
        Row: {
          class: string | null
          created_at: string
          nim: string
          study_program_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          class?: string | null
          created_at?: string
          nim: string
          study_program_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          class?: string | null
          created_at?: string
          nim?: string
          study_program_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "education_details_study_program_id_fkey"
            columns: ["study_program_id"]
            isOneToOne: false
            referencedRelation: "study_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "education_details_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      komdis_attendance_tokens: {
        Row: {
          created_at: string
          event_id: string
          expires_at: string
          id: string
          is_used: boolean
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          expires_at: string
          id?: string
          is_used?: boolean
          token: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          expires_at?: string
          id?: string
          is_used?: boolean
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "komdis_attendance_tokens_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "komdis_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "komdis_attendance_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      komdis_attendances: {
        Row: {
          created_at: string
          event_id: string
          id: string
          is_late: boolean
          late_minutes: number
          scanned_at: string
          scanned_by: string | null
          status: Database["public"]["Enums"]["komdis_attendance_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          is_late?: boolean
          late_minutes?: number
          scanned_at?: string
          scanned_by?: string | null
          status?: Database["public"]["Enums"]["komdis_attendance_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          is_late?: boolean
          late_minutes?: number
          scanned_at?: string
          scanned_by?: string | null
          status?: Database["public"]["Enums"]["komdis_attendance_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "komdis_attendances_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "komdis_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "komdis_attendances_scanned_by_fkey"
            columns: ["scanned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "komdis_attendances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      komdis_events: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          end_time: string | null
          event_date: string
          id: string
          late_tolerance: number
          location: string | null
          points_per_late: number
          start_time: string
          status: Database["public"]["Enums"]["komdis_event_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          end_time?: string | null
          event_date: string
          id?: string
          late_tolerance?: number
          location?: string | null
          points_per_late?: number
          start_time: string
          status?: Database["public"]["Enums"]["komdis_event_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          end_time?: string | null
          event_date?: string
          id?: string
          late_tolerance?: number
          location?: string | null
          points_per_late?: number
          start_time?: string
          status?: Database["public"]["Enums"]["komdis_event_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "komdis_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      komdis_point_reductions: {
        Row: {
          approved_points: number | null
          created_at: string
          evidence_url: string | null
          id: string
          points: number
          reason: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["komdis_reduction_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_points?: number | null
          created_at?: string
          evidence_url?: string | null
          id?: string
          points: number
          reason: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["komdis_reduction_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_points?: number | null
          created_at?: string
          evidence_url?: string | null
          id?: string
          points?: number
          reason?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["komdis_reduction_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "komdis_point_reductions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "komdis_point_reductions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      komdis_sanctions: {
        Row: {
          attendance_id: string
          created_at: string
          event_id: string
          given_by: string
          id: string
          notes: string | null
          points: number
          sanction_type: Database["public"]["Enums"]["komdis_sanction_type"]
          user_id: string
        }
        Insert: {
          attendance_id: string
          created_at?: string
          event_id: string
          given_by: string
          id?: string
          notes?: string | null
          points?: number
          sanction_type: Database["public"]["Enums"]["komdis_sanction_type"]
          user_id: string
        }
        Update: {
          attendance_id?: string
          created_at?: string
          event_id?: string
          given_by?: string
          id?: string
          notes?: string | null
          points?: number
          sanction_type?: Database["public"]["Enums"]["komdis_sanction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "komdis_sanctions_attendance_id_fkey"
            columns: ["attendance_id"]
            isOneToOne: true
            referencedRelation: "komdis_attendances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "komdis_sanctions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "komdis_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "komdis_sanctions_given_by_fkey"
            columns: ["given_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "komdis_sanctions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      komdis_violations: {
        Row: {
          category: Database["public"]["Enums"]["komdis_violation_category"]
          created_at: string
          description: string
          event_id: string | null
          given_by: string
          id: string
          points: number
          sanction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["komdis_violation_category"]
          created_at?: string
          description: string
          event_id?: string | null
          given_by: string
          id?: string
          points?: number
          sanction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["komdis_violation_category"]
          created_at?: string
          description?: string
          event_id?: string | null
          given_by?: string
          id?: string
          points?: number
          sanction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "komdis_violations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "komdis_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "komdis_violations_given_by_fkey"
            columns: ["given_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "komdis_violations_sanction_id_fkey"
            columns: ["sanction_id"]
            isOneToOne: false
            referencedRelation: "komdis_sanctions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "komdis_violations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      komdis_warning_letters: {
        Row: {
          acknowledged_at: string | null
          consequences: string | null
          created_at: string
          effective_date: string | null
          expiry_date: string | null
          id: string
          issued_by: string
          issued_date: string | null
          letter_number: string
          level: Database["public"]["Enums"]["komdis_sp_level"]
          points_at_issue: number
          reason: string
          revoke_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          status: Database["public"]["Enums"]["komdis_sp_status"]
          subject: string
          updated_at: string
          user_id: string
          violations_summary: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          consequences?: string | null
          created_at?: string
          effective_date?: string | null
          expiry_date?: string | null
          id?: string
          issued_by: string
          issued_date?: string | null
          letter_number: string
          level: Database["public"]["Enums"]["komdis_sp_level"]
          points_at_issue?: number
          reason: string
          revoke_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          status?: Database["public"]["Enums"]["komdis_sp_status"]
          subject: string
          updated_at?: string
          user_id: string
          violations_summary?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          consequences?: string | null
          created_at?: string
          effective_date?: string | null
          expiry_date?: string | null
          id?: string
          issued_by?: string
          issued_date?: string | null
          letter_number?: string
          level?: Database["public"]["Enums"]["komdis_sp_level"]
          points_at_issue?: number
          reason?: string
          revoke_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          status?: Database["public"]["Enums"]["komdis_sp_status"]
          subject?: string
          updated_at?: string
          user_id?: string
          violations_summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "komdis_warning_letters_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "komdis_warning_letters_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "komdis_warning_letters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      majors: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      mrc_categories: {
        Row: {
          created_at: string
          description: string | null
          event_id: string
          id: string
          is_active: boolean
          max_team_size: number
          max_teams: number | null
          min_team_size: number
          name: string
          registration_fee: number
          rules_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_id: string
          id?: string
          is_active?: boolean
          max_team_size?: number
          max_teams?: number | null
          min_team_size?: number
          name: string
          registration_fee?: number
          rules_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_id?: string
          id?: string
          is_active?: boolean
          max_team_size?: number
          max_teams?: number | null
          min_team_size?: number
          name?: string
          registration_fee?: number
          rules_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mrc_categories_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "mrc_events"
            referencedColumns: ["id"]
          },
        ]
      }
      mrc_events: {
        Row: {
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          description: string | null
          event_end: string | null
          event_start: string | null
          id: string
          name: string
          registration_close: string | null
          registration_open: string | null
          slug: string
          status: Database["public"]["Enums"]["mrc_event_status"]
          updated_at: string
          venue: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_end?: string | null
          event_start?: string | null
          id?: string
          name: string
          registration_close?: string | null
          registration_open?: string | null
          slug: string
          status?: Database["public"]["Enums"]["mrc_event_status"]
          updated_at?: string
          venue?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_end?: string | null
          event_start?: string | null
          id?: string
          name?: string
          registration_close?: string | null
          registration_open?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["mrc_event_status"]
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mrc_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mrc_group_teams: {
        Row: {
          created_at: string
          draws: number
          group_id: string
          id: string
          losses: number
          played: number
          points: number
          rank: number | null
          score_against: number
          score_for: number
          team_id: string
          wins: number
        }
        Insert: {
          created_at?: string
          draws?: number
          group_id: string
          id?: string
          losses?: number
          played?: number
          points?: number
          rank?: number | null
          score_against?: number
          score_for?: number
          team_id: string
          wins?: number
        }
        Update: {
          created_at?: string
          draws?: number
          group_id?: string
          id?: string
          losses?: number
          played?: number
          points?: number
          rank?: number | null
          score_against?: number
          score_for?: number
          team_id?: string
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "mrc_group_teams_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "mrc_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mrc_group_teams_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "mrc_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      mrc_groups: {
        Row: {
          category_id: string
          created_at: string
          event_id: string
          group_name: string
          id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          event_id: string
          group_name: string
          id?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          event_id?: string
          group_name?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mrc_groups_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "mrc_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mrc_groups_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "mrc_events"
            referencedColumns: ["id"]
          },
        ]
      }
      mrc_live_state: {
        Row: {
          active_scene: Database["public"]["Enums"]["mrc_overlay_scene"]
          break_countdown: number | null
          break_message: string | null
          break_started_at: string | null
          break_target: string | null
          break_timer_mode: Database["public"]["Enums"]["mrc_timer_mode"]
          break_timer_status: Database["public"]["Enums"]["mrc_timer_status"]
          category_id: string
          coming_up_countdown: number | null
          coming_up_match_id: string | null
          coming_up_message: string | null
          coming_up_started_at: string | null
          coming_up_target: string | null
          coming_up_timer_mode: Database["public"]["Enums"]["mrc_timer_mode"]
          coming_up_timer_status: Database["public"]["Enums"]["mrc_timer_status"]
          current_match_id: string | null
          event_id: string
          id: string
          updated_at: string
        }
        Insert: {
          active_scene?: Database["public"]["Enums"]["mrc_overlay_scene"]
          break_countdown?: number | null
          break_message?: string | null
          break_started_at?: string | null
          break_target?: string | null
          break_timer_mode?: Database["public"]["Enums"]["mrc_timer_mode"]
          break_timer_status?: Database["public"]["Enums"]["mrc_timer_status"]
          category_id: string
          coming_up_countdown?: number | null
          coming_up_match_id?: string | null
          coming_up_message?: string | null
          coming_up_started_at?: string | null
          coming_up_target?: string | null
          coming_up_timer_mode?: Database["public"]["Enums"]["mrc_timer_mode"]
          coming_up_timer_status?: Database["public"]["Enums"]["mrc_timer_status"]
          current_match_id?: string | null
          event_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          active_scene?: Database["public"]["Enums"]["mrc_overlay_scene"]
          break_countdown?: number | null
          break_message?: string | null
          break_started_at?: string | null
          break_target?: string | null
          break_timer_mode?: Database["public"]["Enums"]["mrc_timer_mode"]
          break_timer_status?: Database["public"]["Enums"]["mrc_timer_status"]
          category_id?: string
          coming_up_countdown?: number | null
          coming_up_match_id?: string | null
          coming_up_message?: string | null
          coming_up_started_at?: string | null
          coming_up_target?: string | null
          coming_up_timer_mode?: Database["public"]["Enums"]["mrc_timer_mode"]
          coming_up_timer_status?: Database["public"]["Enums"]["mrc_timer_status"]
          current_match_id?: string | null
          event_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mrc_live_state_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "mrc_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mrc_live_state_coming_up_match_id_fkey"
            columns: ["coming_up_match_id"]
            isOneToOne: false
            referencedRelation: "mrc_matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mrc_live_state_current_match_id_fkey"
            columns: ["current_match_id"]
            isOneToOne: false
            referencedRelation: "mrc_matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mrc_live_state_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "mrc_events"
            referencedColumns: ["id"]
          },
        ]
      }
      mrc_match_rounds: {
        Row: {
          created_at: string
          id: string
          judged_by: string | null
          match_id: string
          notes: string | null
          round_number: number
          score_a: number
          score_b: number
        }
        Insert: {
          created_at?: string
          id?: string
          judged_by?: string | null
          match_id: string
          notes?: string | null
          round_number: number
          score_a?: number
          score_b?: number
        }
        Update: {
          created_at?: string
          id?: string
          judged_by?: string | null
          match_id?: string
          notes?: string | null
          round_number?: number
          score_a?: number
          score_b?: number
        }
        Relationships: [
          {
            foreignKeyName: "mrc_match_rounds_judged_by_fkey"
            columns: ["judged_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mrc_match_rounds_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "mrc_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      mrc_matches: {
        Row: {
          bracket_position: number | null
          category_id: string
          created_at: string
          current_round: number
          event_id: string
          group_id: string | null
          id: string
          is_swapped: boolean
          match_number: number
          next_match_id: string | null
          next_match_slot: string | null
          score_a: number
          score_b: number
          stage: Database["public"]["Enums"]["mrc_match_stage"]
          status: Database["public"]["Enums"]["mrc_match_status"]
          team_a_id: string | null
          team_a_label: string | null
          team_b_id: string | null
          team_b_label: string | null
          timer_duration: number
          timer_remaining: number
          timer_started_at: string | null
          timer_status: Database["public"]["Enums"]["mrc_timer_status"]
          total_rounds: number
          updated_at: string
          winner_id: string | null
        }
        Insert: {
          bracket_position?: number | null
          category_id: string
          created_at?: string
          current_round?: number
          event_id: string
          group_id?: string | null
          id?: string
          is_swapped?: boolean
          match_number?: number
          next_match_id?: string | null
          next_match_slot?: string | null
          score_a?: number
          score_b?: number
          stage?: Database["public"]["Enums"]["mrc_match_stage"]
          status?: Database["public"]["Enums"]["mrc_match_status"]
          team_a_id?: string | null
          team_a_label?: string | null
          team_b_id?: string | null
          team_b_label?: string | null
          timer_duration?: number
          timer_remaining?: number
          timer_started_at?: string | null
          timer_status?: Database["public"]["Enums"]["mrc_timer_status"]
          total_rounds?: number
          updated_at?: string
          winner_id?: string | null
        }
        Update: {
          bracket_position?: number | null
          category_id?: string
          created_at?: string
          current_round?: number
          event_id?: string
          group_id?: string | null
          id?: string
          is_swapped?: boolean
          match_number?: number
          next_match_id?: string | null
          next_match_slot?: string | null
          score_a?: number
          score_b?: number
          stage?: Database["public"]["Enums"]["mrc_match_stage"]
          status?: Database["public"]["Enums"]["mrc_match_status"]
          team_a_id?: string | null
          team_a_label?: string | null
          team_b_id?: string | null
          team_b_label?: string | null
          timer_duration?: number
          timer_remaining?: number
          timer_started_at?: string | null
          timer_status?: Database["public"]["Enums"]["mrc_timer_status"]
          total_rounds?: number
          updated_at?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mrc_matches_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "mrc_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mrc_matches_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "mrc_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mrc_matches_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "mrc_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mrc_matches_next_match_id_fkey"
            columns: ["next_match_id"]
            isOneToOne: false
            referencedRelation: "mrc_matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mrc_matches_team_a_id_fkey"
            columns: ["team_a_id"]
            isOneToOne: false
            referencedRelation: "mrc_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mrc_matches_team_b_id_fkey"
            columns: ["team_b_id"]
            isOneToOne: false
            referencedRelation: "mrc_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mrc_matches_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "mrc_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      mrc_overlay_configs: {
        Row: {
          background_url: string | null
          category_id: string
          created_at: string
          event_id: string
          id: string
          score_position: Json | null
          team_a_position: Json | null
          team_b_position: Json | null
          theme_color: string
          timer_position: Json | null
          updated_at: string
        }
        Insert: {
          background_url?: string | null
          category_id: string
          created_at?: string
          event_id: string
          id?: string
          score_position?: Json | null
          team_a_position?: Json | null
          team_b_position?: Json | null
          theme_color?: string
          timer_position?: Json | null
          updated_at?: string
        }
        Update: {
          background_url?: string | null
          category_id?: string
          created_at?: string
          event_id?: string
          id?: string
          score_position?: Json | null
          team_a_position?: Json | null
          team_b_position?: Json | null
          theme_color?: string
          timer_position?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mrc_overlay_configs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "mrc_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mrc_overlay_configs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "mrc_events"
            referencedColumns: ["id"]
          },
        ]
      }
      mrc_payments: {
        Row: {
          account_name: string | null
          amount: number
          created_at: string
          id: string
          notes: string | null
          payment_method: string | null
          proof_url: string
          rejection_reason: string | null
          status: Database["public"]["Enums"]["mrc_payment_status"]
          team_id: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          account_name?: string | null
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          proof_url: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["mrc_payment_status"]
          team_id: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          account_name?: string | null
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          proof_url?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["mrc_payment_status"]
          team_id?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mrc_payments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "mrc_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mrc_payments_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mrc_qr_codes: {
        Row: {
          checked_in_at: string | null
          checked_in_by: string | null
          created_at: string
          id: string
          is_checked_in: boolean
          is_inside: boolean
          member_id: string | null
          person_name: string
          person_role: Database["public"]["Enums"]["mrc_member_role"]
          qr_token: string
          team_id: string
        }
        Insert: {
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string
          id?: string
          is_checked_in?: boolean
          is_inside?: boolean
          member_id?: string | null
          person_name: string
          person_role?: Database["public"]["Enums"]["mrc_member_role"]
          qr_token: string
          team_id: string
        }
        Update: {
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string
          id?: string
          is_checked_in?: boolean
          is_inside?: boolean
          member_id?: string | null
          person_name?: string
          person_role?: Database["public"]["Enums"]["mrc_member_role"]
          qr_token?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mrc_qr_codes_checked_in_by_fkey"
            columns: ["checked_in_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mrc_qr_codes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "mrc_team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mrc_qr_codes_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "mrc_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      mrc_scan_logs: {
        Row: {
          id: string
          is_valid: boolean
          notes: string | null
          qr_code_id: string
          scan_type: Database["public"]["Enums"]["mrc_scan_type"]
          scanned_at: string
          scanned_by: string | null
        }
        Insert: {
          id?: string
          is_valid?: boolean
          notes?: string | null
          qr_code_id: string
          scan_type: Database["public"]["Enums"]["mrc_scan_type"]
          scanned_at?: string
          scanned_by?: string | null
        }
        Update: {
          id?: string
          is_valid?: boolean
          notes?: string | null
          qr_code_id?: string
          scan_type?: Database["public"]["Enums"]["mrc_scan_type"]
          scanned_at?: string
          scanned_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mrc_scan_logs_qr_code_id_fkey"
            columns: ["qr_code_id"]
            isOneToOne: false
            referencedRelation: "mrc_qr_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mrc_scan_logs_scanned_by_fkey"
            columns: ["scanned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      mrc_team_members: {
        Row: {
          created_at: string
          full_name: string
          id: string
          identity_number: string | null
          phone: string | null
          role: Database["public"]["Enums"]["mrc_member_role"]
          team_id: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          identity_number?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["mrc_member_role"]
          team_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          identity_number?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["mrc_member_role"]
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mrc_team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "mrc_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      mrc_teams: {
        Row: {
          advisor_name: string
          advisor_phone: string | null
          captain_email: string
          captain_name: string
          captain_phone: string
          category_id: string
          created_at: string
          event_id: string
          id: string
          institution: string
          notes: string | null
          registered_by: string | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["mrc_team_status"]
          team_name: string
          updated_at: string
          whatsapp_group_url: string | null
        }
        Insert: {
          advisor_name: string
          advisor_phone?: string | null
          captain_email: string
          captain_name: string
          captain_phone: string
          category_id: string
          created_at?: string
          event_id: string
          id?: string
          institution: string
          notes?: string | null
          registered_by?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["mrc_team_status"]
          team_name: string
          updated_at?: string
          whatsapp_group_url?: string | null
        }
        Update: {
          advisor_name?: string
          advisor_phone?: string | null
          captain_email?: string
          captain_name?: string
          captain_phone?: string
          category_id?: string
          created_at?: string
          event_id?: string
          id?: string
          institution?: string
          notes?: string | null
          registered_by?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["mrc_team_status"]
          team_name?: string
          updated_at?: string
          whatsapp_group_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mrc_teams_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "mrc_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mrc_teams_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "mrc_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mrc_teams_registered_by_fkey"
            columns: ["registered_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      or_attendance_tokens: {
        Row: {
          created_at: string
          event_id: string
          expires_at: string
          id: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          expires_at: string
          id?: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          expires_at?: string
          id?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "or_attendance_tokens_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "or_events"
            referencedColumns: ["id"]
          },
        ]
      }
      or_event_attendances: {
        Row: {
          checked_in_at: string | null
          created_at: string
          event_id: string
          id: string
          notes: string | null
          points: number
          status: Database["public"]["Enums"]["or_attendance_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          checked_in_at?: string | null
          created_at?: string
          event_id: string
          id?: string
          notes?: string | null
          points?: number
          status?: Database["public"]["Enums"]["or_attendance_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          checked_in_at?: string | null
          created_at?: string
          event_id?: string
          id?: string
          notes?: string | null
          points?: number
          status?: Database["public"]["Enums"]["or_attendance_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "or_event_attendances_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "or_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "or_event_attendances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      or_events: {
        Row: {
          allow_attendance: boolean
          created_at: string
          created_by: string
          description: string | null
          end_time: string | null
          event_date: string
          event_type: Database["public"]["Enums"]["or_event_type"]
          execution_mode: Database["public"]["Enums"]["or_event_mode"]
          id: string
          late_tolerance: number
          location: string | null
          meeting_link: string | null
          points_absent: number
          points_excused: number
          points_late: number
          points_present: number
          points_sick: number
          start_time: string
          status: Database["public"]["Enums"]["or_event_status"]
          title: string
          updated_at: string
        }
        Insert: {
          allow_attendance?: boolean
          created_at?: string
          created_by: string
          description?: string | null
          end_time?: string | null
          event_date: string
          event_type?: Database["public"]["Enums"]["or_event_type"]
          execution_mode?: Database["public"]["Enums"]["or_event_mode"]
          id?: string
          late_tolerance?: number
          location?: string | null
          meeting_link?: string | null
          points_absent?: number
          points_excused?: number
          points_late?: number
          points_present?: number
          points_sick?: number
          start_time: string
          status?: Database["public"]["Enums"]["or_event_status"]
          title: string
          updated_at?: string
        }
        Update: {
          allow_attendance?: boolean
          created_at?: string
          created_by?: string
          description?: string | null
          end_time?: string | null
          event_date?: string
          event_type?: Database["public"]["Enums"]["or_event_type"]
          execution_mode?: Database["public"]["Enums"]["or_event_mode"]
          id?: string
          late_tolerance?: number
          location?: string | null
          meeting_link?: string | null
          points_absent?: number
          points_excused?: number
          points_late?: number
          points_present?: number
          points_sick?: number
          start_time?: string
          status?: Database["public"]["Enums"]["or_event_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "or_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      or_fixed_internship_quotas: {
        Row: {
          created_at: string
          division_id: string
          id: string
          quota: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          division_id: string
          id?: string
          quota?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          division_id?: string
          id?: string
          quota?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "or_fixed_internship_quotas_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: true
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
        ]
      }
      or_fixed_internships: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          assigned_division_id: string | null
          assignment_notes: string | null
          chosen_at: string | null
          chosen_division_id: string | null
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_division_id?: string | null
          assignment_notes?: string | null
          chosen_at?: string | null
          chosen_division_id?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_division_id?: string | null
          assignment_notes?: string | null
          chosen_at?: string | null
          chosen_division_id?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "or_fixed_internships_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "or_fixed_internships_assigned_division_id_fkey"
            columns: ["assigned_division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "or_fixed_internships_chosen_division_id_fkey"
            columns: ["chosen_division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "or_fixed_internships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      or_group_members: {
        Row: {
          created_at: string
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "or_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "or_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "or_group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      or_groups: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          type: Database["public"]["Enums"]["or_group_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          type: Database["public"]["Enums"]["or_group_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["or_group_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "or_groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      or_internship_applications: {
        Row: {
          alasan_dept_1: string
          alasan_dept_2: string
          alasan_divisi_1: string
          alasan_divisi_2: string
          alasan_minat: string
          created_at: string
          dept_1_id: string
          dept_2_id: string
          divisi_1_id: string
          divisi_2_id: string
          final_dept_id: string | null
          final_divisi_id: string | null
          id: string
          is_manual_registration: boolean
          minat: string
          recommended_dept_id: string | null
          recommended_divisi_id: string | null
          skill: string
          status: string
          updated_at: string
          user_id: string
          yakin_dept_1: string
          yakin_dept_2: string
          yakin_divisi_1: string
          yakin_divisi_2: string
        }
        Insert: {
          alasan_dept_1: string
          alasan_dept_2: string
          alasan_divisi_1: string
          alasan_divisi_2: string
          alasan_minat: string
          created_at?: string
          dept_1_id: string
          dept_2_id: string
          divisi_1_id: string
          divisi_2_id: string
          final_dept_id?: string | null
          final_divisi_id?: string | null
          id?: string
          is_manual_registration?: boolean
          minat: string
          recommended_dept_id?: string | null
          recommended_divisi_id?: string | null
          skill: string
          status?: string
          updated_at?: string
          user_id: string
          yakin_dept_1: string
          yakin_dept_2: string
          yakin_divisi_1: string
          yakin_divisi_2: string
        }
        Update: {
          alasan_dept_1?: string
          alasan_dept_2?: string
          alasan_divisi_1?: string
          alasan_divisi_2?: string
          alasan_minat?: string
          created_at?: string
          dept_1_id?: string
          dept_2_id?: string
          divisi_1_id?: string
          divisi_2_id?: string
          final_dept_id?: string | null
          final_divisi_id?: string | null
          id?: string
          is_manual_registration?: boolean
          minat?: string
          recommended_dept_id?: string | null
          recommended_divisi_id?: string | null
          skill?: string
          status?: string
          updated_at?: string
          user_id?: string
          yakin_dept_1?: string
          yakin_dept_2?: string
          yakin_divisi_1?: string
          yakin_divisi_2?: string
        }
        Relationships: [
          {
            foreignKeyName: "or_internship_applications_dept_1_id_fkey"
            columns: ["dept_1_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "or_internship_applications_dept_2_id_fkey"
            columns: ["dept_2_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "or_internship_applications_divisi_1_id_fkey"
            columns: ["divisi_1_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "or_internship_applications_divisi_2_id_fkey"
            columns: ["divisi_2_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "or_internship_applications_final_dept_id_fkey"
            columns: ["final_dept_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "or_internship_applications_final_divisi_id_fkey"
            columns: ["final_divisi_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "or_internship_applications_recommended_dept_id_fkey"
            columns: ["recommended_dept_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "or_internship_applications_recommended_divisi_id_fkey"
            columns: ["recommended_divisi_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "or_internship_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      or_materials: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          file_url: string | null
          id: string
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "or_materials_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      or_registrations: {
        Row: {
          achievements: string | null
          created_at: string
          current_step: Database["public"]["Enums"]["or_registration_step"]
          id: string
          ig_follow_url: string | null
          ig_mrc_url: string | null
          ktm_url: string | null
          motivation: string | null
          org_experience: string | null
          payment_amount: number | null
          payment_method: string | null
          payment_url: string | null
          photo_url: string | null
          pipeline_status:
            | Database["public"]["Enums"]["or_pipeline_status"]
            | null
          revision_fields: string[] | null
          status: Database["public"]["Enums"]["or_registration_status"]
          submitted_at: string | null
          updated_at: string
          user_id: string
          verification_notes: string | null
          verified_at: string | null
          verified_by: string | null
          year_enrolled: number | null
          yt_sub_url: string | null
        }
        Insert: {
          achievements?: string | null
          created_at?: string
          current_step?: Database["public"]["Enums"]["or_registration_step"]
          id?: string
          ig_follow_url?: string | null
          ig_mrc_url?: string | null
          ktm_url?: string | null
          motivation?: string | null
          org_experience?: string | null
          payment_amount?: number | null
          payment_method?: string | null
          payment_url?: string | null
          photo_url?: string | null
          pipeline_status?:
            | Database["public"]["Enums"]["or_pipeline_status"]
            | null
          revision_fields?: string[] | null
          status?: Database["public"]["Enums"]["or_registration_status"]
          submitted_at?: string | null
          updated_at?: string
          user_id: string
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
          year_enrolled?: number | null
          yt_sub_url?: string | null
        }
        Update: {
          achievements?: string | null
          created_at?: string
          current_step?: Database["public"]["Enums"]["or_registration_step"]
          id?: string
          ig_follow_url?: string | null
          ig_mrc_url?: string | null
          ktm_url?: string | null
          motivation?: string | null
          org_experience?: string | null
          payment_amount?: number | null
          payment_method?: string | null
          payment_url?: string | null
          photo_url?: string | null
          pipeline_status?:
            | Database["public"]["Enums"]["or_pipeline_status"]
            | null
          revision_fields?: string[] | null
          status?: Database["public"]["Enums"]["or_registration_status"]
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
          year_enrolled?: number | null
          yt_sub_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "or_registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "or_registrations_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      or_rolling_internships: {
        Row: {
          assessment: string | null
          created_at: string
          created_by: string
          division_id: string
          end_time: string | null
          group_id: string
          id: string
          is_completed: boolean
          location: string | null
          notes: string | null
          session_date: string
          start_time: string
          updated_at: string
        }
        Insert: {
          assessment?: string | null
          created_at?: string
          created_by: string
          division_id: string
          end_time?: string | null
          group_id: string
          id?: string
          is_completed?: boolean
          location?: string | null
          notes?: string | null
          session_date: string
          start_time: string
          updated_at?: string
        }
        Update: {
          assessment?: string | null
          created_at?: string
          created_by?: string
          division_id?: string
          end_time?: string | null
          group_id?: string
          id?: string
          is_completed?: boolean
          location?: string | null
          notes?: string | null
          session_date?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "or_rolling_internships_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "or_rolling_internships_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "or_rolling_internships_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "or_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      or_settings: {
        Row: {
          description: string | null
          id: number
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: number
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          id?: number
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "or_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      or_task_submissions: {
        Row: {
          feedback: string | null
          grade: number | null
          graded_at: string | null
          graded_by: string | null
          id: string
          submission_url: string | null
          submitted_at: string | null
          task_id: string | null
          user_id: string | null
        }
        Insert: {
          feedback?: string | null
          grade?: number | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          submission_url?: string | null
          submitted_at?: string | null
          task_id?: string | null
          user_id?: string | null
        }
        Update: {
          feedback?: string | null
          grade?: number | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          submission_url?: string | null
          submitted_at?: string | null
          task_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "or_task_submissions_graded_by_fkey"
            columns: ["graded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "or_task_submissions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "or_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "or_task_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      or_tasks: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          material_id: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          material_id?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          material_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "or_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "or_tasks_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "or_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      piket_assignments: {
        Row: {
          assigned_week: number
          created_at: string
          id: string
          period_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_week: number
          created_at?: string
          id?: string
          period_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_week?: number
          created_at?: string
          id?: string
          period_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "piket_assignments_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "piket_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "piket_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      piket_fines: {
        Row: {
          amount: number
          assignment_id: string
          created_at: string
          created_by: string
          id: string
          month_year: string
          paid_at: string | null
          payment_proof_url: string | null
          reason: string
          status: Database["public"]["Enums"]["piket_fine_status"]
          updated_at: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount: number
          assignment_id: string
          created_at?: string
          created_by: string
          id?: string
          month_year: string
          paid_at?: string | null
          payment_proof_url?: string | null
          reason?: string
          status?: Database["public"]["Enums"]["piket_fine_status"]
          updated_at?: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          assignment_id?: string
          created_at?: string
          created_by?: string
          id?: string
          month_year?: string
          paid_at?: string | null
          payment_proof_url?: string | null
          reason?: string
          status?: Database["public"]["Enums"]["piket_fine_status"]
          updated_at?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "piket_fines_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "piket_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "piket_fines_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "piket_fines_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "piket_fines_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      piket_periods: {
        Row: {
          created_at: string
          created_by: string
          end_date: string
          fine_amount: number
          id: string
          is_active: boolean
          name: string
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          end_date: string
          fine_amount?: number
          id?: string
          is_active?: boolean
          name: string
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          end_date?: string
          fine_amount?: number
          id?: string
          is_active?: boolean
          name?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "piket_periods_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      piket_submissions: {
        Row: {
          assignment_id: string
          created_at: string
          id: string
          month_year: string
          notes: string | null
          photo_after_url: string | null
          photo_before_url: string | null
          piket_date: string
          reject_reason: string | null
          status: Database["public"]["Enums"]["piket_submission_status"]
          submitted_at: string
          updated_at: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          assignment_id: string
          created_at?: string
          id?: string
          month_year: string
          notes?: string | null
          photo_after_url?: string | null
          photo_before_url?: string | null
          piket_date: string
          reject_reason?: string | null
          status?: Database["public"]["Enums"]["piket_submission_status"]
          submitted_at?: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          assignment_id?: string
          created_at?: string
          id?: string
          month_year?: string
          notes?: string | null
          photo_after_url?: string | null
          photo_before_url?: string | null
          piket_date?: string
          reject_reason?: string | null
          status?: Database["public"]["Enums"]["piket_submission_status"]
          submitted_at?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "piket_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "piket_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "piket_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "piket_submissions_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address_domicile: string | null
          address_origin: string | null
          avatar_url: string | null
          birth_date: string | null
          birth_place: string | null
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"] | null
          membership_id: string | null
          nickname: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address_domicile?: string | null
          address_origin?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          birth_place?: string | null
          full_name: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          membership_id?: string | null
          nickname?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address_domicile?: string | null
          address_origin?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          birth_place?: string | null
          full_name?: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          membership_id?: string | null
          nickname?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          permission_id: string
          role_id: string
        }
        Insert: {
          permission_id: string
          role_id: string
        }
        Update: {
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      study_programs: {
        Row: {
          created_at: string
          id: string
          major_id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          major_id: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          major_id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_programs_major_id_fkey"
            columns: ["major_id"]
            isOneToOne: false
            referencedRelation: "majors"
            referencedColumns: ["id"]
          },
        ]
      }
      user_blacklist: {
        Row: {
          admin_id: string
          created_at: string
          evidence_url: string | null
          expires_at: string | null
          id: string
          is_permanent: boolean
          reason: string
          user_id: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          evidence_url?: string | null
          expires_at?: string | null
          id?: string
          is_permanent?: boolean
          reason: string
          user_id: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          evidence_url?: string | null
          expires_at?: string | null
          id?: string
          is_permanent?: boolean
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_blacklist_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blacklist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_departments: {
        Row: {
          created_at: string
          department_id: string
          id: string
          position: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department_id: string
          id?: string
          position: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department_id?: string
          id?: string
          position?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_departments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_departments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_divisions: {
        Row: {
          created_at: string
          division_id: string
          id: string
          position: string
          role: Database["public"]["Enums"]["division_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          division_id: string
          id?: string
          position?: string
          role: Database["public"]["Enums"]["division_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          division_id?: string
          id?: string
          position?: string
          role?: Database["public"]["Enums"]["division_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_divisions_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_divisions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_positions: {
        Row: {
          created_at: string | null
          department_id: string | null
          division_id: string | null
          id: string
          position_name: string
          technical_role: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          department_id?: string | null
          division_id?: string | null
          id?: string
          position_name: string
          technical_role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          department_id?: string | null
          division_id?: string | null
          id?: string
          position_name?: string
          technical_role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_positions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_positions_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_by: string | null
          created_at: string
          role_id: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          role_id: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          deleted_at: string | null
          email: string
          id: string
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          email: string
          id?: string
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          email?: string
          id?: string
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_fixed_internship_quota: {
        Args: { p_division_id: string }
        Returns: {
          available: number
          filled: number
          quota: number
        }[]
      }
      cleanup_rejected_users: { Args: never; Returns: undefined }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      generate_audit_summary: {
        Args: {
          p_action: string
          p_new_data: Json
          p_old_data: Json
          p_table_name: string
        }
        Returns: string
      }
      regenerate_piket_schedule: {
        Args: { p_assignments: Json; p_period_id: string }
        Returns: undefined
      }
      replace_user_roles: {
        Args: { p_assigned_by: string; p_role_ids: string[]; p_user_id: string }
        Returns: undefined
      }
      user_has_permission: {
        Args: { p_permission_name: string; p_user_id: string }
        Returns: boolean
      }
      user_has_role: {
        Args: { p_role_name: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      division_role: "mekanik" | "elektrikal" | "programmer"
      gender_type: "L" | "P"
      komdis_attendance_status: "present" | "late" | "absent"
      komdis_event_status: "draft" | "upcoming" | "ongoing" | "completed"
      komdis_reduction_status: "pending" | "approved" | "rejected"
      komdis_sanction_type: "physical" | "points"
      komdis_sp_level: "sp1" | "sp2" | "sp3"
      komdis_sp_status: "draft" | "issued" | "acknowledged" | "revoked"
      komdis_violation_category:
        | "attendance"
        | "discipline"
        | "property"
        | "ethics"
        | "other"
      mrc_event_status:
        | "draft"
        | "registration"
        | "closed"
        | "ongoing"
        | "completed"
        | "cancelled"
      mrc_match_stage:
        | "group_stage"
        | "round_of_16"
        | "quarterfinal"
        | "semifinal"
        | "third_place"
        | "final"
      mrc_match_status: "upcoming" | "live" | "finished"
      mrc_member_role: "captain" | "member" | "advisor"
      mrc_overlay_scene:
        | "none"
        | "match"
        | "scoreboard"
        | "bracket"
        | "standing"
        | "coming_up"
        | "break"
      mrc_payment_status: "pending" | "verified" | "rejected"
      mrc_scan_type: "checkin" | "entry" | "exit" | "match_verify"
      mrc_team_status:
        | "pending"
        | "revision"
        | "documents_verified"
        | "payment_verified"
        | "checked_in"
        | "rejected"
      mrc_timer_mode: "none" | "countdown" | "target_time"
      mrc_timer_status: "stopped" | "running" | "paused"
      or_attendance_status: "present" | "absent" | "excused" | "late" | "sick"
      or_event_mode: "offline" | "online" | "hybrid"
      or_event_status: "draft" | "published" | "completed"
      or_event_type:
        | "demo"
        | "pelatihan"
        | "wawancara"
        | "project"
        | "pelantikan"
        | "lainnya"
      or_group_type: "project" | "internship_rolling"
      or_pipeline_status:
        | "intro_demo"
        | "interview_1_passed"
        | "interview_1_failed"
        | "training"
        | "family_gathering"
        | "project"
        | "interview_2_passed"
        | "interview_2_failed"
        | "internship"
        | "inducted"
        | "blacklisted"
        | "internship_rolling"
        | "internship_fixed"
      or_registration_status:
        | "draft"
        | "submitted"
        | "revision"
        | "accepted"
        | "rejected"
        | "training"
        | "interview_1"
        | "project_phase"
        | "interview_2"
        | "graduated"
      or_registration_step: "biodata" | "documents" | "payment" | "completed"
      piket_fine_status: "unpaid" | "pending_verification" | "paid" | "waived"
      piket_submission_status: "pending" | "approved" | "rejected"
      user_status: "active" | "banned" | "deleted" | "inactive"
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
      division_role: ["mekanik", "elektrikal", "programmer"],
      gender_type: ["L", "P"],
      komdis_attendance_status: ["present", "late", "absent"],
      komdis_event_status: ["draft", "upcoming", "ongoing", "completed"],
      komdis_reduction_status: ["pending", "approved", "rejected"],
      komdis_sanction_type: ["physical", "points"],
      komdis_sp_level: ["sp1", "sp2", "sp3"],
      komdis_sp_status: ["draft", "issued", "acknowledged", "revoked"],
      komdis_violation_category: [
        "attendance",
        "discipline",
        "property",
        "ethics",
        "other",
      ],
      mrc_event_status: [
        "draft",
        "registration",
        "closed",
        "ongoing",
        "completed",
        "cancelled",
      ],
      mrc_match_stage: [
        "group_stage",
        "round_of_16",
        "quarterfinal",
        "semifinal",
        "third_place",
        "final",
      ],
      mrc_match_status: ["upcoming", "live", "finished"],
      mrc_member_role: ["captain", "member", "advisor"],
      mrc_overlay_scene: [
        "none",
        "match",
        "scoreboard",
        "bracket",
        "standing",
        "coming_up",
        "break",
      ],
      mrc_payment_status: ["pending", "verified", "rejected"],
      mrc_scan_type: ["checkin", "entry", "exit", "match_verify"],
      mrc_team_status: [
        "pending",
        "revision",
        "documents_verified",
        "payment_verified",
        "checked_in",
        "rejected",
      ],
      mrc_timer_mode: ["none", "countdown", "target_time"],
      mrc_timer_status: ["stopped", "running", "paused"],
      or_attendance_status: ["present", "absent", "excused", "late", "sick"],
      or_event_mode: ["offline", "online", "hybrid"],
      or_event_status: ["draft", "published", "completed"],
      or_event_type: [
        "demo",
        "pelatihan",
        "wawancara",
        "project",
        "pelantikan",
        "lainnya",
      ],
      or_group_type: ["project", "internship_rolling"],
      or_pipeline_status: [
        "intro_demo",
        "interview_1_passed",
        "interview_1_failed",
        "training",
        "family_gathering",
        "project",
        "interview_2_passed",
        "interview_2_failed",
        "internship",
        "inducted",
        "blacklisted",
        "internship_rolling",
        "internship_fixed",
      ],
      or_registration_status: [
        "draft",
        "submitted",
        "revision",
        "accepted",
        "rejected",
        "training",
        "interview_1",
        "project_phase",
        "interview_2",
        "graduated",
      ],
      or_registration_step: ["biodata", "documents", "payment", "completed"],
      piket_fine_status: ["unpaid", "pending_verification", "paid", "waived"],
      piket_submission_status: ["pending", "approved", "rejected"],
      user_status: ["active", "banned", "deleted", "inactive"],
    },
  },
} as const
