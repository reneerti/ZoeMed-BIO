import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Check, Trash2, TrendingDown, TrendingUp, Activity, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  user_person: string;
  notification_type: string;
  title: string;
  message: string;
  metric_name: string | null;
  old_value: number | null;
  new_value: number | null;
  change_value: number | null;
  is_positive: boolean;
  is_read: boolean;
  created_at: string;
}

interface NotificationCenterProps {
  isAdmin?: boolean;
}

const NotificationCenter = ({ isAdmin = false }: NotificationCenterProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    loadNotifications();

    // Subscribe to realtime notifications
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);

      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("is_read", false);

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await supabase
        .from("notifications")
        .delete()
        .eq("id", id);

      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const getIcon = (type: string, isPositive: boolean) => {
    if (isPositive) {
      return <TrendingDown className="w-4 h-4 text-emerald-500" />;
    }
    return <TrendingUp className="w-4 h-4 text-rose-500" />;
  };

  const getChangeColor = (isPositive: boolean) => {
    return isPositive ? "text-emerald-500" : "text-rose-500";
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="p-3 border-b flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Notificações
          </h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllAsRead}>
              <Check className="w-3 h-3 mr-1" />
              Marcar todas
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[400px]">
          {loading ? (
            <div className="p-8 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-3 hover:bg-muted/50 transition-colors cursor-pointer group",
                    !notification.is_read && "bg-primary/5"
                  )}
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                      notification.is_positive ? "bg-emerald-500/20" : "bg-rose-500/20"
                    )}>
                      {getIcon(notification.notification_type, notification.is_positive)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm truncate">
                          {notification.title}
                        </p>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-6 h-6 opacity-0 group-hover:opacity-100 shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {notification.message}
                      </p>
                      {notification.old_value !== null && notification.new_value !== null && (
                        <div className="flex items-center gap-2 mt-1 text-xs">
                          <span className="text-muted-foreground">
                            {notification.old_value.toFixed(1)} → {notification.new_value.toFixed(1)}
                          </span>
                          <span className={cn("font-medium", getChangeColor(notification.is_positive))}>
                            ({notification.change_value && notification.change_value > 0 ? "+" : ""}
                            {notification.change_value?.toFixed(1)})
                          </span>
                        </div>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-2" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;
