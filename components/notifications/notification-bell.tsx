"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Bell, Check, Loader2, CheckCircle2, X } from "lucide-react";
import { markAllNotificationsRead, markNotificationRead } from "@/app/(app)/notifications/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NotificationRecord = {
  id: string;
  title: string;
  message?: string | null;
  link?: string | null;
  createdAt: string;
  readAt?: string | null;
};

type NotificationBellProps = {
  notifications: NotificationRecord[];
};

export function NotificationBell({ notifications }: NotificationBellProps) {
  const router = useRouter();
  
  // Filter to only show unread notifications
  const unreadNotifications = useMemo(
    () => notifications.filter((item) => !item.readAt),
    [notifications],
  );

  const unreadCount = unreadNotifications.length;

  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [localReadIds, setLocalReadIds] = useState<Set<string>>(new Set());

  const handleToggle = () => setOpen((prev) => !prev);

  const handleMarkRead = (id: string) => {
    // Optimistically update UI
    setLocalReadIds((prev) => new Set(prev).add(id));
    
    startTransition(async () => {
      const result = await markNotificationRead(id);
      if (result?.success !== false) {
        router.refresh();
      } else {
        // Revert on error
        setLocalReadIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    });
  };

  const handleMarkAll = () => {
    // Optimistically update UI
    const allIds = new Set(unreadNotifications.map((n) => n.id));
    setLocalReadIds((prev) => new Set([...prev, ...allIds]));
    
    startTransition(async () => {
      const result = await markAllNotificationsRead();
      if (result?.success !== false) {
        router.refresh();
      } else {
        // Revert on error
        setLocalReadIds((prev) => {
          const next = new Set(prev);
          allIds.forEach((id) => next.delete(id));
          return next;
        });
      }
    });
  };

  // Filter out locally marked as read
  const visibleNotifications = unreadNotifications.filter(
    (notification) => !localReadIds.has(notification.id),
  );

  const renderNotificationContent = (notification: NotificationRecord) => {
    const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
      addSuffix: true,
    });

    return (
      <div>
        <p className="text-sm font-semibold text-foreground">{notification.title}</p>
        {notification.message ? (
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {notification.message}
          </p>
        ) : null}
        <p className="mt-2 text-xs uppercase tracking-wide text-primary/70">
          {timeAgo}
        </p>
      </div>
    );
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="icon-sm"
        className="relative"
        aria-label="View notifications"
        onClick={handleToggle}
      >
        <Bell className="h-4 w-4" />
        {unreadCount - localReadIds.size > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
            {unreadCount - localReadIds.size}
          </span>
        ) : null}
      </Button>

      {open ? (
        <>
          {/* Mobile: Full-screen overlay */}
          <div className="fixed inset-0 z-[100] sm:hidden">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            {/* Notification panel */}
            <div className="absolute inset-x-0 top-0 bottom-0 bg-card shadow-2xl flex flex-col">
              {/* Header */}
              <div className="flex-shrink-0 flex items-center justify-between gap-3 px-4 py-4 border-b border-border">
                <p className="text-lg font-semibold text-foreground">Notifications</p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isPending || visibleNotifications.length === 0}
                    onClick={handleMarkAll}
                    className="text-xs h-9 px-3"
                  >
                    {isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    Mark all
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {/* Content */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {visibleNotifications.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-border/60 bg-muted/30 p-8 text-center mt-8">
                    <CheckCircle2 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">
                      You&apos;re all caught up. Hearing reminders, billing alerts, and case notices will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {visibleNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background/70 p-4 shadow-sm"
                      >
                        {notification.link ? (
                          <a 
                            href={notification.link} 
                            className="block"
                            onClick={() => setOpen(false)}
                          >
                            {renderNotificationContent(notification)}
                          </a>
                        ) : (
                          renderNotificationContent(notification)
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-3 w-full h-10 text-sm"
                          disabled={isPending || localReadIds.has(notification.id)}
                          onClick={() => handleMarkRead(notification.id)}
                        >
                          {localReadIds.has(notification.id) ? (
                            <>
                              <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" />
                              Marked
                            </>
                          ) : (
                            <>
                              <Check className="mr-2 h-4 w-4" />
                              Mark as read
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Desktop: Dropdown popup */}
          <div className="hidden sm:block absolute right-0 top-full mt-3 z-50 w-80 rounded-2xl border border-border/70 bg-card/95 p-4 shadow-xl backdrop-blur max-h-[80vh] flex flex-col">
              <div className="mb-3 flex items-center justify-between gap-2 flex-shrink-0">
                <p className="text-sm font-semibold text-foreground">Notifications</p>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isPending || visibleNotifications.length === 0}
                  onClick={handleMarkAll}
                  className="text-xs h-8 px-3"
                >
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Mark all
                </Button>
              </div>
              <div className="space-y-2 overflow-y-auto flex-1 min-h-0">
                {visibleNotifications.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-border/60 bg-muted/30 p-6 text-center">
                    <CheckCircle2 className="mx-auto h-10 w-10 text-muted-foreground/50 mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">
                      You&apos;re all caught up. Hearing reminders, billing alerts, and case notices will appear here.
                    </p>
                  </div>
                ) : (
                  visibleNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background/70 p-3 shadow-sm transition-all hover:scale-[1.01] hover:shadow-md"
                    >
                      {notification.link ? (
                        <a href={notification.link} className="block">
                          {renderNotificationContent(notification)}
                        </a>
                      ) : (
                        renderNotificationContent(notification)
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 w-full h-9 text-sm"
                        disabled={isPending || localReadIds.has(notification.id)}
                        onClick={() => handleMarkRead(notification.id)}
                      >
                        {localReadIds.has(notification.id) ? (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" />
                            Marked
                          </>
                        ) : (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Mark as read
                          </>
                        )}
                      </Button>
                    </div>
                  ))
                )}
              </div>
        </>
      ) : null}
    </div>
  );
}
