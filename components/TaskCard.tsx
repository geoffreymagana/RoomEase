'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format, isOverdue, isPast } from 'date-fns';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  UserIcon,
  CalendarIcon,
  FlagIcon
} from '@heroicons/react/24/outline';
import { Chore, ChoreStatus, User } from '@/types';
import { TrustBadge } from './TrustBar';

interface TaskCardProps {
  chore: Chore;
  assignedUser?: User;
  currentUserId?: string;
  onMarkComplete?: (choreId: string) => void;
  onDispute?: (choreId: string) => void;
  onConfirm?: (choreId: string) => void;
  onEdit?: (choreId: string) => void;
  className?: string;
  compact?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  chore,
  assignedUser,
  currentUserId,
  onMarkComplete,
  onDispute,
  onConfirm,
  onEdit,
  className = '',
  compact = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Status configurations
  const getStatusConfig = (status: ChoreStatus) => {
    switch (status) {
      case 'pending':
        return { 
          color: 'bg-gray-100 text-gray-700 border-gray-200', 
          icon: ClockIcon, 
          label: 'Pending' 
        };
      case 'in_progress':
        return { 
          color: 'bg-blue-100 text-blue-700 border-blue-200', 
          icon: ClockIcon, 
          label: 'In Progress' 
        };
      case 'completed':
        return { 
          color: 'bg-green-100 text-green-700 border-green-200', 
          icon: CheckCircleIcon, 
          label: 'Completed' 
        };
      case 'confirmed':
        return { 
          color: 'bg-emerald-100 text-emerald-700 border-emerald-200', 
          icon: CheckCircleIcon, 
          label: 'Confirmed' 
        };
      case 'disputed':
        return { 
          color: 'bg-red-100 text-red-700 border-red-200', 
          icon: ExclamationTriangleIcon, 
          label: 'Disputed' 
        };
      case 'overdue':
        return { 
          color: 'bg-red-100 text-red-700 border-red-200', 
          icon: ExclamationTriangleIcon, 
          label: 'Overdue' 
        };
      case 'skipped':
        return { 
          color: 'bg-gray-100 text-gray-700 border-gray-200', 
          icon: ExclamationTriangleIcon, 
          label: 'Skipped' 
        };
      default:
        return { 
          color: 'bg-gray-100 text-gray-700 border-gray-200', 
          icon: ClockIcon, 
          label: 'Unknown' 
        };
    }
  };

  // Priority configurations
  const getPriorityConfig = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high':
        return { color: 'text-red-600', icon: '🔥', label: 'High' };
      case 'medium':
        return { color: 'text-yellow-600', icon: '⚡', label: 'Medium' };
      case 'low':
        return { color: 'text-green-600', icon: '🌱', label: 'Low' };
    }
  };

  const statusConfig = getStatusConfig(chore.status);
  const priorityConfig = getPriorityConfig(chore.priority);
  const StatusIcon = statusConfig.icon;
  
  const isOverdueTask = isPast(chore.dueDate) && !['completed', 'confirmed'].includes(chore.status);
  const isAssignedToCurrentUser = chore.assignedTo === currentUserId;
  
  // Actions available based on status and user
  const canMarkComplete = isAssignedToCurrentUser && ['pending', 'in_progress'].includes(chore.status);
  const canDispute = !isAssignedToCurrentUser && chore.status === 'completed';
  const canConfirm = !isAssignedToCurrentUser && chore.status === 'completed';
  const canEdit = isAssignedToCurrentUser && ['pending', 'in_progress'].includes(chore.status);

  return (
    <motion.div
      className={`bg-white rounded-xl shadow-card border ${isOverdueTask ? 'border-red-200' : 'border-gray-200'} ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2, shadow: '0 8px 25px -5px rgba(0, 0, 0, 0.1)' }}
    >
      <div className={`p-4 ${compact ? 'pb-2' : ''}`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {chore.title}
              </h3>
              <span className="text-lg">{priorityConfig.icon}</span>
            </div>
            
            {chore.description && !compact && (
              <p className="text-gray-600 text-sm line-clamp-2">
                {chore.description}
              </p>
            )}
          </div>
          
          {/* Status badge */}
          <div className={`px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
            <div className="flex items-center space-x-1">
              <StatusIcon className="w-3 h-3" />
              <span>{statusConfig.label}</span>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <div className="flex items-center space-x-4">
            {/* Assigned user */}
            <div className="flex items-center space-x-1">
              <UserIcon className="w-4 h-4" />
              <span>{assignedUser?.name || 'Unknown'}</span>
              {assignedUser && (
                <TrustBadge score={assignedUser.trustScore} size="xs" showScore={false} />
              )}
            </div>
            
            {/* Due date */}
            <div className={`flex items-center space-x-1 ${isOverdueTask ? 'text-red-600 font-medium' : ''}`}>
              <CalendarIcon className="w-4 h-4" />
              <span>
                {isOverdueTask ? 'Overdue: ' : 'Due: '}
                {format(chore.dueDate, 'MMM d, h:mm a')}
              </span>
            </div>
            
            {/* Estimated time */}
            {chore.estimatedTime && (
              <div className="flex items-center space-x-1">
                <ClockIcon className="w-4 h-4" />
                <span>{chore.estimatedTime}m</span>
              </div>
            )}
          </div>
          
          {/* Priority */}
          <div className={`flex items-center space-x-1 ${priorityConfig.color}`}>
            <FlagIcon className="w-4 h-4" />
            <span className="font-medium">{priorityConfig.label}</span>
          </div>
        </div>

        {/* Recurring indicator */}
        {chore.recurring && (
          <div className="flex items-center space-x-1 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full mb-3 w-fit">
            <span>🔄</span>
            <span>Recurring</span>
          </div>
        )}

        {/* Expanded details */}
        {isExpanded && !compact && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t pt-3 mt-3"
          >
            {/* Category */}
            {chore.category && (
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm font-medium text-gray-700">Category:</span>
                <span 
                  className="px-2 py-1 rounded text-xs font-medium text-white"
                  style={{ backgroundColor: chore.category.color }}
                >
                  {chore.category.icon} {chore.category.name}
                </span>
              </div>
            )}
            
            {/* Trust impact */}
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-sm font-medium text-gray-700">Trust Impact:</span>
              <span className={`text-sm ${chore.trustImpact > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {chore.trustImpact > 0 ? '+' : ''}{chore.trustImpact} points
              </span>
            </div>
            
            {/* Completion details */}
            {chore.completedAt && (
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm font-medium text-gray-700">Completed:</span>
                <span className="text-sm text-gray-600">
                  {format(chore.completedAt, 'MMM d, h:mm a')}
                </span>
              </div>
            )}
            
            {/* Dispute information */}
            {chore.status === 'disputed' && chore.disputeReason && (
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-red-800 mb-1">Dispute Reason:</p>
                <p className="text-sm text-red-700">{chore.disputeReason}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Actions */}
        {!compact && (
          <div className="flex items-center justify-between pt-3 border-t">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              {isExpanded ? 'Show Less' : 'Show More'}
            </button>
            
            <div className="flex items-center space-x-2">
              {canEdit && onEdit && (
                <button
                  onClick={() => onEdit(chore.id)}
                  className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                >
                  Edit
                </button>
              )}
              
              {canMarkComplete && onMarkComplete && (
                <button
                  onClick={() => onMarkComplete(chore.id)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors"
                >
                  Mark Complete
                </button>
              )}
              
              {canConfirm && onConfirm && (
                <button
                  onClick={() => onConfirm(chore.id)}
                  className="px-3 py-1 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors"
                >
                  Confirm
                </button>
              )}
              
              {canDispute && onDispute && (
                <button
                  onClick={() => onDispute(chore.id)}
                  className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                >
                  Dispute
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Compact version for lists
export const CompactTaskCard: React.FC<TaskCardProps> = (props) => {
  return <TaskCard {...props} compact={true} className="mb-2" />;
};

export default TaskCard;