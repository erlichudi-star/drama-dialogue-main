// EventAgent TypeScript interfaces

export interface EAEvent {
  id: string;
  cpt_type: string;
  title: string;
  event_date: string | null;
  location: string | null;
  price: number | null;
  early_bird_price: number | null;
  url: string | null;
  image_url: string | null;
  extra_fields: Record<string, unknown>;
  synced_at: string | null;
  created_at: string;
}

export interface EATemplateStep {
  days_before: number;
  phase: string;
  platforms: string[];
  content_hint: string;
}

export interface EACampaignTemplate {
  id: string;
  cpt_type: string;
  name: string;
  steps: EATemplateStep[];
  created_at: string;
  updated_at: string;
}

export interface EACampaign {
  id: string;
  event_id: string;
  template_id: string | null;
  status: 'active' | 'paused' | 'completed';
  created_at: string;
  updated_at: string;
  // joined
  event?: EAEvent;
  template?: EACampaignTemplate;
}

export interface EAScheduledPost {
  id: string;
  campaign_id: string | null;
  event_id: string | null;
  target_date: string;
  phase: string | null;
  platforms: string[];
  content_email: string | null;
  content_facebook: string | null;
  content_instagram: string | null;
  content_whatsapp: string | null;
  status: 'pending' | 'approved' | 'published' | 'rejected';
  approved_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  // joined
  event?: EAEvent;
}

export interface EALog {
  id: string;
  log_type: 'system' | 'publication';
  level: 'success' | 'error' | 'info';
  source: string | null;
  message: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ConnectionStatusItem {
  name: string;
  key: string;
  connected: boolean;
  label: string;
}
