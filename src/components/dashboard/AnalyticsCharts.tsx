import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { format, subMonths, startOfMonth } from "date-fns";
import { he } from "date-fns/locale";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899"];

interface LeadData {
  created_at: string;
  source: string;
  status: string;
}

interface EnrollmentData {
  amount_paid: number | null;
  enrolled_at: string;
  courses: { name: string } | null;
}

export function AnalyticsCharts() {
  const [leads, setLeads] = useState<LeadData[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const sixMonthsAgo = subMonths(new Date(), 6).toISOString();
      const [leadsRes, enrollRes] = await Promise.all([
        supabase.from("leads").select("created_at, source, status").gte("created_at", sixMonthsAgo),
        supabase.from("enrollments").select("amount_paid, enrolled_at, courses(name)").gte("enrolled_at", sixMonthsAgo),
      ]);
      setLeads(leadsRes.data || []);
      setEnrollments((enrollRes.data as unknown as EnrollmentData[]) || []);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const leadsByMonth = useMemo(() => {
    const months: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const key = format(startOfMonth(d), "yyyy-MM");
      months[key] = 0;
    }
    leads.forEach(l => {
      const key = format(new Date(l.created_at), "yyyy-MM");
      if (key in months) months[key]++;
    });
    return Object.entries(months).map(([month, count]) => ({
      month: format(new Date(month + "-01"), "MMM yy", { locale: he }),
      count,
    }));
  }, [leads]);

  const conversionBySource = useMemo(() => {
    const sources: Record<string, { total: number; converted: number }> = {};
    leads.forEach(l => {
      if (!sources[l.source]) sources[l.source] = { total: 0, converted: 0 };
      sources[l.source].total++;
      if (l.status === "Converted") sources[l.source].converted++;
    });
    return Object.entries(sources).map(([source, data]) => ({
      source,
      rate: data.total > 0 ? Math.round((data.converted / data.total) * 100) : 0,
      total: data.total,
    }));
  }, [leads]);

  const revenueByMonth = useMemo(() => {
    const months: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      months[format(startOfMonth(d), "yyyy-MM")] = 0;
    }
    enrollments.forEach(e => {
      const key = format(new Date(e.enrolled_at), "yyyy-MM");
      if (key in months) months[key] += (e.amount_paid || 0);
    });
    return Object.entries(months).map(([month, revenue]) => ({
      month: format(new Date(month + "-01"), "MMM yy", { locale: he }),
      revenue,
    }));
  }, [enrollments]);

  const sourceDistribution = useMemo(() => {
    const sources: Record<string, number> = {};
    leads.forEach(l => { sources[l.source] = (sources[l.source] || 0) + 1; });
    return Object.entries(sources).map(([name, value]) => ({ name, value }));
  }, [leads]);

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Leads by Month */}
      <Card className="theater-card">
        <CardHeader><CardTitle className="text-lg">לידים לפי חודש</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={leadsByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="לידים" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue by Month */}
      <Card className="theater-card">
        <CardHeader><CardTitle className="text-lg">הכנסות לפי חודש</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} formatter={(value: number) => [`₪${value.toLocaleString()}`, "הכנסות"]} />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981" }} name="הכנסות" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Conversion by Source */}
      <Card className="theater-card">
        <CardHeader><CardTitle className="text-lg">אחוז המרה לפי מקור</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={conversionBySource} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} unit="%" />
              <YAxis dataKey="source" type="category" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} width={80} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} formatter={(value: number) => [`${value}%`, "המרה"]} />
              <Bar dataKey="rate" fill="#f59e0b" radius={[0, 4, 4, 0]} name="אחוז המרה" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Source Distribution */}
      <Card className="theater-card">
        <CardHeader><CardTitle className="text-lg">חלוקת לידים לפי מקור</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={sourceDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {sourceDistribution.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
