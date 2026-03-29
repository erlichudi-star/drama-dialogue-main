import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Scrape events from a URL using Firecrawl + AI
export async function scrapeEvents(url: string): Promise<{ success: boolean; created?: number; updated?: number; total?: number; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('ea-scrape-events', {
      body: { url },
    });
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('scrapeEvents error:', err);
    return { success: false, error: 'שגיאה בסריקה' };
  }
}

// Generate a full campaign from event + template
export async function generateCampaign(event_id: string, template_id?: string): Promise<{ success: boolean; campaign_id?: string; posts_created?: number; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('ea-generate-campaign', {
      body: { event_id, template_id },
    });
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('generateCampaign error:', err);
    return { success: false, error: 'שגיאה ביצירת קמפיין' };
  }
}

// Generate AI content for a specific post
export async function generatePostContent(post_id: string, platform?: string): Promise<{ success: boolean; content?: Record<string, string>; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('ea-generate-campaign', {
      body: { post_id, platform },
    });
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('generatePostContent error:', err);
    return { success: false, error: 'שגיאה ביצירת תוכן' };
  }
}

// Save EA settings to DB
export async function saveEASetting(key: string, value: string): Promise<void> {
  const { data: existing } = await supabase
    .from('settings')
    .select('id')
    .eq('key', key)
    .maybeSingle();

  if (existing) {
    await supabase.from('settings').update({ value, updated_at: new Date().toISOString() }).eq('id', existing.id);
  } else {
    await supabase.from('settings').insert({ key, value });
  }
}

// Load EA settings from DB
export async function loadEASettings(): Promise<Record<string, string>> {
  const { data } = await supabase
    .from('settings')
    .select('key, value')
    .like('key', 'ea_%');

  const result: Record<string, string> = {};
  if (data) {
    for (const row of data) {
      result[row.key] = row.value;
    }
  }
  return result;
}

// Reuses existing Whapi connection via the send-proactive-message edge function
export async function sendViaWhapi(phone: string, text: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('send-proactive-message', {
      body: { leadId: null, message: text, phone, type: 'whatsapp' },
    });
    if (error) throw error;
    toast({ title: 'הודעה נשלחה', description: 'הודעת WhatsApp נשלחה בהצלחה' });
    return true;
  } catch (err) {
    console.error('sendViaWhapi error:', err);
    toast({ title: 'שגיאה', description: 'שליחת ההודעה נכשלה', variant: 'destructive' });
    return false;
  }
}
