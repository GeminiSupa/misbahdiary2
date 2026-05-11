export type WidgetType = "kpi" | "chart" | "agenda" | "recent_activity" | "quick_actions" | "templates";

export type WidgetSize = "small" | "medium" | "large";

export type ColorScheme = {
  background?: string;
  foreground?: string;
  primary?: string;
  accent?: string;
};

export type TypographySettings = {
  fontSize?: string;
  fontWeight?: string;
  fontFamily?: string;
  lineHeight?: string;
};

export type DashboardWidget = {
  id: string;
  type: WidgetType;
  position: number;
  size: WidgetSize;
  colorScheme?: ColorScheme;
  typography?: TypographySettings;
  isVisible: boolean;
  customConfig?: Record<string, unknown>;
};

export type DashboardPreferences = {
  widgets: DashboardWidget[];
  userId: string;
  firmId: string;
};
