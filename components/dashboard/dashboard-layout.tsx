"use client";

import { motion } from "framer-motion";

interface DashboardLayoutProps {
  agentToggle: React.ReactNode;
  statCards: React.ReactNode;
  savingsPredictorCard: React.ReactNode;
  energyFlow: React.ReactNode;
  agentTerminal: React.ReactNode;
  powerCharts: React.ReactNode;
  heatmap: React.ReactNode;
}

/**
 * Bento grid layout for the professional dashboard
 * Responsive design: 1 col on mobile, 3 cols on tablet, 6 cols on desktop
 */
export function DashboardLayout({
  agentToggle,
  statCards,
  savingsPredictorCard,
  energyFlow,
  agentTerminal,
  powerCharts,
  heatmap,
}: DashboardLayoutProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  return (
    <motion.div
      className="grid gap-4 auto-rows-max
        grid-cols-1 md:grid-cols-3 lg:grid-cols-6 mb-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Row 1: Agent Toggle (spans 2 cols on md, 2 on lg) */}
      <motion.div className="md:col-span-2 lg:col-span-2" variants={itemVariants}>
        {agentToggle}
      </motion.div>

      {/* Row 1: Stats Cards (spans 1 col on md, 2 on lg) */}
      <motion.div className="md:col-span-1 lg:col-span-2" variants={itemVariants}>
        <div className="space-y-3">{statCards}</div>
      </motion.div>

      {/* Row 1: Savings Predictor (spans 1 col on md, 2 on lg) */}
      <motion.div className="md:col-span-1 lg:col-span-2" variants={itemVariants}>
        {savingsPredictorCard}
      </motion.div>

      {/* Row 2: Energy Flow (spans 2 cols on md, 3 on lg) */}
      <motion.div className="md:col-span-2 lg:col-span-3" variants={itemVariants}>
        {energyFlow}
      </motion.div>

      {/* Row 2: Agent Terminal (spans 1 col on md, 3 on lg) */}
      <motion.div className="md:col-span-1 lg:col-span-3" variants={itemVariants}>
        {agentTerminal}
      </motion.div>

      {/* Row 3: Power Charts (full width) */}
      <motion.div className="col-span-1 md:col-span-3 lg:col-span-6" variants={itemVariants}>
        {powerCharts}
      </motion.div>

      {/* Row 4: Heatmap (full width) */}
      <motion.div className="col-span-1 md:col-span-3 lg:col-span-6" variants={itemVariants}>
        {heatmap}
      </motion.div>
    </motion.div>
  );
}
