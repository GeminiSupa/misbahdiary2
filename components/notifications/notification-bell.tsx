"use client";

import { useMemo, useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Bell, Check, Loader2, CheckCheck, X } from "lucide-react";
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

  // Lock body scroll when panel is open on mobile
  useEffect(() => {
    if (open && typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
      return () => {
        document.body.style.overflow = prev;
        document.body.style.touchAction = "";
      };
    }
  }, [open]);

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
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground leading-snug">{notification.title}</p>
        {notification.message ? (
          <p className="mt-0.5 text-sm text-muted-foreground leading-snug line-clamp-2">
            {notification.message}
          </p>
        ) : null}
        <p className="mt-1 text-xs text-muted-foreground/80">
          {timeAgo}
        </p>
      </div>
    );
  };

  const badgeCount = unreadCount - localReadIds.size;

  return (
    <div className="relative overflow-visible">
      <Button
        variant="ghost"
        size="icon"
        className="relative h-9 w-9 min-h-[44px] min-w-[44px] sm:min-h-9 sm:min-w-9 rounded-lg hover:bg-muted touch-manipulation overflow-visible"
        aria-label={`View notifications${badgeCount > 0 ? ` (${badgeCount} unread)` : ""}`}
        onClick={handleToggle}
      >
        <Bell className="h-4 w-4 shrink-0" />
        {badgeCount > 0 ? (
          <span
            className="absolute right-0 top-0 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-semibold text-destructive-foreground ring-2 ring-background"
            aria-hidden
          >
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        ) : null}
      </Button>

      {open ? (
        <>
          {/* Mobile: slide-in bottom sheet - full width, safe areas, touch-friendly */}
          <div className="fixed inset-0 z-[100] sm:hidden">
            <div
              className={cn(
                "absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-300 ease-out",
                isAnimating ? "opacity-0" : "opacity-100"
              )}
              onClick={handleClose}
              aria-hidden
            />
            <div
              ref={panelRef}
              className={cn(
                "absolute inset-x-0 bottom-0 top-0 flex flex-col bg-card border-t border-x border-border shadow-xl transition-transform duration-300 ease-out will-change-transform rounded-t-2xl overflow-hidden",
                "pt-[env(safe-area-inset-top)] pb-[max(env(safe-area-inset-bottom),1rem)]",
                isAnimating ? "translate-y-full" : "translate-y-0"
              )}
            >
              <div className="shrink-0 flex flex-col gap-1.5 sm:gap-2 px-4 py-2.5 sm:py-3 border-b border-border bg-background/95">
                <div className="flex items-center justify-between gap-2 min-h-[40px] sm:min-h-[44px]">
                  <h2 className="text-sm sm:text-base font-semibold text-foreground">Notifications</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-9 w-9 sm:h-11 sm:w-11 min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] text-muted-foreground hover:text-foreground hover:bg-muted touch-manipulation"
                    onClick={handleClose}
                    aria-label="Close notifications"
                  >
                    <X className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </div>
                {visibleNotifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isPending}
                    onClick={handleMarkAll}
                    className="w-full min-h-[36px] sm:min-h-[40px] justify-start px-2.5 py-2 text-xs sm:text-sm text-primary hover:bg-primary/10 touch-manipulation"
                  >
                    {isPending ? (
                      <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 animate-spin" />
                    ) : (
                      <CheckCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                    )}
                    <span className="whitespace-nowrap">Mark all read</span>
                  </Button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain -webkit-overflow-scrolling-touch">
                {visibleNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center min-h-[200px] px-6 py-10 text-center">
                    <div className="rounded-full bg-muted/50 p-4 mb-3">
                      <Bell className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground mb-0.5">
                      You&apos;re all caught up
                    </p>
                    <p className="text-xs text-muted-foreground max-w-[240px]">
                      Hearing reminders, billing alerts, and case notices will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {visibleNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="px-4 py-3 active:bg-muted/50 transition-colors min-h-[44px] flex flex-col justify-center"
                      >
                        {notification.link ? (
                          <a
                            href={notification.link}
                            className="block -mx-4 px-4 -my-3 py-3 rounded-none"
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
                            className="mt-2 h-10 text-xs text-primary hover:bg-primary/10 min-h-[44px] sm:min-h-[36px] touch-manipulation"
                            disabled={isPending}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleMarkRead(notification.id);
                            }}
                          >
                            <Check className="mr-1.5 h-3.5 w-3.5 shrink-0" />
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

          {/* Desktop: dropdown with clean cards */}
          <div className="hidden sm:flex absolute right-0 top-full mt-2 z-50 w-[360px] rounded-xl border border-border bg-card shadow-lg max-h-[min(70vh,420px)] flex-col overflow-hidden">
            <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-3 border-b border-border bg-muted/30">
              <span className="text-sm font-semibold text-foreground shrink-0">Notifications</span>
              <Button
                variant="ghost"
                size="sm"
                disabled={isPending || visibleNotifications.length === 0}
                onClick={handleMarkAll}
                className="h-8 shrink-0 px-2.5 text-xs text-primary hover:bg-primary/10"
              >
                {isPending ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 shrink-0 animate-spin" />
                ) : (
                  <>
                    <CheckCheck className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                    <span className="whitespace-nowrap">Mark all read</span>
                  </>
                )}
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              {visibleNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <div className="rounded-full bg-muted/50 p-3 mb-2">
                    <Bell className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-0.5">You&apos;re all caught up</p>
                  <p className="text-xs text-muted-foreground max-w-[260px]">
                    Hearing reminders, billing alerts, and case notices will appear here.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {visibleNotifications.map((notification) => (
                    <li key={notification.id} className="group relative">
                      <div className="px-4 py-3 hover:bg-muted/40 transition-colors">
                        {notification.link ? (
                          <a href={notification.link} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset rounded">
                            {renderNotificationContent(notification)}
                          </a>
                        ) : (
                          renderNotificationContent(notification)
                        )}
                        <div className="mt-2 flex items-center justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                            disabled={isPending}
                            onClick={() => handleMarkRead(notification.id)}
                          >
                            {isPending ? (
                              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <>
                                <Check className="mr-1.5 h-3.5 w-3.5" />
                                Mark as read
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
