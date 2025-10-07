"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Language = "es" | "en";

type TranslationCatalog = Record<string, string>;

const EN_CATALOG: TranslationCatalog = {
  "app.name": "CymaLink",
  "app.networkCenter": "Network Center",
  "loading.dashboard": "Loading dashboard...",
  "error.title": "Error Loading Data",
  "error.retry": "Retry",
  "status.unknown": "No status",
  "sidebar.role.admin": "admin",
  "sidebar.role.user": "user",
  "dashboard.admin.title": "Global Panel",
  "dashboard.admin.subtitle": "Monitoring {sites} sites and {devices} active devices.",
  "dashboard.user.title": "Personal Panel",
  "dashboard.user.subtitle": "Monitoring your {sites} assigned sites in real time.",
  "nav.overview": "Overview",
  "nav.devices": "Devices",
  "nav.clients": "Clients",
  "nav.settings": "Configuration",
  "actions.newSite": "New site",
  "actions.cancel": "Cancel",
  "actions.refresh": "Refresh",
  "search.placeholder": "Search sites or devices",
  "alerts.empty": "Stay tuned for alerts and reports.",
  "devices.directory.empty": "No devices yet.",
  "clients.directory.empty": "No users assigned to sites.",
  "tailscale.sync": "Synchronize",
  "tailscale.noResults": "No devices found in the tailnet that match the search.",
  "tailscale.syncing": "Syncing with Tailscale...",
  "tailscale.missingMac": "No MAC reported",
  "tailscale.manualLabel": "Manual",
  "tailscale.manual.load": "Load manually",
  "tailscale.manual.clear": "Remove manual entry",
  "settings.title": "Account configuration",
  "settings.subtitle": "Update your basic information and personal preferences.",
  "settings.name": "Full name",
  "settings.email": "Email",
  "settings.language": "Preferred language",
  "settings.timezone": "Timezone",
  "settings.notifications": "Receive email notifications",
  "settings.notifications.hint": "Stay on top of important alerts and reports.",
  "settings.notifications.enabled": "Enabled",
  "settings.reset": "Reset",
  "settings.save": "Save changes",
  "settings.saving": "Saving...",
  "settings.success": "Preferences saved successfully.",
  "settings.error": "We could not save your configuration.",
  "settings.lastUpdate": "Last update",
  "settings.logout": "Sign out",
  "form.name.placeholder": "Enter your name",
  "form.language.es": "Spanish",
  "form.language.en": "English",
  "form.language.pt": "Portuguese",
  "form.language.fr": "French",
  "form.timezone.cdmx": "Mexico City (GMT-6)",
  "form.timezone.bogota": "Bogotá (GMT-5)",
  "form.timezone.buenosAires": "Buenos Aires (GMT-3)",
  "form.timezone.madrid": "Madrid (GMT+1)",
  "form.timezone.utc": "UTC",
  "export.csv": "Export CSV",
  "export.xml": "Export XML",
  "user.devices.none": "There are no devices configured at this site yet.",
  "user.sites.none": "You don't have assigned sites",
  "user.sites.contact": "Contact your administrator to gain access.",
  "user.health.excellent": "Excellent",
  "user.health.operational": "Operational",
  "user.health.review": "Check",
  "user.health.none": "No devices",
  "user.viewDetails": "View details",
  "user.hideDetails": "Hide details",
  "user.showMore": "Show more",
  "user.showLess": "Show less",
  "user.refresh": "Refresh",
  "user.exporting": "Exporting...",
  "user.exportCsv": "Export CSV",
  "user.exportXml": "Export XML",
  "modal.assignUser": "Assign user",
  "modal.addDevice": "Add device",
  "modal.manage": "Manage",
  "button.close": "Close",
  "button.save": "Save",
  "button.loading": "Saving...",
  "button.delete": "Delete",
  "button.edit": "Edit",
  "button.assignUser": "Assign user",
  "button.addDevice": "Add device",
  "button.manage": "Manage",
  "button.managePreferences": "Preferences",
  "admin.sites.inventory": "Site inventory",
  "admin.sites.description": "Monitor the operational status and deployed devices.",
  "table.site": "Site",
  "table.devices": "Devices",
  "table.assignees": "Assigned users",
  "table.health": "Health",
  "table.actions": "Actions",
  "table.device": "Device",
  "table.status": "Status",
  "admin.assignUser.title": "Assign user to:",
  "user.site.assigned": "Assigned site",
  "user.site.noLocation": "Location not defined",
  "user.showMoreCount": "View {count} additional devices",
  "user.devices.onlineCount": "{online}/{total} devices online",
  "summary.sites": "Sites",
  "summary.devices": "Devices",
  "summary.online": "Online",
  "user.section.sites": "Sites",
  "user.section.sitesDescription": "Filter and review the devices assigned to your locations.",
  "user.search.placeholder": "Search by site, location or device",
  "user.hero.badge": "Your personal panel",
  "user.hero.title": "Hey {name}, monitor your sites in real time",
  "user.hero.subtitle": "Keep an eye on device health, review recent activity and stay on top of configurations.",
  "user.hero.language": "Current language",
  "user.hero.notifications": "Email notifications",
  "user.hero.tip": "Tip: update preferences to personalize your experience.",
  "status.on": "On",
  "status.off": "Off",
  "user.quick.statusTitle": "Overall status",
  "user.quick.statusCopy": "Activity summary for your most recent devices.",
  "user.quick.onlineDevices": "{count} devices connected right now.",
  "user.quick.totalSites": "Monitoring {count} assigned sites.",
  "user.quick.reminderTitle": "Reminder",
  "user.quick.reminderCopy": "Keep your data fresh to receive relevant alerts.",
  "user.settings.subtitle": "Tune your profile details and notification preferences.",
};

const CATALOGS: Record<Language, TranslationCatalog> = {
  es: {},
  en: EN_CATALOG,
};

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, fallback?: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const DEFAULT_LANGUAGE: Language = "es";

function translate(language: Language, key: string, fallback?: string): string {
  if (language !== "es") {
    const catalog = CATALOGS[language];
    if (catalog && key in catalog) {
      return catalog[key];
    }
  }
  return fallback ?? key;
}

export function LanguageProvider({ language, children }: { language: Language; children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(language);

  useEffect(() => {
    setCurrentLanguage(language);
  }, [language]);

  const t = useCallback((key: string, fallback?: string) => translate(currentLanguage, key, fallback), [currentLanguage]);

  const value = useMemo<LanguageContextValue>(
    () => ({ language: currentLanguage, setLanguage: setCurrentLanguage, t }),
    [currentLanguage, t],
  );

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = currentLanguage;
    }
  }, [currentLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}

export function useI18n() {
  const { t } = useLanguage();
  return t;
}

export function inferLanguage({ preferredLanguage, timezone }: { preferredLanguage?: string | null; timezone?: string | null }): Language {
  const normalized = preferredLanguage?.toLowerCase();
  if (normalized === "en" || normalized === "english") return "en";
  if (normalized === "es" || normalized === "spanish" || normalized === "es-419") return "es";

  if (timezone) {
    const tz = timezone.toLowerCase();
    if (tz.includes("america/los_angeles") || tz.includes("america/new_york") || tz.includes("america/chicago") || tz.includes("us/")) {
      return "en";
    }
    if (tz.includes("america/mexico") || tz.includes("america/argentina") || tz.includes("america/bogota") || tz.includes("america/lima") || tz.includes("america/santiago")) {
      return "es";
    }
  }

  if (typeof navigator !== "undefined" && navigator.language) {
    return navigator.language.startsWith("en") ? "en" : DEFAULT_LANGUAGE;
  }

  return DEFAULT_LANGUAGE;
}

export function formatMessage(template: string, params: Record<string, string | number>): string {
  return Object.entries(params).reduce((acc, [key, value]) => acc.replace(`{${key}}`, String(value)), template);
}

export function ensureLanguage(value: string | null | undefined): Language {
  if (!value) return DEFAULT_LANGUAGE;
  const normalized = value.toLowerCase();
  return normalized.startsWith("en") ? "en" : DEFAULT_LANGUAGE;
}
