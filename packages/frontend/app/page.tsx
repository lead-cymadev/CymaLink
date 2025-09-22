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
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-balance">Empezemos</h2>
            <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-pretty">
              Ingresa a tu cuenta o crea una nueva para descubrir cómo CymaLink puede transformar tu experiencia digital.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div whileHover={{ y: -4, scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
                <Button
                  type="button"
                  size="lg"
                  
                  className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-3 text-lg transition-all duration-300 hover:shadow-lg hover:shadow-accent/30 w-full sm:w-auto"
                >
                  <a href="/auth/login">Inicia sesión</a>
                </Button>
              </motion.div>
              <motion.div whileHover={{ y: -4, scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-primary text-primary hover:bg-primary/40 px-8 py-3 text-lg transition-all duration-300 bg-transparent w-full sm:w-auto"
                >
                  <a href="/auth/register">Registrate</a>
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
            <h3 className="text-3xl sm:text-4xl font-bold text-center mb-16">Texto</h3>
            <motion.div
              className="grid md:grid-cols-3 gap-8"
              variants={cardGridAnimation.container}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              {["Conexión Instantánea", "Colaboración Inteligente", "Seguridad Avanzada"].map((title, i) => (
                <motion.div
                  key={i}
                  variants={cardGridAnimation.item}
                  whileHover={{ y: -8, scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card className="bg-card/60 backdrop-blur-sm border-border h-full transition-all duration-300 hover:shadow-xl hover:border-primary/50">
                    <CardHeader>
                      <CardTitle className="text-card-foreground">{title}</CardTitle>
                      <CardDescription className="text-muted-foreground">
                        {i === 0 && "Conecta con personas y empresas al instante"}
                        {i === 1 && "Herramientas de colaboración de última generación"}
                        {i === 2 && "Protección de datos de nivel empresarial"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-card-foreground/80">
                        {i === 0 &&
                          "Nuestra tecnología avanzada permite conexiones rápidas y seguras entre usuarios."}
                        {i === 1 && "Trabaja en equipo de manera más eficiente con nuestras herramientas inteligentes."}
                        {i === 2 &&
                          "Tus datos están protegidos con los más altos estándares de seguridad y encriptación."}
                      </p>
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
          className="py-20 px-4 bg-secondary/30"
        >
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-3xl sm:text-4xl font-bold mb-2">
              Texto <span className="text-accent">Texto</span> Texto
            </h3>
            <p className="text-lg text-muted-foreground">
              Texto
            </p>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="py-20 px-4"
        >
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-3xl sm:text-4xl font-bold mb-6">Texto</h3>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8">
              Texto
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div whileHover={{ y: -4, scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
                <Button
                  size="lg"
                  className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-3 text-lg transition-all duration-300 hover:shadow-lg hover:shadow-accent/30 w-full sm:w-auto"
                >
                  Texto
                </Button>
              </motion.div>
              <motion.div whileHover={{ y: -4, scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-primary text-primary hover:bg-primary/10 px-8 py-3 text-lg transition-all duration-300 bg-transparent w-full sm:w-auto"
                >
                  Contactar Ventas
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
                <h4 className="text-foreground font-bold mb-4">Texto</h4>
                <p>Texto</p>
              </div>
              {[
                { title: "Texto", links: ["Texto", "Texto", "Texto"] },
                { title: "Texto", links: ["Texto ", "Texto", "Texto"] },
                { title: "Texto", links: ["Texto", "Texto", "Texto"] },
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