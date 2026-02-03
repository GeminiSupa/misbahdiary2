"use client";

import { useState, useEffect } from "react";
import { X, Palette, Type, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff } from "lucide-react";
import type { DashboardWidget, WidgetSize } from "@/lib/types/dashboard";

type DashboardCustomizationPanelProps = {
  widgets: DashboardWidget[];
  selectedWidget: DashboardWidget | null;
  onSelectWidget: (widget: DashboardWidget | null) => void;
  onUpdateWidget: (widget: DashboardWidget) => void;
  onToggleVisibility: (widgetId: string) => void;
};

export function DashboardCustomizationPanel({
  widgets,
  selectedWidget,
  onSelectWidget,
  onUpdateWidget,
  onToggleVisibility,
}: DashboardCustomizationPanelProps) {
  const [colorScheme, setColorScheme] = useState({
    background: selectedWidget?.colorScheme?.background || "",
    foreground: selectedWidget?.colorScheme?.foreground || "",
    primary: selectedWidget?.colorScheme?.primary || "",
    accent: selectedWidget?.colorScheme?.accent || "",
  });

  const [typography, setTypography] = useState({
    fontSize: selectedWidget?.typography?.fontSize || "default",
    fontWeight: selectedWidget?.typography?.fontWeight || "default",
    fontFamily: selectedWidget?.typography?.fontFamily || "default",
    lineHeight: selectedWidget?.typography?.lineHeight || "default",
  });

  // Sync state when selectedWidget changes
  useEffect(() => {
    if (selectedWidget) {
      setColorScheme({
        background: selectedWidget.colorScheme?.background || "",
        foreground: selectedWidget.colorScheme?.foreground || "",
        primary: selectedWidget.colorScheme?.primary || "",
        accent: selectedWidget.colorScheme?.accent || "",
      });
      setTypography({
        fontSize: selectedWidget.typography?.fontSize || "default",
        fontWeight: selectedWidget.typography?.fontWeight || "default",
        fontFamily: selectedWidget.typography?.fontFamily || "default",
        lineHeight: selectedWidget.typography?.lineHeight || "default",
      });
    }
  }, [selectedWidget]);

  const handleSizeChange = (size: WidgetSize) => {
    if (selectedWidget) {
      onUpdateWidget({ ...selectedWidget, size });
    }
  };

  const handleColorChange = (key: string, value: string) => {
    setColorScheme((prev) => ({ ...prev, [key]: value }));
    if (selectedWidget) {
      onUpdateWidget({
        ...selectedWidget,
        colorScheme: { ...selectedWidget.colorScheme, [key]: value },
      });
    }
  };

  const handleTypographyChange = (key: string, value: string) => {
    const actualValue = value === "default" ? "" : value;
    setTypography((prev) => ({ ...prev, [key]: actualValue }));
    if (selectedWidget) {
      const newTypography = { ...selectedWidget.typography };
      if (actualValue === "") {
        delete newTypography[key as keyof typeof newTypography];
      } else {
        newTypography[key as keyof typeof newTypography] = actualValue;
      }
      onUpdateWidget({
        ...selectedWidget,
        typography: Object.keys(newTypography).length > 0 ? newTypography : undefined,
      });
    }
  };

  const handleReset = () => {
    if (selectedWidget) {
      onUpdateWidget({
        ...selectedWidget,
        colorScheme: undefined,
        typography: undefined,
      });
      setColorScheme({ background: "", foreground: "", primary: "", accent: "" });
      setTypography({ fontSize: "default", fontWeight: "default", fontFamily: "default", lineHeight: "default" });
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Customize Dashboard</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => onSelectWidget(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Widget List */}
        <div>
          <Label className="mb-2 block">Widgets</Label>
          <div className="space-y-2">
            {widgets.map((widget) => (
              <div
                key={widget.id}
                className={`
                  flex items-center justify-between p-3 rounded-lg border cursor-pointer
                  transition-colors
                  ${selectedWidget?.id === widget.id ? "border-primary bg-primary/5" : "border-border"}
                `}
                onClick={() => {
                  onSelectWidget(widget);
                }}
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{widget.type}</Badge>
                  <span className="text-sm font-medium capitalize">{widget.type} Widget</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={widget.size === "small" ? "secondary" : widget.size === "large" ? "default" : "outline"}>
                    {widget.size}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleVisibility(widget.id);
                    }}
                  >
                    {widget.isVisible ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customization Options */}
        {selectedWidget && (
          <div className="space-y-4 border-t pt-4">
            <div>
              <Label className="mb-2 block">Size</Label>
              <Select value={selectedWidget.size} onValueChange={handleSizeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">
                    <div className="flex items-center gap-2">
                      <Minimize2 className="h-4 w-4" />
                      Small
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <Maximize2 className="h-4 w-4" />
                      Medium
                    </div>
                  </SelectItem>
                  <SelectItem value="large">
                    <div className="flex items-center gap-2">
                      <Maximize2 className="h-4 w-4" />
                      Large
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Color Customization */}
            <div>
              <Label className="mb-2 flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Colors
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Background</Label>
                  <Input
                    type="color"
                    value={colorScheme.background || "#ffffff"}
                    onChange={(e) => handleColorChange("background", e.target.value)}
                    className="h-10"
                  />
                </div>
                <div>
                  <Label className="text-xs">Foreground</Label>
                  <Input
                    type="color"
                    value={colorScheme.foreground || "#000000"}
                    onChange={(e) => handleColorChange("foreground", e.target.value)}
                    className="h-10"
                  />
                </div>
                <div>
                  <Label className="text-xs">Primary</Label>
                  <Input
                    type="color"
                    value={colorScheme.primary || "#0070F2"}
                    onChange={(e) => handleColorChange("primary", e.target.value)}
                    className="h-10"
                  />
                </div>
                <div>
                  <Label className="text-xs">Accent</Label>
                  <Input
                    type="color"
                    value={colorScheme.accent || "#E8F4F8"}
                    onChange={(e) => handleColorChange("accent", e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>
            </div>

            {/* Typography Customization */}
            <div>
              <Label className="mb-2 flex items-center gap-2">
                <Type className="h-4 w-4" />
                Typography
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Font Size</Label>
                  <Select
                    value={typography.fontSize === "" ? "default" : typography.fontSize || "default"}
                    onValueChange={(value) => handleTypographyChange("fontSize", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Default" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="0.75rem">Small (12px)</SelectItem>
                      <SelectItem value="0.875rem">Base (14px)</SelectItem>
                      <SelectItem value="1rem">Large (16px)</SelectItem>
                      <SelectItem value="1.125rem">XL (18px)</SelectItem>
                      <SelectItem value="1.25rem">2XL (20px)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Font Weight</Label>
                  <Select
                    value={typography.fontWeight === "" ? "default" : typography.fontWeight || "default"}
                    onValueChange={(value) => handleTypographyChange("fontWeight", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Default" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="400">Normal</SelectItem>
                      <SelectItem value="500">Medium</SelectItem>
                      <SelectItem value="600">Semibold</SelectItem>
                      <SelectItem value="700">Bold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Font Family</Label>
                  <Select
                    value={typography.fontFamily === "" ? "default" : typography.fontFamily || "default"}
                    onValueChange={(value) => handleTypographyChange("fontFamily", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Default" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="var(--font-sans)">Sans</SelectItem>
                      <SelectItem value="var(--font-mono)">Mono</SelectItem>
                      <SelectItem value="serif">Serif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Line Height</Label>
                  <Select
                    value={typography.lineHeight === "" ? "default" : typography.lineHeight || "default"}
                    onValueChange={(value) => handleTypographyChange("lineHeight", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Default" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="1">Tight</SelectItem>
                      <SelectItem value="1.5">Normal</SelectItem>
                      <SelectItem value="1.75">Relaxed</SelectItem>
                      <SelectItem value="2">Loose</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Button variant="outline" onClick={handleReset} className="w-full">
              Reset to Default
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
