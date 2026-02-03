"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

type ActivityFiltersProps = {
  actions: string[];
  entityTypes: string[];
};

export function ActivityFilters({ actions, entityTypes }: ActivityFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentAction = searchParams.get("action") || "all";
  const currentEntityType = searchParams.get("entity_type") || "all";

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/activity?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push("/activity");
  };

  const hasFilters = currentAction !== "all" || currentEntityType !== "all";

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label className="mb-2 block text-sm font-medium">Filter by Action</label>
        <Select value={currentAction} onValueChange={(value) => handleFilterChange("action", value)}>
          <SelectTrigger>
            <SelectValue placeholder="All Actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {actions.map((action) => (
              <SelectItem key={action} value={action}>
                {action.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1">
        <label className="mb-2 block text-sm font-medium">Filter by Type</label>
        <Select
          value={currentEntityType}
          onValueChange={(value) => handleFilterChange("entity_type", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {entityTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {hasFilters && (
        <div className="sm:flex-none">
          <Button variant="outline" onClick={clearFilters} className="w-full sm:w-auto min-w-0">
            <X className="mr-2 h-4 w-4 shrink-0" />
            <span className="truncate">Clear Filters</span>
          </Button>
        </div>
      )}
    </div>
  );
}
