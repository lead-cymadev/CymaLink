"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"

// Dependencias para las partículas
import Particles from "@tsparticles/react"
import type { Engine } from "@tsparticles/engine"
import { loadSlim } from "@tsparticles/slim"

// 1. IMPORTAMOS EL NUEVO COMPONENTE
import HeroSection from "@/components/HeroSection"

export default function Home() {
  const [scrollY, setScrollY] = useState(0)
  const [opacity, setOpacity] = useState(1)

  // Función para inicializar el motor de partículas
  const particlesInit = async (engine: Engine) => {
    await loadSlim(engine)
  }

  // Configuración de las partículas (se mantiene igual)
  const particlesOptions = {
    background: {
      color: { value: "transparent" },
    },
    fpsLimit: 120,
    interactivity: {
      events: {
        onHover: { enable: true, mode: "repulse" },
        resize: { enable: true },
      },
      modes: {
        repulse: { distance: 60, duration: 0.4 },
      },
    },
    particles: {
      color: { value: "#2107caff" },
      links: {
        color: "#ffffff",
        distance: 150,
        enable: true,
        opacity: 0.1,
        width: 1,
      },
      move: {
        direction: "none",
        enable: true,
        outModes: { default: "out" },
        random: false,
        speed: 0.5,
        straight: false,
      },
      number: {
        density: { enable: true, area: 800 },
        value: 40,
      },
      opacity: { value: 0.1 },
      shape: { type: "circle" },
      size: { value: { min: 1, max: 3 } },
    },
    detectRetina: true,
  }

  // El efecto que calcula el scroll y la opacidad se queda aquí
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setScrollY(currentScrollY)
      const newOpacity = Math.max(0, 1 - currentScrollY / 300)
      setOpacity(newOpacity)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Variantes de animación para la cuadrícula de tarjetas
  const cardGridAnimation = {
    container: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
    },
    item: {
      hidden: { y: 20, opacity: 0 },
      visible: { y: 0, opacity: 1 },
    },
  }

  const featureCards = [
    {
      title: "Visibilidad instantánea",
      description: "Centraliza el estado de cada instalación, sensor y alerta crítica sin perder contexto.",
      detail:
        "Dashboards en vivo y mapas dinámicos muestran latencia, consumo energético y salud de tu red en segundos.",
    },
    {
      title: "Automatización inteligente",
      description: "Configura flujos que responden ante incidentes, desconectan dispositivos o notifican a tu equipo.",
      detail:
        "Los playbooks se integran con Slack, Teams y PagerDuty, registrando cada acción para auditoría completa.",
    },
    {
      title: "Confiabilidad reforzada",
      description: "Asegura tus endpoints con baselines seguros, auditoría continua y cifrado extremo a extremo.",
      detail:
        "Nuestros agentes verifican firmware, certificados y accesos cada cinco minutos para garantizar continuidad operativa.",
    },
  ] as const

  const operationsHighlights = [
    {
      heading: "Supervisión 360°",
      copy: "Combina métricas de red, desempeño energético y contexto ambiental en un mismo lienzo de decisiones.",
    },
    {
      heading: "Colaboración segura",
      copy: "Comparte paneles específicos con partners o clientes sin exponer credenciales sensibles.",
    },
    {
      heading: "Insights accionables",
      copy: "Modelos predictivos reconocen patrones de degradación para que actúes antes de que un sitio caiga.",
    },
  ] as const

  const adoptionSteps = [
    {
      title: "Descubre",
      text: "Importa tus dispositivos vía CSV, API o conectores Tailscale y obtenlos mapeados en minutos.",
    },
    {
      title: "Orquesta",
      text: "Define reglas, roles y alertas inteligentes que se adaptan a tu operación y equipo.",
    },
    {
      title: "Escala",
      text: "Replica plantillas y automatizaciones en nuevos sitios con aprovisionamiento remoto y seguro.",
    },
  ] as const

  // 2. LA LÓGICA DEL TYPEWRITER SE MOVIÓ A HeroSection

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.8, ease: "easeInOut" }}
      className="min-h-screen bg-background text-foreground relative overflow-x-hidden"
    >
      {/* Fondo Fijo con Partículas y Gradiente */}
      <div className="fixed inset-0 z-[-1] bg-background">
        {/* @ts-expect-error: tsparticles options type mismatch - needs proper type assertions for move.direction and outModes */}
        <Particles id="tsparticles" init={particlesInit} options={particlesOptions} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-primary/10 to-background"></div>
      </div>

      {/* Encabezado Principal Fijo */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
        {/* 3. USAMOS EL NUEVO COMPONENTE Y LE PASAMOS LAS PROPS */}
        <HeroSection scrollY={scrollY} opacity={opacity} />
      </div>

      {/* Contenido Desplazable */}
      <div className="relative z-10">
        <div className="h-screen" /> {/* Espaciador para el header */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="min-h-screen flex items-center justify-center px-8 -mt-20"
        >
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-balance">
              Conecta, supervisa y actúa desde un solo panel
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-pretty">
              CymaLink centraliza tus despliegues IoT, automatiza respuestas y te ofrece contexto en tiempo real para que
              tu operación nunca se detenga.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div whileHover={{ y: -4, scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
                <Button
                  type="button"
                  size="lg"
                  
                  className="bg-blue-900 hover:bg-blue-700 text-white px-8 py-3 text-lg transition-all duration-300 shadow-lg shadow-blue-900/20 w-full sm:w-auto"
                >
                  <a href="/auth/login">Inicia sesión</a>
                </Button>
              </motion.div>
              <motion.div whileHover={{ y: -4, scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-primary text-primary hover:bg-primary/10 px-8 py-3 text-lg transition-all duration-300 bg-transparent w-full sm:w-auto"
                >
                  <a href="/auth/register">Crear cuenta</a>
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* ... el resto de las secciones y el footer se mantienen exactamente igual ... */}
        
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="py-20 px-4"
        >
          <div className="max-w-6xl mx-auto">
            <h3 className="text-3xl sm:text-4xl font-bold text-center mb-16">
              Visibilidad y control diseñados para equipos críticos
            </h3>
            <motion.div
              className="grid gap-8 md:grid-cols-3"
              variants={cardGridAnimation.container}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              {featureCards.map((card) => (
                <motion.div
                  key={card.title}
                  variants={cardGridAnimation.item}
                  whileHover={{ y: -8, scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 280 }}
                >
                  <Card className="h-full border-border bg-card/70 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:shadow-xl">
                    <CardHeader>
                      <CardTitle className="text-card-foreground">{card.title}</CardTitle>
                      <CardDescription className="text-muted-foreground">{card.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-card-foreground/85">{card.detail}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="py-20 px-4"
        >
          <motion.div
            className="max-w-5xl mx-auto grid gap-8 rounded-3xl border border-blue-100 bg-blue-50/40 p-10 md:grid-cols-3"
            variants={cardGridAnimation.container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {operationsHighlights.map((highlight) => (
              <motion.div
                key={highlight.heading}
                variants={cardGridAnimation.item}
                className="rounded-2xl border border-white/40 bg-white/85 p-6 text-left shadow-sm"
                whileHover={{ y: -6, scale: 1.015 }}
                transition={{ type: "spring", stiffness: 260 }}
              >
                <h4 className="text-lg font-semibold text-blue-900">{highlight.heading}</h4>
                <p className="mt-2 text-sm text-slate-600">{highlight.copy}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="py-20 px-4"
        >
          <div className="max-w-5xl mx-auto">
            <h3 className="text-center text-3xl sm:text-4xl font-bold mb-6">
              Implementa CymaLink en tres pasos
            </h3>
            <p className="text-center text-lg text-muted-foreground mb-10 max-w-3xl mx-auto">
              Desde la importación inicial hasta la automatización completa, te acompañamos con herramientas y soporte
              especializados para que obtengas valor desde el primer día.
            </p>
            <div className="grid gap-6 md:grid-cols-3">
              {adoptionSteps.map((step, index) => (
                <motion.div
                  key={step.title}
                  className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 260 }}
                >
                  <span className="absolute -top-4 left-6 inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-900 text-sm font-semibold text-white shadow-lg">
                    {index + 1}
                  </span>
                  <h4 className="mt-4 text-lg font-semibold text-blue-900">{step.title}</h4>
                  <p className="mt-2 text-sm text-slate-600">{step.text}</p>
                </motion.div>
              ))}
            </div>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <motion.div whileHover={{ y: -4, scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
                <Button
                  size="lg"
                  className="bg-blue-900 hover:bg-blue-700 text-white px-8 py-3 text-lg transition-all duration-300 shadow-lg shadow-blue-900/20 w-full sm:w-auto"
                >
                  Agendar demostración
                </Button>
              </motion.div>
              <motion.div whileHover={{ y: -4, scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-slate-300 text-slate-700 hover:bg-slate-100 px-8 py-3 text-lg transition-all duration-300 w-full sm:w-auto"
                >
                  Hablar con un especialista
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Footer */}
        <footer className="py-12 px-4 border-t border-border bg-muted/30">
          <div className="max-w-6xl mx-auto text-muted-foreground">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-center sm:text-left">
              <div>
                <h4 className="text-foreground font-bold mb-4">CymaLink</h4>
                <p className="text-sm">
                  Plataforma unificada para visibilidad, automatización y resiliencia de redes IoT empresariales.
                </p>
              </div>
              {[
                { title: "Producto", links: ["Monitoreo en vivo", "Alertas inteligentes", "Automatizaciones"] },
                { title: "Recursos", links: ["Documentación", "Guías de despliegue", "Blog técnico"] },
                { title: "Soporte", links: ["Centro de ayuda", "Estado del servicio", "Contactar equipo"] },
              ].map((section) => (
                <div key={section.title}>
                  <h5 className="text-foreground font-semibold mb-4">{section.title}</h5>
                  <ul className="space-y-2">
                    {section.links.map((link, idx) => (
                      <motion.li key={`${section.title}-${link}-${idx}`} className="relative" whileHover="hover">
                        <a href="#" className="hover:text-accent transition-colors">
                          {link}
                        </a>
                        <motion.div
                          className="absolute bottom-[-4px] left-0 h-[2px] w-full bg-accent"
                          variants={{
                            hover: { scaleX: 1, originX: 0 },
                            initial: { scaleX: 0, originX: 0 },
                          }}
                          initial="initial"
                          transition={{ duration: 0.3, ease: "easeOut" }}
                        />
                      </motion.li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
              <p>&copy; {new Date().getFullYear()} CymaLink. Todos los derechos reservados.</p>
            </div>
          </div>
        </footer>
      </div>
    </motion.div>
  )
}
