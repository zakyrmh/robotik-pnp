export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      achievements: {
        Row: {
          created_at: string;
          description: string | null;
          division_id: string | null;
          id: string;
          level: string;
          title: string;
          year: number;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          division_id?: string | null;
          id?: string;
          level: string;
          title: string;
          year: number;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          division_id?: string | null;
          id?: string;
          level?: string;
          title?: string;
          year?: number;
        };
        Relationships: [
          {
            foreignKeyName: "achievements_division_id_fkey";
            columns: ["division_id"];
            isOneToOne: false;
            referencedRelation: "divisions";
            referencedColumns: ["id"];
          },
        ];
      };
      activities: {
        Row: {
          banner_url: string | null;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          description: string | null;
          end_date: string;
          id: string;
          location: string | null;
          start_date: string;
          target_audience: Database["public"]["Enums"]["activity_target"];
          title: string;
          updated_at: string;
        };
        Insert: {
          banner_url?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          end_date: string;
          id?: string;
          location?: string | null;
          start_date: string;
          target_audience?: Database["public"]["Enums"]["activity_target"];
          title: string;
          updated_at?: string;
        };
        Update: {
          banner_url?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          description?: string | null;
          end_date?: string;
          id?: string;
          location?: string | null;
          start_date?: string;
          target_audience?: Database["public"]["Enums"]["activity_target"];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activities_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      articles: {
        Row: {
          author_id: string;
          category: string;
          content: string;
          cover_image_url: string | null;
          created_at: string;
          deleted_at: string | null;
          excerpt: string | null;
          id: string;
          is_published: boolean;
          published_at: string | null;
          slug: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          author_id: string;
          category: string;
          content: string;
          cover_image_url?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          excerpt?: string | null;
          id?: string;
          is_published?: boolean;
          published_at?: string | null;
          slug: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          author_id?: string;
          category?: string;
          content?: string;
          cover_image_url?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          excerpt?: string | null;
          id?: string;
          is_published?: boolean;
          published_at?: string | null;
          slug?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "articles_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      attendances: {
        Row: {
          activity_id: string | null;
          check_in_at: string | null;
          created_at: string | null;
          id: string;
          notes: string | null;
          profile_id: string | null;
          proof_url: string | null;
          status: Database["public"]["Enums"]["attendance_status"];
          verified_by: string | null;
        };
        Insert: {
          activity_id?: string | null;
          check_in_at?: string | null;
          created_at?: string | null;
          id?: string;
          notes?: string | null;
          profile_id?: string | null;
          proof_url?: string | null;
          status?: Database["public"]["Enums"]["attendance_status"];
          verified_by?: string | null;
        };
        Update: {
          activity_id?: string | null;
          check_in_at?: string | null;
          created_at?: string | null;
          id?: string;
          notes?: string | null;
          profile_id?: string | null;
          proof_url?: string | null;
          status?: Database["public"]["Enums"]["attendance_status"];
          verified_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "attendances_activity_id_fkey";
            columns: ["activity_id"];
            isOneToOne: false;
            referencedRelation: "activities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendances_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendances_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      caang_groups: {
        Row: {
          created_at: string | null;
          id: string;
          mentor_id: string | null;
          name: string;
          parent_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          mentor_id?: string | null;
          name: string;
          parent_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          mentor_id?: string | null;
          name?: string;
          parent_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "caang_groups_mentor_id_fkey";
            columns: ["mentor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "caang_groups_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "caang_groups";
            referencedColumns: ["id"];
          },
        ];
      };
      contact_messages: {
        Row: {
          category: string;
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          message: string;
          organization: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          category: string;
          created_at?: string;
          email: string;
          full_name: string;
          id?: string;
          message: string;
          organization?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          email?: string;
          full_name?: string;
          id?: string;
          message?: string;
          organization?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      departments: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          sort_order: number | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          sort_order?: number | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          sort_order?: number | null;
        };
        Relationships: [];
      };
      divisions: {
        Row: {
          accent_color: string | null;
          badge_color: string | null;
          badge_label: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          is_active: boolean;
          name: string;
          short_description: string;
          slug: string;
          sort_order: number | null;
          tags: Json;
        };
        Insert: {
          accent_color?: string | null;
          badge_color?: string | null;
          badge_label?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          short_description: string;
          slug: string;
          sort_order?: number | null;
          tags?: Json;
        };
        Update: {
          accent_color?: string | null;
          badge_color?: string | null;
          badge_label?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          short_description?: string;
          slug?: string;
          sort_order?: number | null;
          tags?: Json;
        };
        Relationships: [];
      };
      group_members: {
        Row: {
          group_id: string | null;
          id: string;
          joined_at: string | null;
          profile_id: string | null;
        };
        Insert: {
          group_id?: string | null;
          id?: string;
          joined_at?: string | null;
          profile_id?: string | null;
        };
        Update: {
          group_id?: string | null;
          id?: string;
          joined_at?: string | null;
          profile_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "caang_groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "group_members_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      internships: {
        Row: {
          created_at: string | null;
          division_id: string | null;
          id: string;
          mentor_id: string | null;
          profile_id: string | null;
          task_description: string | null;
        };
        Insert: {
          created_at?: string | null;
          division_id?: string | null;
          id?: string;
          mentor_id?: string | null;
          profile_id?: string | null;
          task_description?: string | null;
        };
        Update: {
          created_at?: string | null;
          division_id?: string | null;
          id?: string;
          mentor_id?: string | null;
          profile_id?: string | null;
          task_description?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "internships_division_id_fkey";
            columns: ["division_id"];
            isOneToOne: false;
            referencedRelation: "divisions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "internships_mentor_id_fkey";
            columns: ["mentor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "internships_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      legacy_members: {
        Row: {
          created_at: string | null;
          division: string | null;
          full_name: string;
          gender: string | null;
          nim: string;
          profile_id: string | null;
          study_program_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          division?: string | null;
          full_name: string;
          gender?: string | null;
          nim: string;
          profile_id?: string | null;
          study_program_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          division?: string | null;
          full_name?: string;
          gender?: string | null;
          nim?: string;
          profile_id?: string | null;
          study_program_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "legacy_members_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "legacy_members_study_program_id_fkey";
            columns: ["study_program_id"];
            isOneToOne: false;
            referencedRelation: "study_programs";
            referencedColumns: ["id"];
          },
        ];
      };
      majors: {
        Row: {
          created_at: string | null;
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      membership_periods: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          period_name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          period_name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          period_name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      or_settings: {
        Row: {
          biaya_pendaftaran: number;
          created_at: string | null;
          id: string;
          kontak_panitia: Json;
          link_komunitas: Json;
          periode_recruitment: string;
          rekening_penerima: Json;
          status_pendaftaran: boolean;
          tanggal_mulai: string | null;
          tanggal_selesai: string | null;
          timeline: Json;
          updated_at: string | null;
        };
        Insert: {
          biaya_pendaftaran?: number;
          created_at?: string | null;
          id?: string;
          kontak_panitia?: Json;
          link_komunitas?: Json;
          periode_recruitment?: string;
          rekening_penerima?: Json;
          status_pendaftaran?: boolean;
          tanggal_mulai?: string | null;
          tanggal_selesai?: string | null;
          timeline?: Json;
          updated_at?: string | null;
        };
        Update: {
          biaya_pendaftaran?: number;
          created_at?: string | null;
          id?: string;
          kontak_panitia?: Json;
          link_komunitas?: Json;
          periode_recruitment?: string;
          rekening_penerima?: Json;
          status_pendaftaran?: boolean;
          tanggal_mulai?: string | null;
          tanggal_selesai?: string | null;
          timeline?: Json;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      organizational_histories: {
        Row: {
          created_at: string;
          department_id: string;
          division_id: string | null;
          id: string;
          nim_member: string;
          period_id: string;
          role_name: string;
          sort_order: number | null;
          sub_section: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          department_id: string;
          division_id?: string | null;
          id?: string;
          nim_member: string;
          period_id: string;
          role_name: string;
          sort_order?: number | null;
          sub_section?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          department_id?: string;
          division_id?: string | null;
          id?: string;
          nim_member?: string;
          period_id?: string;
          role_name?: string;
          sort_order?: number | null;
          sub_section?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "org_histories_department_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "org_histories_division_fkey";
            columns: ["division_id"];
            isOneToOne: false;
            referencedRelation: "divisions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "org_histories_member_fkey";
            columns: ["nim_member"];
            isOneToOne: false;
            referencedRelation: "legacy_members";
            referencedColumns: ["nim"];
          },
          {
            foreignKeyName: "org_histories_period_fkey";
            columns: ["period_id"];
            isOneToOne: false;
            referencedRelation: "membership_periods";
            referencedColumns: ["id"];
          },
        ];
      };
      piket_logs: {
        Row: {
          created_at: string | null;
          duty_date: string;
          id: string;
          is_verified: boolean | null;
          notes: string;
          proof_image_url: string;
          reported_by: string | null;
          schedule_id: string | null;
          verified_by: string | null;
        };
        Insert: {
          created_at?: string | null;
          duty_date?: string;
          id?: string;
          is_verified?: boolean | null;
          notes: string;
          proof_image_url: string;
          reported_by?: string | null;
          schedule_id?: string | null;
          verified_by?: string | null;
        };
        Update: {
          created_at?: string | null;
          duty_date?: string;
          id?: string;
          is_verified?: boolean | null;
          notes?: string;
          proof_image_url?: string;
          reported_by?: string | null;
          schedule_id?: string | null;
          verified_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "piket_logs_reported_by_fkey";
            columns: ["reported_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "piket_logs_schedule_id_fkey";
            columns: ["schedule_id"];
            isOneToOne: false;
            referencedRelation: "piket_schedules";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "piket_logs_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      piket_members: {
        Row: {
          id: string;
          profile_id: string | null;
          schedule_id: string | null;
        };
        Insert: {
          id?: string;
          profile_id?: string | null;
          schedule_id?: string | null;
        };
        Update: {
          id?: string;
          profile_id?: string | null;
          schedule_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "piket_members_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "piket_members_schedule_id_fkey";
            columns: ["schedule_id"];
            isOneToOne: false;
            referencedRelation: "piket_schedules";
            referencedColumns: ["id"];
          },
        ];
      };
      piket_schedules: {
        Row: {
          created_at: string | null;
          day: Database["public"]["Enums"]["piket_day"];
          id: string;
        };
        Insert: {
          created_at?: string | null;
          day: Database["public"]["Enums"]["piket_day"];
          id?: string;
        };
        Update: {
          created_at?: string | null;
          day?: Database["public"]["Enums"]["piket_day"];
          id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          is_onboarded: boolean;
          nim: string | null;
          role: Database["public"]["Enums"]["user_role"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          id: string;
          is_onboarded?: boolean;
          nim?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          is_onboarded?: boolean;
          nim?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Relationships: [];
      };
      registrations: {
        Row: {
          achievements: string | null;
          created_at: string | null;
          current_class: string | null;
          delete_reason: string | null;
          deleted_at: string | null;
          dob: string;
          domicile_address: string;
          entry_year: number;
          full_name: string;
          gender: Database["public"]["Enums"]["gender_type"];
          high_school: string | null;
          id: string;
          ktm_url: string | null;
          motivation: string | null;
          nickname: string;
          org_experience: string | null;
          origin_address: string;
          payment_method: string | null;
          payment_proof_url: string | null;
          phone_number: string;
          photo_url: string | null;
          pob: string;
          profile_id: string;
          proof_follow_mrc: string | null;
          proof_follow_robotik: string | null;
          proof_sub_yt: string | null;
          status: Database["public"]["Enums"]["reg_status"] | null;
          study_program_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          achievements?: string | null;
          created_at?: string | null;
          current_class?: string | null;
          delete_reason?: string | null;
          deleted_at?: string | null;
          dob: string;
          domicile_address: string;
          entry_year: number;
          full_name: string;
          gender: Database["public"]["Enums"]["gender_type"];
          high_school?: string | null;
          id?: string;
          ktm_url?: string | null;
          motivation?: string | null;
          nickname: string;
          org_experience?: string | null;
          origin_address: string;
          payment_method?: string | null;
          payment_proof_url?: string | null;
          phone_number: string;
          photo_url?: string | null;
          pob: string;
          profile_id: string;
          proof_follow_mrc?: string | null;
          proof_follow_robotik?: string | null;
          proof_sub_yt?: string | null;
          status?: Database["public"]["Enums"]["reg_status"] | null;
          study_program_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          achievements?: string | null;
          created_at?: string | null;
          current_class?: string | null;
          delete_reason?: string | null;
          deleted_at?: string | null;
          dob?: string;
          domicile_address?: string;
          entry_year?: number;
          full_name?: string;
          gender?: Database["public"]["Enums"]["gender_type"];
          high_school?: string | null;
          id?: string;
          ktm_url?: string | null;
          motivation?: string | null;
          nickname?: string;
          org_experience?: string | null;
          origin_address?: string;
          payment_method?: string | null;
          payment_proof_url?: string | null;
          phone_number?: string;
          photo_url?: string | null;
          pob?: string;
          profile_id?: string;
          proof_follow_mrc?: string | null;
          proof_follow_robotik?: string | null;
          proof_sub_yt?: string | null;
          status?: Database["public"]["Enums"]["reg_status"] | null;
          study_program_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "registrations_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "registrations_study_program_id_fkey";
            columns: ["study_program_id"];
            isOneToOne: false;
            referencedRelation: "study_programs";
            referencedColumns: ["id"];
          },
        ];
      };
      study_programs: {
        Row: {
          created_at: string | null;
          degree: string;
          id: string;
          major_id: string;
          name: string;
        };
        Insert: {
          created_at?: string | null;
          degree: string;
          id?: string;
          major_id: string;
          name: string;
        };
        Update: {
          created_at?: string | null;
          degree?: string;
          id?: string;
          major_id?: string;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "study_programs_major_id_fkey";
            columns: ["major_id"];
            isOneToOne: false;
            referencedRelation: "majors";
            referencedColumns: ["id"];
          },
        ];
      };
      task_submissions: {
        Row: {
          created_at: string | null;
          feedback: string | null;
          grade: number | null;
          graded_by: string | null;
          id: string;
          notes: string | null;
          profile_id: string | null;
          status: Database["public"]["Enums"]["task_status"] | null;
          submission_url: string | null;
          task_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          feedback?: string | null;
          grade?: number | null;
          graded_by?: string | null;
          id?: string;
          notes?: string | null;
          profile_id?: string | null;
          status?: Database["public"]["Enums"]["task_status"] | null;
          submission_url?: string | null;
          task_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          feedback?: string | null;
          grade?: number | null;
          graded_by?: string | null;
          id?: string;
          notes?: string | null;
          profile_id?: string | null;
          status?: Database["public"]["Enums"]["task_status"] | null;
          submission_url?: string | null;
          task_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "task_submissions_graded_by_fkey";
            columns: ["graded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_submissions_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_submissions_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
        ];
      };
      tasks: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          description: string;
          due_date: string;
          id: string;
          title: string;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          description: string;
          due_date: string;
          id?: string;
          title: string;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          description?: string;
          due_date?: string;
          id?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      check_legacy_member: {
        Args: { input_nim: string };
        Returns: {
          is_legacy: boolean;
          member_data: Json;
        }[];
      };
      get_my_role: {
        Args: never;
        Returns: Database["public"]["Enums"]["user_role"];
      };
      promote_legacy_member_to_anggota: {
        Args: { input_nim: string; user_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      activity_target: "caang" | "anggota";
      attendance_status: "hadir" | "izin" | "sakit" | "alfa" | "telat";
      gender_type: "L" | "P";
      piket_day:
        | "Senin"
        | "Selasa"
        | "Rabu"
        | "Kamis"
        | "Jumat"
        | "Sabtu"
        | "Minggu";
      reg_status: "process" | "pending" | "verified" | "rejected";
      task_status: "belum_selesai" | "diperiksa" | "selesai" | "revisi";
      user_role:
        | "super-admin"
        | "admin-or"
        | "admin-komdis"
        | "anggota"
        | "caang";
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      activity_target: ["caang", "anggota"],
      attendance_status: ["hadir", "izin", "sakit", "alfa", "telat"],
      gender_type: ["L", "P"],
      piket_day: [
        "Senin",
        "Selasa",
        "Rabu",
        "Kamis",
        "Jumat",
        "Sabtu",
        "Minggu",
      ],
      reg_status: ["process", "pending", "verified", "rejected"],
      task_status: ["belum_selesai", "diperiksa", "selesai", "revisi"],
      user_role: [
        "super-admin",
        "admin-or",
        "admin-komdis",
        "anggota",
        "caang",
      ],
    },
  },
} as const;
