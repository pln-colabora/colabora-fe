const defaultDashboardPath = "/dashboard?view=all";

export function getDashboardReturnPath(value: string | null) {
  if (!value || !value.startsWith("/dashboard") || value.startsWith("//"))
    return defaultDashboardPath;
  return value;
}
