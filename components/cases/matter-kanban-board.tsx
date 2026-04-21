"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  DndContext,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { updateMatterStatus } from "@/app/(app)/cases/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import type { MatterStatusOption } from "@/lib/constants/cases";

type CaseItem = {
  id: string;
  serialNumber: string;
  caseNumber: string | null;
  status: string;
  matterType: string;
  caseType: string | null;
  filingDate: string | null;
  courtName: string | null;
  district: string | null;
  clientName: string | null;
};

type KanbanStage = "NEW" | "FILED" | "HEARING" | "CLOSED";

const STAGES: Array<{
  key: KanbanStage;
  title: string;
  hint: string;
  /** map stage -> existing matter_status value */
  statusValue: MatterStatusOption;
}> = [
  { key: "NEW", title: "NEW", hint: "Intake / diary opened", statusValue: "fresh diary" },
  { key: "FILED", title: "FILED", hint: "Filed / pending in court", statusValue: "pending" },
  { key: "HEARING", title: "HEARING", hint: "Actively listed / execution", statusValue: "execution" },
  { key: "CLOSED", title: "CLOSED", hint: "Disposed / decided", statusValue: "disposed off" },
];

function stageForStatus(status: string): KanbanStage {
  if (status === "fresh diary") return "NEW";
  if (status === "pending") return "FILED";
  if (status === "execution") return "HEARING";
  if (status === "disposed off" || status === "decided") return "CLOSED";
  // fallback: keep in FILED so items stay visible
  return "FILED";
}

function StageHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs font-black tracking-[0.2em] text-slate-200">{title}</p>
      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-slate-200">
        {count}
      </span>
    </div>
  );
}

function SortableMatterCard({ item }: { item: CaseItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={[
        "rounded-2xl border border-white/10 bg-white/4 px-3 py-2.5 text-slate-100 shadow-sm",
        "transition hover:bg-white/6",
        isDragging ? "opacity-70" : "",
      ].join(" ")}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {item.clientName ?? "Unassigned client"}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-slate-300/80">
            {item.serialNumber}
            {item.caseNumber ? ` • ${item.caseNumber}` : ""}{" "}
            {item.courtName ? ` • ${item.courtName}` : ""}
          </p>
        </div>
        <Badge variant="outline" className="shrink-0 border-white/10 bg-white/5 text-[10px] text-slate-200">
          {item.matterType}
        </Badge>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="truncate text-[11px] text-slate-300/70">
          {item.district ? item.district : "—"}
        </p>
        <Link
          href={`/cases/${item.id}`}
          className="text-[11px] font-semibold text-teal-200 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          Open →
        </Link>
      </div>
    </article>
  );
}

function KanbanColumn({
  stage,
  items,
}: {
  stage: (typeof STAGES)[number];
  items: CaseItem[];
}) {
  const { setNodeRef } = useDroppable({ id: stage.key });
  return (
    <section className="min-w-[280px] max-w-[320px] flex-1">
      <div
        ref={setNodeRef}
        className="rounded-[28px] border border-white/10 bg-slate-950/70 p-3 backdrop-blur-xl"
      >
        <StageHeader title={stage.title} count={items.length} />
        <p className="mt-1 text-[11px] font-medium text-slate-300/70">{stage.hint}</p>
        <div className="mt-3 space-y-2">
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            {items.map((item) => (
              <SortableMatterCard key={item.id} item={item} />
            ))}
          </SortableContext>
        </div>
      </div>
    </section>
  );
}

export function MatterKanbanBoard({ cases }: { cases: CaseItem[] }) {
  const [query, setQuery] = useState("");
  const [activeStage, setActiveStage] = useState<KanbanStage | "ALL">("ALL");
  const [optimistic, setOptimistic] = useState<Record<string, KanbanStage>>({});
  const [isPending, startTransition] = useTransition();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const itemsFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matchesQuery = (m: CaseItem) =>
      !q ||
      [
        m.serialNumber,
        m.caseNumber ?? "",
        m.clientName ?? "",
        m.courtName ?? "",
        m.district ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);

    return cases.filter((m) => matchesQuery(m));
  }, [cases, query]);

  const byStage = useMemo(() => {
    const map: Record<KanbanStage, CaseItem[]> = {
      NEW: [],
      FILED: [],
      HEARING: [],
      CLOSED: [],
    };
    for (const item of itemsFiltered) {
      const computed = stageForStatus(item.status);
      const stage = optimistic[item.id] ?? computed;
      map[stage].push(item);
    }
    // Stable ordering for scanning
    for (const k of Object.keys(map) as KanbanStage[]) {
      map[k] = map[k].slice().sort((a, b) =>
        (a.serialNumber || "").localeCompare(b.serialNumber || ""),
      );
    }
    return map;
  }, [itemsFiltered, optimistic]);

  const onDragEnd = (event: DragEndEvent) => {
    const activeId = String(event.active.id);
    const overId = event.over?.id ? String(event.over.id) : null;
    if (!overId) return;

    // Determine destination stage: either dropped on a card (inherit its stage) or a column id (stage key)
    const stageKeys = new Set(STAGES.map((s) => s.key));
    const destStage: KanbanStage | null = stageKeys.has(overId as KanbanStage)
      ? (overId as KanbanStage)
      : (optimistic[overId] ??
          stageForStatus(cases.find((c) => c.id === overId)?.status ?? "pending"));

    if (!destStage) return;

    const currentStage = optimistic[activeId] ?? stageForStatus(cases.find((c) => c.id === activeId)?.status ?? "pending");
    if (currentStage === destStage) return;

    setOptimistic((prev) => ({ ...prev, [activeId]: destStage }));
    const nextStatus = STAGES.find((s) => s.key === destStage)?.statusValue ?? "pending";

    startTransition(async () => {
      const res = await updateMatterStatus({ matterId: activeId, matterStatus: nextStatus });
      if (!res?.success) {
        // rollback if server rejected
        setOptimistic((prev) => {
          const { [activeId]: _, ...rest } = prev;
          return rest;
        });
      }
    });
  };

  return (
    <div className="rounded-[28px] border border-white/10 bg-linear-to-b from-slate-950/90 to-slate-900/90 p-4 text-slate-100 shadow-[0_20px_60px_rgba(2,6,23,0.35)] backdrop-blur-xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-black tracking-tight sm:text-lg">Kanban board</h2>
          <p className="mt-0.5 text-xs text-slate-300/80">
            Drag matters through NEW → FILED → HEARING → CLOSED.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-[280px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search serial, client, court..."
              className="h-10 w-full rounded-2xl border-white/10 bg-white/5 pl-9 text-slate-100 placeholder:text-slate-400 focus-visible:ring-teal-500/30"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
            <Button
              type="button"
              size="sm"
              variant={activeStage === "ALL" ? "secondary" : "ghost"}
              onClick={() => setActiveStage("ALL")}
              className="h-10 rounded-2xl"
            >
              All
            </Button>
            {STAGES.map((s) => (
              <Button
                key={s.key}
                type="button"
                size="sm"
                variant={activeStage === s.key ? "secondary" : "ghost"}
                onClick={() => setActiveStage(s.key)}
                className="h-10 rounded-2xl"
              >
                {s.title}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {STAGES.filter((s) => activeStage === "ALL" || activeStage === s.key).map((stage) => (
              <div key={stage.key} id={stage.key} className="contents">
                {/* Using the stage key as a droppable target via over.id (column id). */}
                <KanbanColumn stage={stage} items={byStage[stage.key]} />
              </div>
            ))}
          </div>
        </DndContext>
        {isPending ? (
          <p className="mt-2 text-[11px] font-semibold text-slate-300/70">Saving changes…</p>
        ) : null}
      </div>
    </div>
  );
}

