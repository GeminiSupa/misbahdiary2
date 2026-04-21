"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CaseBoard } from "@/components/cases/case-board";
import { MatterKanbanBoard } from "@/components/cases/matter-kanban-board";

type CaseItem = Parameters<typeof CaseBoard>[0]["cases"][number];

export function MattersView({ cases }: { cases: CaseItem[] }) {
  return (
    <div className="space-y-3">
      <Tabs defaultValue="list">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="mt-3">
          <CaseBoard cases={cases} />
        </TabsContent>
        <TabsContent value="kanban" className="mt-3">
          <MatterKanbanBoard cases={cases} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

