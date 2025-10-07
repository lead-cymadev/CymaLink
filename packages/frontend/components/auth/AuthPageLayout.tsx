import type { ReactNode } from "react";

interface AuthPageLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  heroTitle?: string;
  heroSubtitle?: string;
  heroHighlights?: string[];
}

export function AuthPageLayout({
  title,
  subtitle,
  children,
  footer,
  heroTitle = "Bienvenido de vuelta",
  heroSubtitle = "Continúa administrando tu red IoT con los últimos datos y alertas.",
  heroHighlights = ["Token válido por 1 hora", "Verificación segura", "Soporte 24/7"],
}: AuthPageLayoutProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-100">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-700 to-red-500" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.2),transparent_60%)]" />

      <div className="relative z-10 flex w-full max-w-6xl flex-col gap-10 px-6 py-16 md:flex-row md:items-center md:justify-between">
        <section className="text-white md:max-w-xl">
          <p className="text-xs uppercase tracking-[0.35em] text-white/70">CymaLink</p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight md:text-4xl">{heroTitle}</h2>
          <p className="mt-4 text-sm text-white/85">{heroSubtitle}</p>
          <nav className="mt-6 flex flex-wrap gap-2 text-sm text-white/85">
            {heroHighlights.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 transition hover:bg-white/25"
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/25 text-xs font-semibold">•</span>
                {item}
              </span>
            ))}
          </nav>
          <div className="mt-10 text-xs uppercase tracking-[0.3em] text-white/70">Equipo CymaLink</div>
        </section>

        <section className="w-full max-w-lg rounded-3xl border border-blue-100 bg-white/95 p-8 shadow-2xl shadow-blue-900/10 backdrop-blur-md">
          <header className="space-y-2 text-center md:text-left">
            <h1 className="text-3xl font-semibold text-blue-900 sm:text-4xl">{title}</h1>
            {subtitle ? <p className="text-sm text-slate-600">{subtitle}</p> : null}
          </header>
          <div className="mt-6 space-y-6">{children}</div>
          {footer ? <footer className="pt-6 text-sm text-slate-500">{footer}</footer> : null}
        </section>
      </div>
    </main>
  );
}
