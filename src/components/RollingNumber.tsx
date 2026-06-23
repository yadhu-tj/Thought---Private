import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';

interface RollingDigitProps {
  digit: string;
  isMobile: boolean;
}

function RollingDigit({ digit, isMobile }: RollingDigitProps) {
  const isNumber = /^[0-9]$/.test(digit);

  if (!isNumber) {
    return (
      <span className="text-white font-sans text-6xl md:text-8xl font-black select-none leading-none px-0.5 bg-gradient-to-b from-white to-white/20 bg-clip-text text-transparent">
        {digit}
      </span>
    );
  }

  const num = parseInt(digit, 10);
  const size = isMobile ? 80 : 110;

  return (
    <div className="relative overflow-hidden h-20 md:h-28 w-11 md:w-16 flex justify-center">
      <motion.div
        className="absolute top-0 left-0 right-0 flex flex-col"
        animate={{ y: -num * size }}
        transition={{
          type: "spring",
          stiffness: 110,
          damping: 14,
          mass: 0.8,
        }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((val) => (
          <div
            key={val}
            className="h-20 md:h-28 flex items-center justify-center text-white font-sans text-6xl md:text-8xl font-black tracking-tighter select-none leading-none bg-gradient-to-b from-white to-white/20 bg-clip-text text-transparent"
          >
            {val}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

interface RollingNumberProps {
  value: number;
}

export function RollingNumber({ value }: RollingNumberProps) {
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  const valueStr = value.toLocaleString(undefined, { useGrouping: true });
  const digits = valueStr.split('');

  return (
    <div className="flex items-center justify-center flex-row h-24 md:h-32 overflow-hidden bg-transparent px-4 py-1">
      <AnimatePresence mode="popLayout">
        {digits.map((char, index) => (
          <motion.div
            key={`${index}-${char}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="flex items-center justify-center"
          >
            <RollingDigit digit={char} isMobile={isMobile} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
