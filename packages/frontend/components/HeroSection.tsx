"use client"

import { motion } from "framer-motion"

// Definimos los tipos de las props que el componente recibirá
interface HeroSectionProps {
  scrollY: number
  opacity: number
}

// Variantes de animación para el efecto "typewriter"
const typewriterContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
}

const typewriterItem = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0 },
}

const taglineText = "Maneja con seguridad tus conexiones IOT".split(" ")

export default function HeroSection({ scrollY, opacity }: HeroSectionProps) {
  return (
    <div className="text-center px-4">
      <motion.h1
        className="text-6xl sm:text-7xl md:text-9xl font-bold transition-opacity duration-100 mb-8 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
        style={{
          opacity: opacity,
          transform: `translateY(${scrollY * 0.5}px)`,
        }}
      >
        CymaLink
      </motion.h1>
      <motion.p
        className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto"
        style={{
          opacity: opacity,
          transform: `translateY(${scrollY * 1.7}px)`,
        }}
        variants={typewriterContainer}
        initial="hidden"
        animate="visible"
      >
        {taglineText.map((word, index) => (
          <motion.span key={index} variants={typewriterItem} className="inline-block mr-[0.4em]">
            {word}
          </motion.span>
        ))}
      </motion.p>
    </div>
  )
}
