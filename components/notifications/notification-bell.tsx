"use client";

import { useMemo, useState, useTransition, useEffect, useRef } from "react";
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
  const [isAnimating, setIsAnimating] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);
  const currentYRef = useRef<number>(0);
  const isDraggingRef = useRef(false);

  const handleToggle = () => {
    if (open) {
      handleClose();
    } else {
      setIsAnimating(true);
      setOpen(true);
      // Trigger slide-in animation after mount
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(false);
        });
      });
    }
  };

  const handleClose = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setOpen(false);
      setIsAnimating(false);
    }, 300);
  };

  // Swipe to dismiss functionality
  useEffect(() => {
    if (!open || !panelRef.current) return;

    const panel = panelRef.current;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      startYRef.current = e.touches[0].clientY;
      currentYRef.current = startYRef.current;
      isDraggingRef.current = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current) return;
      currentYRef.current = e.touches[0].clientY;
      const deltaY = currentYRef.current - startYRef.current;
      
      if (deltaY > 0) {
        panel.style.transform = `translateY(${deltaY}px)`;
        panel.style.opacity = `${1 - deltaY / 300}`;
      }
    };

    const handleTouchEnd = () => {
      if (!isDraggingRef.current) return;
      const deltaY = currentYRef.current - startYRef.current;
      
      if (deltaY > 100) {
        handleClose();
      } else {
        panel.style.transform = "";
        panel.style.opacity = "";
      }
      
      isDraggingRef.current = false;
      startYRef.current = 0;
      currentYRef.current = 0;
    };

    panel.addEventListener("touchstart", handleTouchStart);
    panel.addEventListener("touchmove", handleTouchMove);
    panel.addEventListener("touchend", handleTouchEnd);

    return () => {
      panel.removeEventListener("touchstart", handleTouchStart);
      panel.removeEventListener("touchmove", handleTouchMove);
      panel.removeEventListener("touchend", handleTouchEnd);
    };
  }, [open]);

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
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground leading-snug">{notification.title}</p>
        {notification.message ? (
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {notification.message}
          </p>
        ) : null}
        <p className="mt-1.5 text-xs text-muted-foreground">
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
          {/* Mobile: Facebook-style slide-in from top */}
          <div className="fixed inset-0 z-[100] sm:hidden">
            {/* Backdrop with fade animation */}
            <div 
              className={cn(
                "absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-out",
                isAnimating ? "opacity-0" : "opacity-100"
              )}
              onClick={handleClose}
            />
            
            {/* Notification panel with slide animation */}
            <div
              ref={panelRef}
              className={cn(
                "absolute inset-x-0 top-0 bottom-0 bg-white dark:bg-gray-900 flex flex-col shadow-2xl transition-transform duration-300 ease-out will-change-transform",
                isAnimating ? "translate-y-full" : "translate-y-0"
              )}
            >
              {/* Header - Facebook style */}
              <div className="flex-shrink-0 flex items-center justify-between px-4 py-3.5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Notifications</h2>
                <div className="flex items-center gap-2">
                  {visibleNotifications.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isPending}
                      onClick={handleMarkAll}
                      className="text-xs h-8 px-2 text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      {isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        "Mark all"
                      )}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={handleClose}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                {visibleNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full px-4 py-12">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                      <Bell className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                      You&apos;re all caught up
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-xs">
                      Hearing reminders, billing alerts, and case notices will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-800">
                    {visibleNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
                      >
                        {notification.link ? (
                          <a 
                            href={notification.link} 
                            className="block"
                            onClick={handleClose}
                          >
                            {renderNotificationContent(notification)}
                          </a>
                        ) : (
                          renderNotificationContent(notification)
                        )}
                        {!localReadIds.has(notification.id) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 h-8 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            disabled={isPending}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkRead(notification.id);
                            }}
                          >
                            <Check className="mr-1.5 h-3.5 w-3.5" />
                            Mark as read
                          </Button>
                        )}
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
          </div>
        </>
      ) : null}
    </div>
  );
}
