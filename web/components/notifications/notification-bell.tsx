"use client";

import { useMemo, useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { Bell, Check, Loader2 } from "lucide-react";
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
  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.readAt).length,
    [notifications],
  );

  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => setOpen((prev) => !prev);

  const handleMarkRead = (id: string) => {
    startTransition(async () => {
      await markNotificationRead(id);
    });
  };

  const handleMarkAll = () => {
    startTransition(async () => {
      await markAllNotificationsRead();
    });
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
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
            {unreadCount}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div className="absolute right-0 z-50 mt-3 w-80 rounded-2xl border border-border/70 bg-card/95 p-4 shadow-xl backdrop-blur">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-foreground">Notifications</p>
            <Button
              variant="ghost"
              size="sm"
              disabled={isPending || unreadCount === 0}
              onClick={handleMarkAll}
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Mark all
            </Button>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You&apos;re all caught up. Hearing reminders, billing alerts, and case notices will appear here.
              </p>
            ) : (
              notifications.map((notification) => {
                const isUnread = !notification.readAt;
                const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true,
                });

                const content = (
                  <div>
                    <p className="text-sm font-medium text-foreground">{notification.title}</p>
                    {notification.message ? (
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {notification.message}
                      </p>
                    ) : null}
                    <p className="mt-2 text-[11px] uppercase tracking-wide text-primary/70">
                      {timeAgo}
                    </p>
                  </div>
                );

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "rounded-xl border border-border/60 bg-background/70 p-3 transition hover:border-primary/50",
                      isUnread ? "shadow-sm" : "opacity-80",
                    )}
                  >
                    {notification.link ? (
                      <a href={notification.link} className="block">
                        {content}
                      </a>
                    ) : (
                      content
                    )}
                    {isUnread ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={() => handleMarkRead(notification.id)}
                      >
                        Mark as read
                      </Button>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

