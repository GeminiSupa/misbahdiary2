"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Settings2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { DashboardWidget, WidgetType, WidgetSize } from "@/lib/types/dashboard";
import { DashboardKpiCards } from "./dashboard-kpi-cards";
import { DashboardCustomizationPanel } from "./dashboard-customization-panel";
import { TemplatesWidget } from "./templates-widget";
import { saveDashboardPreferences } from "@/app/(app)/dashboard/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

type CustomizableDashboardProps = {
  initialWidgets: DashboardWidget[];
  kpis: Array<{
    label: string;
    value: string | number;
    hint: string;
    href?: string;
  }>;
  hearingsToday: Array<{
    id: string;
    scheduled_at: string;
    matter?: {
      serial_number?: string;
      case_number?: string;
      court_name?: string;
    } | null;
  }>;
  showHeader?: boolean;
};

export function CustomizableDashboard({
  initialWidgets,
  kpis,
  hearingsToday,
  showHeader = true,
}: CustomizableDashboardProps) {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(initialWidgets);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<DashboardWidget | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const pendingSaveRef = useRef<DashboardWidget[] | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setWidgets(initialWidgets);
  }, [initialWidgets]);

  // Save preferences after state update (avoids render error)
  useEffect(() => {
    if (pendingSaveRef.current) {
      const widgetsToSave = pendingSaveRef.current;
      pendingSaveRef.current = null;
      
      saveDashboardPreferences(widgetsToSave).then((result) => {
        if (result.success) {
          router.refresh();
        }
      });
    }
  }, [widgets, router]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newWidgets = arrayMove(items, oldIndex, newIndex).map((widget, index) => ({
          ...widget,
          position: index,
        }));

        // Queue save for after state update (avoids render error)
        pendingSaveRef.current = newWidgets;

        return newWidgets;
      });
    }
  };

  const handleWidgetUpdate = async (updatedWidget: DashboardWidget) => {
    const newWidgets = widgets.map((w) => (w.id === updatedWidget.id ? updatedWidget : w));
    setWidgets(newWidgets);

    const result = await saveDashboardPreferences(newWidgets);
    if (result.success) {
      toast({
        title: "Widget updated",
        description: "Your dashboard changes have been saved.",
      });
      router.refresh();
    } else {
      toast({
        title: "Error",
        description: result.message || "Failed to save changes",
        variant: "destructive",
      });
    }
    setSelectedWidget(null);
  };

  const handleToggleVisibility = async (widgetId: string) => {
    const newWidgets = widgets.map((w) =>
      w.id === widgetId ? { ...w, isVisible: !w.isVisible } : w
    );
    setWidgets(newWidgets);

    const result = await saveDashboardPreferences(newWidgets);
    if (result.success) {
      router.refresh();
    }
  };

  const visibleWidgets = widgets.filter((w) => w.isVisible);

  return (
    <div className="space-y-4">
      {/* Card Header - Only show if showHeader is true */}
      {showHeader && (
        <div className="sap-card-header">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground sm:text-lg">Practice Overview</h2>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Customizable widgets for your practice metrics and today&apos;s agenda.
            </p>
          </div>
          <Button
            variant={isCustomizing ? "default" : "outline"}
            size="sm"
            className="w-full sm:w-auto shrink-0"
            onClick={() => {
              setIsCustomizing(!isCustomizing);
              if (isCustomizing) {
                setSelectedWidget(null);
              }
            }}
          >
            <Settings2 className="mr-2 h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap">{isCustomizing ? "Done" : "Customize"}</span>
          </Button>
        </div>
      )}

      {/* Customization Panel */}
      {isCustomizing && (
        <DashboardCustomizationPanel
          widgets={widgets}
          selectedWidget={selectedWidget}
          onSelectWidget={setSelectedWidget}
          onUpdateWidget={handleWidgetUpdate}
          onToggleVisibility={handleToggleVisibility}
        />
      )}

      {/* Widgets Grid - Mobile First */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={visibleWidgets.map((w) => w.id)} strategy={verticalListSortingStrategy}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleWidgets.map((widget) => (
              <SortableWidget
                key={widget.id}
                widget={widget}
                isCustomizing={isCustomizing}
                onSelect={() => setSelectedWidget(widget)}
                kpis={kpis}
                hearingsToday={hearingsToday}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

type SortableWidgetProps = {
  widget: DashboardWidget;
  isCustomizing: boolean;
  onSelect: () => void;
  kpis: CustomizableDashboardProps["kpis"];
  hearingsToday: CustomizableDashboardProps["hearingsToday"];
};

function SortableWidget({
  widget,
  isCustomizing,
  onSelect,
  kpis,
  hearingsToday,
}: SortableWidgetProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={cn("relative", isCustomizing && "group")}>
      {isCustomizing && (
        <div className="absolute -left-8 top-4 z-10 flex flex-col gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab rounded p-1 hover:bg-muted active:cursor-grabbing"
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      )}
      <WidgetRenderer widget={widget} kpis={kpis} hearingsToday={hearingsToday} />
      {isCustomizing && (
        <div className="absolute right-2 top-2 z-10 opacity-0 transition-opacity group-hover:opacity-100">
          <Button variant="outline" size="sm" onClick={onSelect}>
            <Settings2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

type WidgetRendererProps = {
  widget: DashboardWidget;
  kpis: CustomizableDashboardProps["kpis"];
  hearingsToday: CustomizableDashboardProps["hearingsToday"];
};

function WidgetRenderer({ widget, kpis, hearingsToday }: WidgetRendererProps) {
  const sizeClasses = {
    small: "md:col-span-1",
    medium: "md:col-span-2",
    large: "md:col-span-2 lg:col-span-3",
  };

  const style: React.CSSProperties = {
    ...(widget.colorScheme?.background && { backgroundColor: widget.colorScheme.background }),
    ...(widget.colorScheme?.foreground && { color: widget.colorScheme.foreground }),
    ...(widget.typography?.fontSize && { fontSize: widget.typography.fontSize }),
    ...(widget.typography?.fontWeight && { fontWeight: widget.typography.fontWeight }),
    ...(widget.typography?.fontFamily && { fontFamily: widget.typography.fontFamily }),
    ...(widget.typography?.lineHeight && { lineHeight: widget.typography.lineHeight }),
  };

  switch (widget.type) {
    case "kpi":
      return (
        <div className={sizeClasses[widget.size]} style={style}>
          <DashboardKpiCards kpis={kpis} />
        </div>
      );
    case "agenda":
      return (
        <div className={sizeClasses[widget.size]} style={style}>
          <AgendaWidget hearings={hearingsToday} />
        </div>
      );
    case "templates":
      return (
        <div className={sizeClasses[widget.size]} style={style}>
          <TemplatesWidget />
        </div>
      );
    default:
      return (
        <Card className={sizeClasses[widget.size]} style={style}>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Widget: {widget.type}</p>
          </CardContent>
        </Card>
      );
  }
}

function AgendaWidget({ hearings }: { hearings: CustomizableDashboardProps["hearingsToday"] }) {
  return (
    <Card className="h-full">
      <CardContent className="p-4 sm:p-5 md:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <h3 className="text-lg font-semibold text-foreground sm:text-xl md:text-2xl">Today&apos;s Agenda</h3>
          {hearings.length > 0 && (
            <Link
              href="/calendar"
              className="text-xs sm:text-sm text-primary hover:underline shrink-0 font-medium"
            >
              View all
            </Link>
          )}
        </div>
        {hearings.length > 0 ? (
          <div className="space-y-2.5 sm:space-y-3">
            {hearings.map((hearing) => (
              <Link
                key={hearing.id}
                href={`/calendar?hearing=${hearing.id}`}
                className="block"
              >
                <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg border bg-card/50 hover:bg-card/80 hover:border-primary/30 transition-all cursor-pointer group">
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="font-semibold text-sm sm:text-base md:text-lg text-foreground truncate group-hover:text-primary transition-colors">
                      {hearing.matter?.serial_number || hearing.matter?.case_number || "Matter"}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate mt-1">
                      {hearing.matter?.court_name ?? "Court not set"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm sm:text-base font-semibold text-foreground">
                      {format(new Date(hearing.scheduled_at), "h:mm a")}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8">
            <p className="text-sm sm:text-base text-muted-foreground mb-3">No hearings scheduled for today.</p>
            <Link
              href="/calendar"
              className="inline-block text-sm sm:text-base text-primary hover:underline font-medium"
            >
              Schedule a hearing
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
