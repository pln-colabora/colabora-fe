"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster(props: ToasterProps) {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-right"
      closeButton
      style={{ fontFamily: "var(--font-inter)" }}
      toastOptions={{
        classNames: {
          toast:
            "group toast font-text bg-background text-foreground border-border shadow-lg",
          title: "font-text font-medium",
          description: "font-text text-muted-foreground",
          actionButton: "font-text bg-primary text-primary-foreground",
          cancelButton: "font-text bg-muted text-muted-foreground",
          error: "border-destructive/50",
          success: "border-success-border",
        },
      }}
      {...props}
    />
  );
}
