import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export const GlassCard = ({
  children,
  className = '',
  delay = 0,
  direction = 'up',
}: GlassCardProps) => {
  const variants = {
    hidden: {
      opacity: 0,
      y: direction === 'up' ? 50 : direction === 'down' ? -50 : 0,
      x: direction === 'left' ? 50 : direction === 'right' ? -50 : 0,
      scale: 0.9,
      rotateX: 15,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      rotateX: 0,
      transition: {
        duration: 0.8,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  return (
    <motion.div
      className={`backdrop-blur-md bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl ${className}`}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      whileHover={{
        scale: 1.02,
        rotateY: 2,
        transition: { duration: 0.3 },
      }}
    >
      <div className="p-6">
        {children}
      </div>
    </motion.div>
  );
};

// Компонент для анимированной карточки с градиентом
export const GradientCard = ({
  children,
  className = '',
  delay = 0,
  gradient = 'from-mystical-500 to-accent-500',
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  gradient?: string;
}) => {
  return (
    <motion.div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6 }}
      whileHover={{
        scale: 1.05,
        transition: { duration: 0.3 },
      }}
    >
      <motion.div
        className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-20`}
        animate={{
          background: [
            `linear-gradient(45deg, var(--${gradient.split('-')[1]}-500), var(--${gradient.split('-')[3]}-500))`,
            `linear-gradient(45deg, var(--${gradient.split('-')[3]}-500), var(--${gradient.split('-')[1]}-500))`,
            `linear-gradient(45deg, var(--${gradient.split('-')[1]}-500), var(--${gradient.split('-')[3]}-500))`,
          ],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <div className="relative z-10 p-6 bg-white/80 dark:bg-black/80 backdrop-blur-sm rounded-2xl">
        {children}
      </div>
    </motion.div>
  );
};

// Компонент для анимированной карточки с подсветкой
export const GlowCard = ({
  children,
  className = '',
  delay = 0,
  glowColor = 'mystical',
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  glowColor?: string;
}) => {
  return (
    <motion.div
      className={`relative group ${className}`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6 }}
    >
      <motion.div
        className={`absolute inset-0 bg-gradient-to-r from-${glowColor}-500/20 to-accent-500/20 rounded-2xl blur-xl`}
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        {children}
      </div>
    </motion.div>
  );
}; 