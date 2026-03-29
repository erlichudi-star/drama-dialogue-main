import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bot, 
  Save, 
  Loader2,
  Check,
  MessageCircle,
  Link,
  Facebook,
  Globe,
  Copy,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const RECOMMENDED_PROMPT = `אתה נציג ידידותי של בית ספר לתיאטרון.

המטרה שלך:
- לעזור ללקוחות למצוא קורס או הצגה מתאימים
- לענות על שאלות לגבי מחירים ותאריכים
- לעודד רישום או רכישת כרטיסים

סגנון:
- עברית טבעית וחמה
- תשובות קצרות (2-4 משפטים)
- אימוג'ים: 🎭✨🎫
- תמיד להציע את הצעד הבא

הפניה לנציג אנושי:
- קודם כל תנסה לענות בעצמך על כל שאלה מהמידע שברשותך
- אם אין לך מידע מספיק, הלקוח מבקש לדבר עם מישהו, או שיש שאלה מורכבת - הצע שיחה טלפונית עם מספר הטלפון ליצירת קשר
- ההפניה צריכה להרגיש טבעית, לא דוחפנית
- אל תפנה לטלפון בהודעה הראשונה - קודם נסה לעזור`;

export default function Settings() {
  const [whapiToken, setWhapiToken] = useState("");
  const [whapiChannelId, setWhapiChannelId] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [facebookVerifyToken, setFacebookVerifyToken] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const baseUrl = import.meta.env.VITE_SUPABASE_URL;

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase.from("settings").select("key, value");
        if (error) throw error;

        data?.forEach((setting) => {
          switch (setting.key) {
            case "whapi_token": setWhapiToken(setting.value); break;
            case "whapi_channel_id": setWhapiChannelId(setting.value); break;
            case "system_prompt": setSystemPrompt(setting.value); break;
            case "contact_phone": setContactPhone(setting.value); break;
            case "facebook_verify_token": setFacebookVerifyToken(setting.value); break;
          }
        });
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast.error("שגיאה בטעינת ההגדרות");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates = [
        { key: "whapi_token", value: whapiToken },
        { key: "whapi_channel_id", value: whapiChannelId },
        { key: "system_prompt", value: systemPrompt },
        { key: "contact_phone", value: contactPhone },
        { key: "facebook_verify_token", value: facebookVerifyToken },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from("settings")
          .upsert({ key: update.key, value: update.value }, { onConflict: "key" });
        if (error) throw error;
      }

      toast.success("ההגדרות נשמרו בהצלחה!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("שגיאה בשמירת ההגדרות");
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("הועתק ללוח!");
  };

  const loadRecommendedPrompt = () => {
    setSystemPrompt(RECOMMENDED_PROMPT);
    toast.success("הפרומפט המומלץ נטען!");
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">הגדרות</h1>
            <p className="mt-1 text-muted-foreground">הגדר את האינטגרציות והתנהגות ה-AI</p>
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90">
            {isSaving ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Save className="ml-2 h-4 w-4" />}
            שמור שינויים
          </Button>
        </div>

        <Tabs defaultValue="integrations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-none lg:flex">
            <TabsTrigger value="integrations">אינטגרציות</TabsTrigger>
            <TabsTrigger value="ai">הגדרות AI</TabsTrigger>
            <TabsTrigger value="webhooks">מדריך חיבור</TabsTrigger>
          </TabsList>

          <TabsContent value="integrations" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Whapi Integration */}
              <Card className="theater-card">
                <CardHeader>
                  <CardTitle className="font-display text-xl flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-emerald-400" />
                    WhatsApp (Whapi)
                    {whapiToken ? (
                      <Badge variant="outline" className="mr-auto bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                        <Check className="ml-1 h-3 w-3" />מחובר
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="mr-auto bg-amber-500/10 text-amber-400 border-amber-500/30">לא מוגדר</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>שליחה וקבלת הודעות וואטסאפ</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>API Token</Label>
                    <Input 
                      type="password" 
                      placeholder="ה-API Token שלך מ-Whapi" 
                      value={whapiToken} 
                      onChange={(e) => setWhapiToken(e.target.value)} 
                      className="bg-muted/50" 
                      dir="ltr" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Channel ID (מזהה ערוץ)</Label>
                    <Input 
                      placeholder="לדוגמה: ABCDEF-GHIJK" 
                      value={whapiChannelId} 
                      onChange={(e) => setWhapiChannelId(e.target.value)} 
                      className="bg-muted/50" 
                      dir="ltr" 
                    />
                    <p className="text-xs text-muted-foreground">
                      ⚠️ חשוב! הגדר את ה-Channel ID כדי לקבל הודעות רק מהמספר שלך
                    </p>
                  </div>
                  <a 
                    href="https://panel.whapi.cloud" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    קבל Token מ-Whapi
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </CardContent>
              </Card>

              {/* Facebook Integration */}
              <Card className="theater-card">
                <CardHeader>
                  <CardTitle className="font-display text-xl flex items-center gap-2">
                    <Facebook className="h-5 w-5 text-blue-400" />
                    Facebook Lead Ads
                    {facebookVerifyToken ? (
                      <Badge variant="outline" className="mr-auto bg-blue-500/10 text-blue-400 border-blue-500/30">
                        <Check className="ml-1 h-3 w-3" />מוגדר
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="mr-auto bg-amber-500/10 text-amber-400 border-amber-500/30">לא מוגדר</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>קבלת לידים מפרסום בפייסבוק</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Verify Token</Label>
                    <Input 
                      placeholder="טוקן אימות לפייסבוק (בחר מילה כלשהי)" 
                      value={facebookVerifyToken} 
                      onChange={(e) => setFacebookVerifyToken(e.target.value)} 
                      className="bg-muted/50" 
                      dir="ltr" 
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    בחר טוקן אימות כלשהו (לדוגמה: my_secret_token) והשתמש בו בהגדרות ה-Webhook בפייסבוק
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ai" className="space-y-6">
            <Card className="theater-card">
              <CardHeader>
                <CardTitle className="font-display text-xl flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  System Prompt
                </CardTitle>
                <CardDescription>הגדר את האישיות וההתנהגות של עוזר ה-AI</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>הפרומפט</Label>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={loadRecommendedPrompt}
                      className="gap-2"
                    >
                      <Sparkles className="h-3 w-3" />
                      טען פרומפט מומלץ
                    </Button>
                  </div>
                  <Textarea 
                    placeholder="הגדר את אישיות ה-AI..." 
                    value={systemPrompt} 
                    onChange={(e) => setSystemPrompt(e.target.value)} 
                    className="min-h-[250px] bg-muted/50" 
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  הפרומפט הזה מגדיר איך ה-AI מגיב ללקוחות. כלול מידע על טון, מטרות ומגבלות.
                </p>
              </CardContent>
            </Card>

            <Card className="theater-card">
              <CardHeader>
                <CardTitle className="font-display text-xl flex items-center gap-2">
                  📞 מספר טלפון ליצירת קשר
                </CardTitle>
                <CardDescription>המספר שהבוט ימסור ללקוחות כשצריך הפניה לנציג אנושי</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>מספר טלפון</Label>
                  <Input
                    placeholder="לדוגמה: 054-1234567"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="bg-muted/50"
                    dir="ltr"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  כשהבוט לא יכול לענות על שאלה או שהלקוח מבקש נציג אנושי, הבוט יציע ליצור קשר במספר הזה.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-6">
            {/* Webhook URLs */}
            <Card className="theater-card">
              <CardHeader>
                <CardTitle className="font-display text-xl flex items-center gap-2">
                  <Link className="h-5 w-5 text-primary" />
                  כתובות Webhook
                </CardTitle>
                <CardDescription>העתק את הכתובות האלה להגדרת האינטגרציות</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* WhatsApp Webhook */}
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-emerald-400 flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp (Whapi)
                    </p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => copyToClipboard(`${baseUrl}/functions/v1/webhook-whapi`)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <code className="block text-xs text-muted-foreground break-all" dir="ltr">
                    {`${baseUrl}/functions/v1/webhook-whapi`}
                  </code>
                </div>

                {/* Facebook Webhook */}
                <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-blue-400 flex items-center gap-2">
                      <Facebook className="h-4 w-4" />
                      Facebook Lead Ads
                    </p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => copyToClipboard(`${baseUrl}/functions/v1/webhook-facebook`)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <code className="block text-xs text-muted-foreground break-all" dir="ltr">
                    {`${baseUrl}/functions/v1/webhook-facebook`}
                  </code>
                </div>

                {/* Elementor Webhook */}
                <div className="rounded-lg bg-purple-500/10 border border-purple-500/30 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-purple-400 flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Elementor / Website Forms
                    </p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => copyToClipboard(`${baseUrl}/functions/v1/webhook-elementor`)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <code className="block text-xs text-muted-foreground break-all" dir="ltr">
                    {`${baseUrl}/functions/v1/webhook-elementor`}
                  </code>
                </div>
              </CardContent>
            </Card>

            {/* Setup Guides */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Whapi Guide */}
              <Card className="theater-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-emerald-400" />
                    הגדרת Whapi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                    <li>היכנס ל-panel.whapi.cloud</li>
                    <li>צור ערוץ חדש וחבר את הטלפון</li>
                    <li>העתק את ה-API Token לכאן</li>
                    <li>לך ל-Settings → Webhooks</li>
                    <li>הוסף את ה-URL מלמעלה</li>
                    <li>בחר אירוע: <code className="text-xs bg-muted px-1 rounded">messages</code></li>
                  </ol>
                </CardContent>
              </Card>

              {/* Facebook Guide */}
              <Card className="theater-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Facebook className="h-5 w-5 text-blue-400" />
                    הגדרת Facebook
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                    <li>היכנס ל-developers.facebook.com</li>
                    <li>צור אפליקציה חדשה</li>
                    <li>הוסף מוצר: Webhooks</li>
                    <li>הגדר את ה-Callback URL</li>
                    <li>הזן את ה-Verify Token שבחרת</li>
                    <li>הירשם ל-leadgen עבור הדף שלך</li>
                  </ol>
                </CardContent>
              </Card>

              {/* Elementor Guide */}
              <Card className="theater-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Globe className="h-5 w-5 text-purple-400" />
                    הגדרת אלמנטור
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                    <li>ערוך את הטופס באלמנטור</li>
                    <li>Actions After Submit → Add</li>
                    <li>בחר: Webhook</li>
                    <li>הדבק את ה-URL מלמעלה</li>
                    <li>וודא שדות: name, phone, email</li>
                    <li>שמור ופרסם את הדף</li>
                  </ol>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
