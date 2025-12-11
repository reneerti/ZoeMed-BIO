import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import splashLogo from "@/assets/zoemedbio-splash-logo.png";

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500);
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-[hsl(var(--blue-primary))] via-[hsl(var(--blue-dark))] to-[hsl(220,60%,30%)]"
        >
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.2, 0.1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-white/10 blur-3xl"
            />
            <motion.div
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.15, 0.25, 0.15],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-white/10 blur-3xl"
            />
          </div>

          {/* Logo and branding */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 20,
              delay: 0.2,
            }}
            className="relative z-10 flex flex-col items-center"
          >
            {/* Logo with enhanced animations */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 150,
                damping: 15,
                delay: 0.3,
              }}
              className="relative"
            >
              {/* Pulse rings */}
              <motion.div
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 rounded-full border-2 border-white/30"
                style={{ margin: "-20px" }}
              />
              <motion.div
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 0, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
                className="absolute inset-0 rounded-full border-2 border-white/20"
                style={{ margin: "-40px" }}
              />
              
              {/* Main logo with glow and pulse */}
              <motion.div
                animate={{
                  filter: [
                    "drop-shadow(0 0 20px rgba(255,255,255,0.3))",
                    "drop-shadow(0 0 50px rgba(255,255,255,0.6))",
                    "drop-shadow(0 0 20px rgba(255,255,255,0.3))",
                  ],
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="max-w-xs sm:max-w-sm md:max-w-md"
              >
                <img
                  src={splashLogo}
                  alt="ZOEMEDBio - Saúde Inteligente"
                  className="w-full h-auto object-contain"
                />
              </motion.div>
            </motion.div>

            {/* Loading indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-10 flex flex-col items-center gap-3"
            >
              <div className="flex gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: "easeInOut",
                    }}
                    className="w-2.5 h-2.5 rounded-full bg-white"
                  />
                ))}
              </div>
              <span className="text-white/60 text-xs">Carregando...</span>
            </motion.div>
          </motion.div>

          {/* Bottom branding */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="absolute bottom-8 text-white/40 text-xs"
          >
            © 2025 ZOEMEDBio
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
