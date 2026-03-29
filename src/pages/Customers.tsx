import { useState, useEffect, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CustomerForm } from "@/components/customers/CustomerForm";
import { EnrollCustomerDialog } from "@/components/customers/EnrollCustomerDialog";
import { AddColumnDialog } from "@/components/customers/AddColumnDialog";
import { CustomerDetailSheet } from "@/components/customers/CustomerDetailSheet";
import { SendMessageDialog } from "@/components/customers/SendMessageDialog";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useCustomers, Customer } from "@/hooks/useCustomers";
import { useCustomColumns } from "@/hooks/useCustomColumns";
import { useLeads } from "@/hooks/useLeads";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, isAfter, subMonths } from "date-fns";
import { he } from "date-fns/locale";
import {
  Plus,
  Search,
  MoreHorizontal,
  UserPlus,
  GraduationCap,
  Trash2,
  Edit,
  Columns,
  RefreshCw,
  Users,
  TrendingUp,
  BookOpen,
  DollarSign,
  MessageSquare,
  Phone,
  Eye,
} from "lucide-react";

export default function Customers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isConvertLeadOpen, setIsConvertLeadOpen] = useState(false);
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
  const [isSendMessageOpen, setIsSendMessageOpen] = useState(false);
  const [messageCustomer, setMessageCustomer] = useState<Customer | null>(null);

  // Stats
  const [enrollmentCount, setEnrollmentCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  const { customers, isLoading, fetchCustomers, createCustomer, convertLeadToCustomer, updateCustomer, deleteCustomer } = useCustomers();
  const { leads } = useLeads();
  const { columns, values, fetchColumns, fetchValues, createColumn, updateValue } = useCustomColumns("customer");

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { count } = await supabase
          .from("enrollments")
          .select("*", { count: "exact", head: true });
        setEnrollmentCount(count || 0);

        const { data: revData } = await supabase
          .from("enrollments")
          .select("amount_paid");
        const total = (revData || []).reduce((sum, e) => sum + (Number(e.amount_paid) || 0), 0);
        setTotalRevenue(total);
      } catch (e) {
        console.error("Error fetching stats:", e);
      }
    };
    fetchStats();
  }, [customers]);

  useEffect(() => {
    fetchColumns();
  }, [fetchColumns]);

  useEffect(() => {
    if (customers.length > 0) {
      fetchValues(customers.map((c) => c.id));
    }
  }, [customers, fetchValues]);

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unconvertedLeads = leads.filter((lead) => lead.status !== "Converted");

  const newThisMonth = useMemo(() => {
    const oneMonthAgo = subMonths(new Date(), 1);
    return customers.filter((c) => isAfter(new Date(c.created_at), oneMonthAgo)).length;
  }, [customers]);

  const handleCreateCustomer = async (data: { name: string; phone: string; email?: string; notes?: string }) => {
    try {
      setIsSubmitting(true);
      await createCustomer(data);
      setIsAddCustomerOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConvertLead = async (leadId: string) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;
    try {
      setIsSubmitting(true);
      await convertLeadToCustomer(lead);
      setIsConvertLeadOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDetail = (customer: Customer) => {
    setDetailCustomer(customer);
    setIsDetailOpen(true);
  };

  const openSendMessage = (customer: Customer) => {
    setMessageCustomer(customer);
    setIsSendMessageOpen(true);
  };

  return (
    <MainLayout>
      <div className="animate-fade-in space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              ניהול לקוחות
            </h1>
            <p className="mt-1 text-muted-foreground">
              {customers.length} לקוחות במערכת
            </p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <Button variant="outline" size="sm" onClick={() => setIsAddColumnOpen(true)}>
              <Columns className="ml-2 h-4 w-4" />
              עמודה חדשה
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConvertLeadOpen(true)}
              disabled={unconvertedLeads.length === 0}
            >
              <UserPlus className="ml-2 h-4 w-4" />
              המר ליד ({unconvertedLeads.length})
            </Button>
            <Button size="sm" onClick={() => setIsAddCustomerOpen(true)}>
              <Plus className="ml-2 h-4 w-4" />
              לקוח חדש
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="סה״כ לקוחות" value={customers.length} icon={Users} />
          <StatsCard title="חדשים החודש" value={newThisMonth} icon={TrendingUp} />
          <StatsCard title="רשומים לקורסים" value={enrollmentCount} icon={BookOpen} />
          <StatsCard title="סה״כ הכנסות" value={`₪${totalRevenue.toLocaleString()}`} icon={DollarSign} />
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="חיפוש לפי שם, טלפון או אימייל..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border bg-card">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">שם</TableHead>
                  <TableHead className="text-right">טלפון</TableHead>
                  <TableHead className="text-right">אימייל</TableHead>
                  <TableHead className="text-right">תגיות</TableHead>
                  <TableHead className="text-right">נוצר</TableHead>
                  {columns.map((col) => (
                    <TableHead key={col.id} className="text-right">
                      {col.column_label}
                    </TableHead>
                  ))}
                  <TableHead className="text-right w-[100px]">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6 + columns.length}
                      className="h-32 text-center text-muted-foreground"
                    >
                      {searchQuery ? "לא נמצאו לקוחות" : "אין לקוחות עדיין"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow
                      key={customer.id}
                      className="cursor-pointer hover:bg-muted/30"
                      onClick={() => openDetail(customer)}
                    >
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell dir="ltr" className="text-right">{customer.phone}</TableCell>
                      <TableCell>{customer.email || "-"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {customer.tags?.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                          )) || "-"}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDistanceToNow(new Date(customer.created_at), {
                          addSuffix: true,
                          locale: he,
                        })}
                      </TableCell>
                      {columns.map((col) => (
                        <TableCell key={col.id} onClick={(e) => e.stopPropagation()}>
                          <Input
                            value={values[customer.id]?.[col.id] || ""}
                            onChange={(e) => updateValue(customer.id, col.id, e.target.value)}
                            className="h-8 text-sm"
                            placeholder="-"
                          />
                        </TableCell>
                      ))}
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openDetail(customer)}>
                              <Eye className="ml-2 h-4 w-4" />
                              צפה בפרופיל
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openSendMessage(customer)}>
                              <MessageSquare className="ml-2 h-4 w-4" />
                              שלח הודעה
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <a href={`tel:${customer.phone.replace(/[^0-9+]/g, "")}`}>
                                <Phone className="ml-2 h-4 w-4" />
                                התקשר
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => {
                              setSelectedCustomer(customer);
                              setIsEnrollOpen(true);
                            }}>
                              <GraduationCap className="ml-2 h-4 w-4" />
                              רישום לקורס
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setEditingCustomer(customer);
                              setIsEditOpen(true);
                            }}>
                              <Edit className="ml-2 h-4 w-4" />
                              עריכה
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => deleteCustomer(customer.id)}
                            >
                              <Trash2 className="ml-2 h-4 w-4" />
                              מחיקה
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Add Customer Dialog */}
      <Dialog open={isAddCustomerOpen} onOpenChange={setIsAddCustomerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>לקוח חדש</DialogTitle>
          </DialogHeader>
          <CustomerForm
            onSubmit={handleCreateCustomer}
            onCancel={() => setIsAddCustomerOpen(false)}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Convert Lead Dialog */}
      <Dialog open={isConvertLeadOpen} onOpenChange={setIsConvertLeadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>המרת ליד ללקוח</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-auto">
            {unconvertedLeads.map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer"
                onClick={() => handleConvertLead(lead.id)}
              >
                <div>
                  <p className="font-medium">{lead.name}</p>
                  <p className="text-sm text-muted-foreground">{lead.phone}</p>
                </div>
                <Badge variant="outline">{lead.status}</Badge>
              </div>
            ))}
            {unconvertedLeads.length === 0 && (
              <p className="text-center text-muted-foreground py-4">אין לידים להמרה</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Enroll Customer Dialog */}
      {selectedCustomer && (
        <EnrollCustomerDialog
          open={isEnrollOpen}
          onOpenChange={setIsEnrollOpen}
          customer={selectedCustomer}
        />
      )}

      {/* Edit Customer Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>עריכת לקוח</DialogTitle>
          </DialogHeader>
          {editingCustomer && (
            <CustomerForm
              onSubmit={async (data) => {
                try {
                  setIsSubmitting(true);
                  await updateCustomer(editingCustomer.id, data);
                  setIsEditOpen(false);
                  setEditingCustomer(null);
                } finally {
                  setIsSubmitting(false);
                }
              }}
              onCancel={() => { setIsEditOpen(false); setEditingCustomer(null); }}
              isLoading={isSubmitting}
              defaultValues={{
                name: editingCustomer.name,
                phone: editingCustomer.phone,
                email: editingCustomer.email || '',
                notes: editingCustomer.notes || '',
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add Column Dialog */}
      <AddColumnDialog
        open={isAddColumnOpen}
        onOpenChange={setIsAddColumnOpen}
        onSubmit={createColumn}
      />

      {/* Customer Detail Sheet */}
      {detailCustomer && (
        <CustomerDetailSheet
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
          customer={detailCustomer}
          onUpdate={updateCustomer}
        />
      )}

      {/* Send Message Dialog */}
      {messageCustomer && (
        <SendMessageDialog
          open={isSendMessageOpen}
          onOpenChange={setIsSendMessageOpen}
          customer={messageCustomer}
        />
      )}
    </MainLayout>
  );
}
