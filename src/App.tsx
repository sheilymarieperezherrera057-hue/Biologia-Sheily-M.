/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Dna, 
  Activity, 
  ArrowRight, 
  CheckCircle, 
  RefreshCcw, 
  Leaf, 
  Sparkles, 
  Loader2, 
  Microscope, 
  Database,
  Info,
  AlertCircle,
  XCircle,
  Volume2,
  VolumeX
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

// --- SOUND UTILITY (Web Audio API) ---
const playSound = (type: 'click' | 'success' | 'error' | 'transition' | 'hum') => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  const now = ctx.currentTime;

  switch (type) {
    case 'click':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
      break;
    case 'success':
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
      break;
    case 'error':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.2);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
      break;
    case 'transition':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.5);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
      break;
    case 'hum':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, now);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1);
      osc.start(now);
      osc.stop(now + 1);
      break;
  }
};

// --- TYPES ---
interface Organism {
  id: string;
  nombre: string;
  cientifico: string;
  secuencia: string[];
  imagen: string;
  descripcion: string;
}

const ORGANISMOS: Organism[] = [
  {
    id: 'rosa',
    nombre: 'Rosa de Bayahíbe',
    cientifico: 'Leuenbergeria quisqueyana',
    secuencia: ['A', 'C', 'T', 'G', 'C', 'A', 'T'],
    imagen: 'https://picsum.photos/seed/flower-bayahibe/800/600',
    descripcion: 'Cactus único con hojas, endémico de RD. Su regeneración celular es una maravilla evolutiva en suelos áridos.'
  },
  {
    id: 'cigua',
    nombre: 'Cigua Palmera',
    cientifico: 'Dulus dominicus',
    secuencia: ['G', 'C', 'C', 'T', 'A', 'G', 'A'],
    imagen: 'https://picsum.photos/seed/bird-palm/800/600',
    descripcion: 'Ave Nacional. Sus células se dividen a una velocidad asombrosa durante el crecimiento del polluelo.'
  },
  {
    id: 'pez',
    nombre: 'Pez Loro',
    cientifico: 'Scarinae',
    secuencia: ['T', 'A', 'G', 'C', 'G', 'A', 'T'],
    imagen: 'https://picsum.photos/seed/parrotfish/800/600',
    descripcion: 'Héroe de los arrecifes. La mitosis constante renueva su pico de calcio para procesar el coral.'
  },
  {
    id: 'mangle',
    nombre: 'Mangle Rojo',
    cientifico: 'Rhizophora mangle',
    secuencia: ['C', 'G', 'A', 'T', 'T', 'A', 'G'],
    imagen: 'https://picsum.photos/seed/mangrove/800/600',
    descripcion: 'Protector costero. Sus raíces zancudas son el resultado de una multiplicación celular altamente especializada.'
  }
];

const PARES_ADN: Record<string, string> = {
  'A': 'T',
  'T': 'A',
  'C': 'G',
  'G': 'C'
};

const INFO_MITOSIS = [
  { 
    titulo: "Interfase", 
    texto: "La célula se prepara para la división. El ADN se duplica y la célula crece.",
    highlight: "nucleus",
    detalle: "Observa cómo el núcleo está intacto y el material genético se prepara internamente."
  },
  { 
    titulo: "Profase", 
    texto: "Los cromosomas se condensan y el núcleo comienza a desintegrarse.",
    highlight: "chromosomes",
    detalle: "Los cromosomas se vuelven visibles como estructuras en forma de X."
  },
  { 
    titulo: "Metafase", 
    texto: "Los cromosomas se alinean perfectamente en el centro de la célula.",
    highlight: "alignment",
    detalle: "Esta alineación asegura que cada célula hija reciba una copia exacta del ADN."
  },
  { 
    titulo: "Anafase", 
    texto: "Las cromátidas hermanas se separan y se mueven hacia polos opuestos.",
    highlight: "separation",
    detalle: "Las fibras del huso tiran de los cromosomas hacia los extremos de la célula."
  },
  { 
    titulo: "Telofase", 
    texto: "Se forman nuevos núcleos alrededor de los conjuntos de cromosomas.",
    highlight: "new-nuclei",
    detalle: "La célula comienza a recuperar su estructura nuclear en ambos extremos."
  },
  { 
    titulo: "Citocinesis", 
    texto: "El citoplasma se divide, resultando en dos células hijas idénticas.",
    highlight: "division",
    detalle: "¡Proceso completado! El organismo ha generado una nueva unidad de vida."
  }
];

export default function App() {
  const [fase, setFase] = useState<number>(0);
  const [organismoActivo, setOrganismoActivo] = useState<Organism>(ORGANISMOS[0]);
  const [cadenaUsuario, setCadenaUsuario] = useState<string[]>([]);
  const [errorADN, setErrorADN] = useState<boolean>(false);
  const [pasoMitosis, setPasoMitosis] = useState<number>(0);
  const [manualMode, setManualMode] = useState<boolean>(false);
  const [vistoTodo, setVistoTodo] = useState<boolean>(false);
  const [datoCuriosoAI, setDatoCuriosoAI] = useState<string>('');
  const [cargandoAI, setCargandoAI] = useState<boolean>(false);
  const [errorAI, setErrorAI] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const triggerSound = (type: 'click' | 'success' | 'error' | 'transition' | 'hum') => {
    if (soundEnabled) playSound(type);
  };

  // --- REPLICACIÓN ADN ---
  const manejarSeleccionBase = (base: string) => {
    const indiceActual = cadenaUsuario.length;
    const baseEsperada = PARES_ADN[organismoActivo.secuencia[indiceActual]];

    if (base === baseEsperada) {
      triggerSound('success');
      const nuevaCadena = [...cadenaUsuario, base];
      setCadenaUsuario(nuevaCadena);
      if (nuevaCadena.length === organismoActivo.secuencia.length) {
        setTimeout(() => {
          triggerSound('transition');
          setFase(1.5);
        }, 1000);
      }
    } else {
      triggerSound('error');
      setErrorADN(true);
      setTimeout(() => setErrorADN(false), 600);
    }
  };

  // --- MITOSIS ANIMATION LOOP ---
  useEffect(() => {
    if (fase === 2 && !manualMode) {
      const interval = setInterval(() => {
        setPasoMitosis((prev) => {
          if (prev < INFO_MITOSIS.length - 1) {
            triggerSound('hum');
            return prev + 1;
          }
          clearInterval(interval);
          setVistoTodo(true);
          return prev;
        });
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [fase, manualMode]);

  const seleccionarPasoMitosis = (idx: number) => {
    triggerSound('click');
    setManualMode(true);
    setPasoMitosis(idx);
    if (idx === INFO_MITOSIS.length - 1) setVistoTodo(true);
  };

  // --- GEMINI AI INTEGRATION ---
  const generarDatoCurioso = async () => {
    setCargandoAI(true);
    setErrorAI('');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Actúa como un biólogo experto dominicano. Escribe un dato curioso, breve y asombroso sobre la especie "${organismoActivo.nombre}" (${organismoActivo.cientifico}). Enfócate en su biología o capacidad de regeneración. Máximo 25 palabras.`,
      });
      setDatoCuriosoAI(response.text || "La naturaleza siempre nos sorprende.");
    } catch (err) {
      console.error(err);
      setErrorAI("Error al conectar con la base de datos biológica.");
    } finally {
      setCargandoAI(false);
    }
  };

  const reiniciar = () => {
    setFase(0);
    setCadenaUsuario([]);
    setPasoMitosis(0);
    setDatoCuriosoAI('');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 overflow-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 dna-strand opacity-20 pointer-events-none" />
      
      <div className="w-full max-w-5xl z-10">
        {/* Header */}
        <motion.header 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex flex-col sm:flex-row items-center justify-between mb-8 glass-panel p-6"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-lab-accent/20 rounded-xl">
              <Microscope className="text-lab-accent" size={32} />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold tracking-tight text-white">BIOSIM <span className="text-lab-accent">v2.0</span></h1>
              <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">Laboratorio de Biodiversidad Dominicana</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-6 font-mono text-[10px] text-slate-400">
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="flex items-center gap-2 hover:text-lab-accent transition-colors"
            >
              {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              <span>SOUND: {soundEnabled ? 'ON' : 'OFF'}</span>
            </button>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col items-end">
              <span>STATUS: <span className="text-lab-accent">ONLINE</span></span>
              <span>LATENCY: 24ms</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col items-end">
              <span>USER: {process.env.USER_EMAIL || 'GUEST_STUDENT'}</span>
              <span>SESSION: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </motion.header>

        <main className="relative min-h-[600px] glass-panel overflow-hidden">
          <div className="scanline" />
          
          <AnimatePresence mode="wait">
            {/* FASE 0: SELECCIÓN */}
            {fase === 0 && (
              <motion.div 
                key="intro"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8 h-full flex flex-col"
              >
                <div className="flex items-center gap-2 mb-6">
                  <Database className="text-lab-accent" size={20} />
                  <h2 className="text-xl font-semibold text-white">Selección de Espécimen</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
                  <div className="space-y-4">
                    <p className="text-slate-300 leading-relaxed">
                      Bienvenido al simulador de regeneración celular. Para iniciar el proceso pedagógico, 
                      selecciona un organismo de nuestra base de datos endémica. 
                      Analizaremos su estructura de ADN y simularemos su mitosis.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {ORGANISMOS.map((org) => (
                        <button
                          key={org.id}
                          onClick={() => {
                            triggerSound('click');
                            setOrganismoActivo(org);
                          }}
                          className={`p-4 rounded-xl border transition-all text-left relative overflow-hidden group ${
                            organismoActivo.id === org.id 
                              ? 'border-lab-accent bg-lab-accent/10' 
                              : 'border-white/10 hover:border-white/30 bg-white/5'
                          }`}
                        >
                          <div className="relative z-10">
                            <h3 className="font-bold text-sm text-white">{org.nombre}</h3>
                            <p className="text-[10px] font-mono text-slate-400 italic">{org.cientifico}</p>
                          </div>
                          {organismoActivo.id === org.id && (
                            <motion.div 
                              layoutId="active-bg"
                              className="absolute inset-0 bg-lab-accent/5"
                            />
                          )}
                        </button>
                      ))}
                    </div>
                    <button 
                      onClick={() => {
                        triggerSound('click');
                        setFase(1);
                      }}
                      className="w-full mt-6 bg-lab-accent hover:bg-emerald-500 text-lab-bg font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-lab-accent/20"
                    >
                      INICIAR SECUENCIACIÓN <ArrowRight size={20} />
                    </button>
                  </div>

                  <div className="relative rounded-2xl overflow-hidden border border-white/10 group">
                    <img 
                      src={organismoActivo.imagen} 
                      alt={organismoActivo.nombre}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-lab-bg via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 p-6">
                      <span className="inline-block px-2 py-1 bg-lab-accent text-lab-bg text-[10px] font-bold rounded mb-2">INFO_SPECIMEN</span>
                      <p className="text-sm text-slate-200">{organismoActivo.descripcion}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* FASE 1: REPLICACIÓN ADN */}
            {fase === 1 && (
              <motion.div 
                key="dna"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="p-8 flex flex-col items-center justify-center h-full"
              >
                <div className="text-center mb-12">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono mb-4">
                    <Dna size={14} /> REPLICACIÓN_EN_CURSO
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">Ensamblaje de Nucleótidos</h2>
                  <p className="text-slate-400 max-w-md mx-auto">
                    Completa la cadena complementaria. Recuerda: <span className="text-lab-accent">A-T</span> y <span className="text-blue-400">C-G</span>.
                  </p>
                </div>

                <div className="flex flex-col gap-8 items-center mb-12">
                  {/* DNA Visualizer */}
                  <div className="flex gap-4">
                    {organismoActivo.secuencia.map((base, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-4">
                        <motion.div 
                          initial={{ y: -20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: idx * 0.1 }}
                          className="w-12 h-12 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center font-mono font-bold text-xl text-slate-300"
                        >
                          {base}
                        </motion.div>
                        <div className="w-0.5 h-8 bg-white/10" />
                        <AnimatePresence mode="popLayout">
                          {cadenaUsuario[idx] ? (
                            <motion.div 
                              initial={{ scale: 0, rotate: -45 }}
                              animate={{ scale: 1, rotate: 0 }}
                              className="w-12 h-12 rounded-lg bg-lab-accent/20 border border-lab-accent/50 flex items-center justify-center font-mono font-bold text-xl text-lab-accent"
                            >
                              {cadenaUsuario[idx]}
                            </motion.div>
                          ) : (
                            <motion.div 
                              animate={errorADN && idx === cadenaUsuario.length ? {
                                x: [0, -10, 10, -10, 10, 0],
                                transition: { duration: 0.4 }
                              } : {}}
                              className={`w-12 h-12 rounded-lg border-2 border-dashed flex items-center justify-center font-mono font-bold text-xl relative ${
                                errorADN && idx === cadenaUsuario.length ? 'border-red-500 bg-red-500/10 text-red-500' : 'border-white/10 text-white/10'
                              }`}
                            >
                              {errorADN && idx === cadenaUsuario.length ? (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  exit={{ scale: 0 }}
                                  className="absolute inset-0 flex items-center justify-center"
                                >
                                  <XCircle size={24} className="text-red-500" />
                                </motion.div>
                              ) : '?'}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  {['A', 'T', 'C', 'G'].map(base => (
                    <button
                      key={base}
                      onClick={() => manejarSeleccionBase(base)}
                      disabled={cadenaUsuario.length === organismoActivo.secuencia.length}
                      className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 hover:border-lab-accent hover:bg-lab-accent/10 text-2xl font-bold text-white transition-all transform hover:scale-110 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {base}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* FASE 1.5: REPLICATION BUBBLE */}
            {fase === 1.5 && (
              <motion.div
                key="bubble"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="p-8 flex flex-col items-center justify-center h-full"
              >
                <div className="max-w-4xl w-full flex flex-col items-center text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="mb-8"
                  >
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                      ¿La cadena original de ADN se abría en ciertos puntos para empezar a copiarse?
                    </h2>
                    <p className="text-xl text-lab-accent italic">
                      ¿Cómo crees que se llaman esos puntos de apertura?
                    </p>
                  </motion.div>

                  {/* Animation Container */}
                  <div className="relative w-full h-64 my-12 flex items-center justify-center">
                    <svg viewBox="0 0 800 200" className="w-full h-full overflow-visible">
                      {/* Top Strand */}
                      <motion.path
                        d="M 50 100 Q 200 100, 400 100 T 750 100"
                        animate={{ d: "M 50 100 Q 200 100, 400 20 T 750 100" }}
                        transition={{ duration: 2, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
                        fill="transparent"
                        stroke="#3b82f6"
                        strokeWidth="8"
                        strokeLinecap="round"
                      />
                      {/* Bottom Strand */}
                      <motion.path
                        d="M 50 100 Q 200 100, 400 100 T 750 100"
                        animate={{ d: "M 50 100 Q 200 100, 400 180 T 750 100" }}
                        transition={{ duration: 2, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
                        fill="transparent"
                        stroke="#10b981"
                        strokeWidth="8"
                        strokeLinecap="round"
                      />
                      
                      {/* Base Pairs (Connecting lines) */}
                      {Array.from({ length: 15 }).map((_, i) => {
                        const x = 100 + i * 40;
                        // Calculate distance from center (400)
                        const distFromCenter = Math.abs(x - 400);
                        // Max stretch at center is 80 (from 100 to 20/180)
                        const stretch = Math.max(0, 80 - (distFromCenter * 80 / 300));
                        
                        return (
                          <motion.line
                            key={i}
                            x1={x}
                            y1="100"
                            x2={x}
                            y2="100"
                            animate={{ 
                              y1: 100 - stretch, 
                              y2: 100 + stretch,
                              opacity: stretch > 40 ? 0.2 : 1 
                            }}
                            transition={{ duration: 2, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
                            stroke="rgba(255,255,255,0.3)"
                            strokeWidth="4"
                          />
                        );
                      })}

                      {/* Labels */}
                      <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                      >
                        <text x="400" y="100" fill="white" fontSize="16" textAnchor="middle" className="font-mono" opacity="0.8">
                          BURBUJA DE REPLICACIÓN
                        </text>
                        <text x="250" y="100" fill="#10b981" fontSize="12" textAnchor="middle" className="font-mono">
                          ← HORQUILLA
                        </text>
                        <text x="550" y="100" fill="#3b82f6" fontSize="12" textAnchor="middle" className="font-mono">
                          HORQUILLA →
                        </text>
                      </motion.g>
                    </svg>
                  </div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.5, duration: 0.5 }}
                    className="bg-white/5 border border-white/10 p-6 rounded-2xl max-w-3xl mb-8"
                  >
                    <p className="text-slate-300 leading-relaxed text-lg">
                      ¡Exacto! El ADN no se abre todo a la vez. Se abre en puntos específicos llamados <strong className="text-white">Orígenes de Replicación</strong>. 
                      Al separarse las dos cadenas, se forma una estructura ovalada conocida como <strong className="text-lab-accent">Burbuja de Replicación</strong>. 
                      Los extremos en forma de "Y" donde el ADN se sigue abriendo se llaman <strong className="text-blue-400">Horquillas de Replicación</strong>.
                    </p>
                  </motion.div>

                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2 }}
                    onClick={() => {
                      triggerSound('click');
                      setFase(2);
                    }}
                    className="bg-lab-accent hover:bg-emerald-500 text-lab-bg font-bold py-4 px-12 rounded-xl flex items-center gap-3 transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_50px_rgba(16,185,129,0.5)] text-lg"
                  >
                    CONTINUAR A MITOSIS <ArrowRight size={24} />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* FASE 2: MITOSIS ANIMATION */}
            {fase === 2 && (
              <motion.div 
                key="mitosis"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-8 flex flex-col h-full"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-8">
                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono text-lab-accent uppercase tracking-tighter">SIMULATION_PHASE: {pasoMitosis + 1}/6</span>
                      {manualMode && <span className="text-[10px] font-mono text-blue-400 border border-blue-400/30 px-1 rounded">MANUAL_CONTROL</span>}
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">{INFO_MITOSIS[pasoMitosis].titulo}</h2>
                    <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
                      {INFO_MITOSIS[pasoMitosis].texto}
                    </p>
                    <motion.p 
                      key={pasoMitosis}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-lab-accent text-xs mt-2 font-medium italic"
                    >
                      {INFO_MITOSIS[pasoMitosis].detalle}
                    </motion.p>
                  </div>
                  
                  <div className="flex flex-wrap sm:flex-nowrap gap-2">
                    {INFO_MITOSIS.map((step, i) => (
                      <button 
                        key={i} 
                        onClick={() => seleccionarPasoMitosis(i)}
                        className={`group relative flex flex-col items-center gap-1 transition-all ${i === pasoMitosis ? 'scale-110' : 'opacity-50 hover:opacity-80'}`}
                      >
                        <div className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-all ${
                          i === pasoMitosis ? 'bg-lab-accent border-lab-accent text-lab-bg shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-white/5 border-white/10 text-white'
                        }`}>
                          <span className="text-xs font-bold">{i + 1}</span>
                        </div>
                        <span className="text-[8px] font-mono uppercase hidden sm:block">{step.titulo.substring(0, 3)}</span>
                        {i === pasoMitosis && (
                          <motion.div 
                            layoutId="step-indicator"
                            className="absolute -bottom-2 w-1 h-1 bg-lab-accent rounded-full"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-grow flex items-center justify-center relative">
                  {/* Mitosis Visualizer */}
                  <div className="relative w-full max-w-lg h-80 flex items-center justify-center">
                    
                    {/* The Cell(s) */}
                    <AnimatePresence mode="wait">
                      {pasoMitosis < 4 ? (
                        <motion.div 
                          key="single-cell"
                          layout
                          className={`relative border-2 transition-all duration-700 flex items-center justify-center overflow-hidden ${
                            INFO_MITOSIS[pasoMitosis].highlight === 'nucleus' ? 'shadow-[0_0_60px_rgba(16,185,129,0.2)] border-lab-accent/50 bg-lab-accent/10' : 'border-lab-accent/30 bg-lab-accent/5'
                          }`}
                          animate={{
                            width: pasoMitosis === 3 ? 420 : 220,
                            height: 220,
                            borderRadius: pasoMitosis === 3 ? "110px" : "110px",
                          }}
                          transition={{ duration: 1, ease: "easeInOut" }}
                        >
                          {/* Spindle Fibers (Visible in Metaphase/Anaphase) */}
                          {(pasoMitosis === 2 || pasoMitosis === 3) && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
                              <div className="w-full h-px bg-lab-accent/50 blur-[1px]" />
                              <div className="w-full h-px bg-lab-accent/50 blur-[1px] rotate-12" />
                              <div className="w-full h-px bg-lab-accent/50 blur-[1px] -rotate-12" />
                            </div>
                          )}

                          {/* Nucleus / Chromosomes */}
                          <motion.div 
                            className={`relative flex items-center justify-center transition-all duration-700 ${
                              INFO_MITOSIS[pasoMitosis].highlight === 'chromosomes' ? 'scale-110 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]' : ''
                            }`}
                            animate={{
                              gap: pasoMitosis === 3 ? "180px" : "0px",
                            }}
                          >
                            {/* Left set */}
                            <motion.div className="flex flex-col gap-3">
                              {[1, 2, 3, 4].map(i => (
                                <motion.div 
                                  key={i}
                                  className={`w-10 h-2.5 rounded-full transition-colors duration-500 ${
                                    INFO_MITOSIS[pasoMitosis].highlight === 'separation' ? 'bg-white shadow-[0_0_10px_white]' : 'bg-lab-accent'
                                  }`}
                                  animate={{
                                    rotate: pasoMitosis === 2 ? 90 : (pasoMitosis === 3 ? -45 : 0),
                                    opacity: pasoMitosis === 0 ? 0.4 : 1,
                                    scale: pasoMitosis === 1 ? 1.2 : 1
                                  }}
                                />
                              ))}
                            </motion.div>
                            {/* Right set (only visible from Metaphase) */}
                            {pasoMitosis >= 2 && (
                              <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col gap-3"
                              >
                                {[1, 2, 3, 4].map(i => (
                                  <motion.div 
                                    key={i}
                                    className={`w-10 h-2.5 rounded-full transition-colors duration-500 ${
                                      INFO_MITOSIS[pasoMitosis].highlight === 'separation' ? 'bg-white shadow-[0_0_10px_white]' : 'bg-lab-accent'
                                    }`}
                                    animate={{
                                      rotate: pasoMitosis === 2 ? 90 : (pasoMitosis === 3 ? 45 : 0),
                                    }}
                                  />
                                ))}
                              </motion.div>
                            )}
                          </motion.div>
                          
                          {/* Nucleus boundary (Interfase/Profase) */}
                          {pasoMitosis <= 1 && (
                            <motion.div 
                              className={`absolute w-32 h-32 rounded-full border-2 border-dashed transition-all duration-1000 ${
                                pasoMitosis === 1 ? 'opacity-20 scale-150 border-red-400' : 'opacity-40 scale-100 border-lab-accent'
                              }`}
                            />
                          )}
                        </motion.div>
                      ) : (
                        <div className="flex gap-16">
                          {[1, 2].map(i => (
                            <motion.div 
                              key={i}
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ 
                                scale: 1, 
                                opacity: 1,
                                boxShadow: INFO_MITOSIS[pasoMitosis].highlight === 'new-nuclei' ? "0 0 30px rgba(16,185,129,0.3)" : "none"
                              }}
                              className="w-44 h-44 rounded-full bg-lab-accent/10 border-2 border-lab-accent/40 flex items-center justify-center shadow-lg relative"
                            >
                              <motion.div 
                                animate={{
                                  scale: pasoMitosis === 5 ? [1, 1.1, 1] : 1
                                }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="w-20 h-20 rounded-full bg-lab-accent/20 border border-lab-accent/50 flex items-center justify-center"
                              >
                                <Dna className="text-lab-accent" size={32} />
                              </motion.div>
                              {pasoMitosis === 5 && (
                                <motion.div 
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="absolute -top-4 bg-lab-accent text-lab-bg text-[8px] font-bold px-2 py-0.5 rounded"
                                >
                                  CÉLULA_HIJA_0{i}
                                </motion.div>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="mt-8 flex justify-center">
                  {vistoTodo ? (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => {
                        triggerSound('click');
                        setFase(3);
                      }}
                      className="bg-lab-accent hover:bg-emerald-500 text-lab-bg font-bold py-3 px-10 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-lab-accent/20"
                    >
                      FINALIZAR SIMULACIÓN <ArrowRight size={20} />
                    </motion.button>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-500 font-mono text-[10px] animate-pulse">
                      <Loader2 size={12} className="animate-spin" />
                      PROCESANDO_DIVISIÓN_CELULAR...
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* FASE 3: RESULTADOS */}
            {fase === 3 && (
              <motion.div 
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 h-full flex flex-col"
              >
                <div className="flex items-center gap-3 mb-8">
                  <CheckCircle className="text-lab-accent" size={32} />
                  <div>
                    <h2 className="text-3xl font-bold text-white">Ciclo Completado</h2>
                    <p className="text-slate-400">Regeneración exitosa del espécimen.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-grow">
                  <div className="space-y-6">
                    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                      <h3 className="text-sm font-mono text-lab-accent mb-4 flex items-center gap-2">
                        <Info size={14} /> REPORTE_BIOLÓGICO
                      </h3>
                      <div className="flex items-center gap-4 mb-4">
                        <img 
                          src={organismoActivo.imagen} 
                          className="w-20 h-20 rounded-xl object-cover border border-white/10"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h4 className="text-xl font-bold text-white">{organismoActivo.nombre}</h4>
                          <p className="text-sm text-slate-400 italic">{organismoActivo.cientifico}</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {organismoActivo.descripcion}
                      </p>
                    </div>

                    <div className="flex gap-4">
                      <button 
                        onClick={() => {
                          triggerSound('click');
                          reiniciar();
                        }}
                        className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-xl border border-white/10 flex items-center justify-center gap-2 transition-all"
                      >
                        <RefreshCcw size={20} /> NUEVO ANÁLISIS
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <div className="flex-grow p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Sparkles size={80} />
                      </div>
                      
                      <h3 className="text-sm font-mono text-indigo-400 mb-4 flex items-center gap-2">
                        <Sparkles size={14} /> GEMINI_INSIGHT
                      </h3>

                      {!datoCuriosoAI && !cargandoAI && (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                          <p className="text-slate-300 mb-6">¿Quieres profundizar en la genética de esta especie?</p>
                          <button 
                            onClick={() => {
                              triggerSound('click');
                              generarDatoCurioso();
                            }}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
                          >
                            GENERAR DATO CURIOSO
                          </button>
                        </div>
                      )}

                      {cargandoAI && (
                        <div className="h-full flex flex-col items-center justify-center">
                          <Loader2 className="animate-spin text-indigo-400 mb-4" size={40} />
                          <p className="text-indigo-400 font-mono text-xs animate-pulse">PROCESANDO_DATOS_IA...</p>
                        </div>
                      )}

                      {datoCuriosoAI && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-4"
                        >
                          <p className="text-lg text-indigo-100 italic leading-relaxed">
                            "{datoCuriosoAI}"
                          </p>
                          <div className="pt-4 border-t border-indigo-500/20">
                            <p className="text-[10px] font-mono text-indigo-400">FUENTE: GOOGLE_GEMINI_3_FLASH</p>
                          </div>
                        </motion.div>
                      )}

                      {errorAI && (
                        <div className="flex items-center gap-2 text-red-400 text-sm">
                          <AlertCircle size={16} />
                          <span>{errorAI}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer Stats */}
        <footer className="mt-6 flex justify-between items-center px-6 py-4 glass-panel text-[10px] font-mono text-slate-500">
          <div className="flex gap-8">
            <span>GENETIC_STABILITY: 99.8%</span>
            <span>CELL_VIABILITY: OPTIMAL</span>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-lab-accent animate-pulse" />
              <span>LIVE_FEED</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
