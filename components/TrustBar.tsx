'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  getTrustLevel, 
  getTrustColor, 
  getTrustDescription, 
  TRUST_CONSTANTS 
} from '@/lib/trust';

interface TrustBarProps {
  score: number;
  showLabel?: boolean;
  showDescription?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  animated?: boolean;
}

export const TrustBar: React.FC<TrustBarProps> = ({
  score,
  showLabel = true,
  showDescription = false,
  size = 'md',
  className = '',
  animated = true
}) => {
  const level = getTrustLevel(score);
  const color = getTrustColor(score);
  const description = getTrustDescription(score);
  
  // Calculate percentage for visual representation
  const percentage = (score / TRUST_CONSTANTS.MAX_SCORE) * 100;
  
  // Size configurations
  const sizeConfig = {
    sm: {
      height: 'h-2',
      textSize: 'text-xs',
      padding: 'px-2 py-1'
    },
    md: {
      height: 'h-3',
      textSize: 'text-sm',
      padding: 'px-3 py-1.5'
    },
    lg: {
      height: 'h-4',
      textSize: 'text-base',
      padding: 'px-4 py-2'
    }
  };
  
  const config = sizeConfig[size];
  
  // Trust level icons
  const getTrustIcon = (level: string) => {
    switch (level) {
      case 'critical': return '⚠️';
      case 'low': return '🔶';
      case 'medium': return '🟡';
      case 'high': return '✅';
      default: return '❓';
    }
  };

  return (
    <div className={`trust-bar ${className}`}>
      {/* Header with score and label */}
      {showLabel && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getTrustIcon(level)}</span>
            <span className={`font-semibold ${config.textSize}`}>
              Trust Score
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span 
              className={`font-bold ${config.textSize}`}
              style={{ color }}
            >
              {score}
            </span>
            <span className={`text-gray-500 ${config.textSize}`}>
              / {TRUST_CONSTANTS.MAX_SCORE}
            </span>
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className={`relative bg-gray-200 rounded-full ${config.height} overflow-hidden`}>
        {/* Background gradient for different trust levels */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200" />
        
        {/* Animated progress fill */}
        <motion.div
          className={`absolute left-0 top-0 ${config.height} rounded-full`}
          style={{ backgroundColor: color }}
          initial={animated ? { width: 0 } : { width: `${percentage}%` }}
          animate={{ width: `${percentage}%` }}
          transition={{ 
            duration: animated ? 1.5 : 0, 
            ease: "easeOut",
            delay: animated ? 0.2 : 0
          }}
        />
        
        {/* Threshold markers */}
        <div className="absolute inset-0 flex">
          {/* Low threshold marker */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-gray-400 opacity-50"
            style={{ left: `${(TRUST_CONSTANTS.THRESHOLD_LOW / TRUST_CONSTANTS.MAX_SCORE) * 100}%` }}
          />
          {/* Medium threshold marker */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-gray-400 opacity-50"
            style={{ left: `${(TRUST_CONSTANTS.THRESHOLD_MEDIUM / TRUST_CONSTANTS.MAX_SCORE) * 100}%` }}
          />
          {/* High threshold marker */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-gray-400 opacity-50"
            style={{ left: `${(TRUST_CONSTANTS.THRESHOLD_HIGH / TRUST_CONSTANTS.MAX_SCORE) * 100}%` }}
          />
        </div>
      </div>

      {/* Trust level badge */}
      <div className="flex items-center justify-between mt-2">
        <motion.div
          className={`inline-flex items-center ${config.padding} rounded-full text-white font-medium ${config.textSize}`}
          style={{ backgroundColor: color }}
          initial={animated ? { scale: 0, opacity: 0 } : {}}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            duration: animated ? 0.5 : 0, 
            delay: animated ? 1 : 0 
          }}
        >
          <span className="mr-1">{getTrustIcon(level)}</span>
          {level.charAt(0).toUpperCase() + level.slice(1)} Trust
        </motion.div>
        
        {/* Percentage display */}
        <span className={`text-gray-600 ${config.textSize}`}>
          {Math.round(percentage)}%
        </span>
      </div>

      {/* Description */}
      {showDescription && (
        <motion.p 
          className={`text-gray-600 mt-2 ${config.textSize}`}
          initial={animated ? { opacity: 0, y: 10 } : {}}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: animated ? 0.5 : 0, 
            delay: animated ? 1.2 : 0 
          }}
        >
          {description}
        </motion.p>
      )}
    </div>
  );
};

// Compact version for cards and lists
export const TrustBadge: React.FC<{
  score: number;
  size?: 'xs' | 'sm' | 'md';
  showScore?: boolean;
}> = ({ score, size = 'sm', showScore = true }) => {
  const level = getTrustLevel(score);
  const color = getTrustColor(score);
  
  const sizeConfig = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm'
  };
  
  const getTrustIcon = (level: string) => {
    switch (level) {
      case 'critical': return '⚠️';
      case 'low': return '🔶';
      case 'medium': return '🟡';
      case 'high': return '✅';
      default: return '❓';
    }
  };

  return (
    <div 
      className={`inline-flex items-center rounded-full text-white font-medium ${sizeConfig[size]}`}
      style={{ backgroundColor: color }}
    >
      <span className="mr-1">{getTrustIcon(level)}</span>
      {showScore ? score : level}
    </div>
  );
};

// Mini trust indicator for avatars
export const TrustIndicator: React.FC<{
  score: number;
  className?: string;
}> = ({ score, className = '' }) => {
  const level = getTrustLevel(score);
  const color = getTrustColor(score);
  
  const getTrustIcon = (level: string) => {
    switch (level) {
      case 'critical': return '⚠️';
      case 'low': return '🔶';
      case 'medium': return '🟡';
      case 'high': return '✅';
      default: return '❓';
    }
  };

  return (
    <div 
      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${className}`}
      style={{ backgroundColor: color }}
      title={`Trust Score: ${score} (${level})`}
    >
      <span className="text-white font-bold">{score}</span>
    </div>
  );
};

export default TrustBar;