import { TrustAction, TrustActionType, User, Chore, ChoreStatus } from '@/types';
import { createDocument, updateDocument, getDocuments, runFirestoreTransaction } from './firebase';

// Trust score constants
export const TRUST_CONSTANTS = {
  INITIAL_SCORE: 100,
  MIN_SCORE: 0,
  MAX_SCORE: 150,
  THRESHOLD_LOW: 30,
  THRESHOLD_MEDIUM: 70,
  THRESHOLD_HIGH: 100,
  
  // Point values for different actions
  POINTS: {
    CHORE_COMPLETED: 2,
    CHORE_CONFIRMED: 1,
    CHORE_DISPUTED_VALID: -5, // when dispute is valid (user lied)
    CHORE_DISPUTED_INVALID: -1, // when dispute is invalid (false accusation)
    FALSE_COMPLETION: -10,
    BILL_PAID_ON_TIME: 3,
    BILL_PAID_LATE: -2,
    HELPFUL_ACTION: 5,
    WEEKLY_CONSISTENCY_BONUS: 5, // for completing all weekly chores
    MONTHLY_RELIABILITY_BONUS: 10, // for high completion rate
  }
};

/**
 * Calculate trust level based on score
 */
export const getTrustLevel = (score: number): 'critical' | 'low' | 'medium' | 'high' => {
  if (score < TRUST_CONSTANTS.THRESHOLD_LOW) return 'critical';
  if (score < TRUST_CONSTANTS.THRESHOLD_MEDIUM) return 'low';
  if (score < TRUST_CONSTANTS.THRESHOLD_HIGH) return 'medium';
  return 'high';
};

/**
 * Get trust level color for UI
 */
export const getTrustColor = (score: number): string => {
  const level = getTrustLevel(score);
  switch (level) {
    case 'critical': return '#dc2626'; // red-600
    case 'low': return '#ef4444'; // red-500
    case 'medium': return '#f59e0b'; // amber-500
    case 'high': return '#10b981'; // emerald-500
    default: return '#6b7280'; // gray-500
  }
};

/**
 * Get trust level description
 */
export const getTrustDescription = (score: number): string => {
  const level = getTrustLevel(score);
  switch (level) {
    case 'critical': 
      return 'Critical - Limited privileges, requires supervision';
    case 'low': 
      return 'Low - Some restrictions may apply';
    case 'medium': 
      return 'Medium - Good standing with room';
    case 'high': 
      return 'High - Excellent reliability and trustworthiness';
    default: 
      return 'Unknown';
  }
};

/**
 * Check if user can perform action based on trust score
 */
export const canPerformAction = (
  score: number, 
  action: 'create_chore' | 'dispute_chore' | 'manage_bills' | 'invite_members' | 'delete_items'
): boolean => {
  const level = getTrustLevel(score);
  
  switch (action) {
    case 'create_chore':
      return level !== 'critical';
    case 'dispute_chore':
      return score >= TRUST_CONSTANTS.THRESHOLD_LOW;
    case 'manage_bills':
      return score >= TRUST_CONSTANTS.THRESHOLD_MEDIUM;
    case 'invite_members':
      return score >= TRUST_CONSTANTS.THRESHOLD_HIGH;
    case 'delete_items':
      return score >= TRUST_CONSTANTS.THRESHOLD_MEDIUM;
    default:
      return true;
  }
};

/**
 * Calculate trust score change for an action
 */
export const calculateTrustChange = (
  actionType: TrustActionType,
  context?: {
    isRecurring?: boolean;
    wasOnTime?: boolean;
    consecutiveCount?: number;
    disputeWasValid?: boolean;
  }
): number => {
  let basePoints = 0;
  
  switch (actionType) {
    case 'chore_completed':
      basePoints = TRUST_CONSTANTS.POINTS.CHORE_COMPLETED;
      // Bonus for recurring chores
      if (context?.isRecurring) basePoints += 1;
      // Bonus for consecutive completions
      if (context?.consecutiveCount && context.consecutiveCount >= 5) {
        basePoints += Math.min(context.consecutiveCount - 4, 3);
      }
      break;
      
    case 'chore_confirmed':
      basePoints = TRUST_CONSTANTS.POINTS.CHORE_CONFIRMED;
      break;
      
    case 'chore_disputed_valid':
      basePoints = TRUST_CONSTANTS.POINTS.CHORE_DISPUTED_VALID;
      break;
      
    case 'chore_disputed_invalid':
      basePoints = TRUST_CONSTANTS.POINTS.CHORE_DISPUTED_INVALID;
      break;
      
    case 'false_completion':
      basePoints = TRUST_CONSTANTS.POINTS.FALSE_COMPLETION;
      break;
      
    case 'bill_paid_on_time':
      basePoints = context?.wasOnTime 
        ? TRUST_CONSTANTS.POINTS.BILL_PAID_ON_TIME 
        : TRUST_CONSTANTS.POINTS.BILL_PAID_LATE;
      break;
      
    case 'bill_paid_late':
      basePoints = TRUST_CONSTANTS.POINTS.BILL_PAID_LATE;
      break;
      
    case 'helpful_action':
      basePoints = TRUST_CONSTANTS.POINTS.HELPFUL_ACTION;
      break;
      
    default:
      basePoints = 0;
  }
  
  return basePoints;
};

/**
 * Apply trust score change to user
 */
export const adjustTrustScore = async (
  userId: string,
  roomId: string,
  actionType: TrustActionType,
  reason: string,
  relatedId?: string,
  createdBy?: string,
  context?: {
    isRecurring?: boolean;
    wasOnTime?: boolean;
    consecutiveCount?: number;
    disputeWasValid?: boolean;
  }
): Promise<{ success: boolean; newScore?: number; error?: string }> => {
  try {
    const pointChange = calculateTrustChange(actionType, context);
    
    // Use transaction to ensure consistency
    const result = await runFirestoreTransaction(async (transaction) => {
      // Get current user data
      const userRef = transaction.get(doc(db, 'users', userId));
      const userData = (await userRef).data() as User;
      
      if (!userData) {
        throw new Error('User not found');
      }
      
      // Calculate new score with bounds
      const currentScore = userData.trustScore || TRUST_CONSTANTS.INITIAL_SCORE;
      const newScore = Math.max(
        TRUST_CONSTANTS.MIN_SCORE,
        Math.min(TRUST_CONSTANTS.MAX_SCORE, currentScore + pointChange)
      );
      
      // Update user's trust score
      transaction.update(doc(db, 'users', userId), {
        trustScore: newScore,
        updatedAt: new Date()
      });
      
      // Create trust action record
      const trustAction: Omit<TrustAction, 'id'> = {
        userId,
        roomId,
        action: actionType,
        points: pointChange,
        reason,
        relatedId,
        createdBy,
        createdAt: new Date()
      };
      
      transaction.set(doc(collection(db, 'trustActions')), trustAction);
      
      return newScore;
    });
    
    return { success: true, newScore: result.data };
  } catch (error: any) {
    console.error('Failed to adjust trust score:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get trust score history for a user
 */
export const getTrustHistory = async (
  userId: string,
  limit: number = 50
): Promise<{ actions: TrustAction[]; error?: string }> => {
  try {
    const result = await getDocuments(
      'trustActions',
      [{ field: 'userId', operator: '==', value: userId }],
      'createdAt',
      'desc',
      limit
    );
    
    if (result.error) {
      return { actions: [], error: result.error };
    }
    
    return { actions: result.data as TrustAction[] };
  } catch (error: any) {
    return { actions: [], error: error.message };
  }
};

/**
 * Handle chore completion trust logic
 */
export const handleChoreCompletion = async (
  chore: Chore,
  completedBy: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Get user's recent chore completion stats for context
    const recentChores = await getDocuments(
      'chores',
      [
        { field: 'assignedTo', operator: '==', value: completedBy },
        { field: 'status', operator: '==', value: 'completed' },
        { field: 'completedAt', operator: '>=', value: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      ],
      'completedAt',
      'desc'
    );
    
    const consecutiveCount = recentChores.data?.length || 0;
    
    // Adjust trust score
    const result = await adjustTrustScore(
      completedBy,
      chore.roomId,
      'chore_completed',
      `Completed chore: ${chore.title}`,
      chore.id,
      completedBy,
      {
        isRecurring: chore.recurring,
        consecutiveCount
      }
    );
    
    return { success: result.success, error: result.error };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * Handle chore dispute resolution
 */
export const handleChoreDispute = async (
  chore: Chore,
  disputedBy: string,
  isValidDispute: boolean,
  resolution: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Adjust trust score for the person who completed the chore
    if (isValidDispute) {
      // The completion was false, penalize the completer
      await adjustTrustScore(
        chore.assignedTo,
        chore.roomId,
        'false_completion',
        `False completion disputed: ${chore.title}`,
        chore.id,
        disputedBy
      );
    } else {
      // The dispute was invalid, penalize the disputer
      await adjustTrustScore(
        disputedBy,
        chore.roomId,
        'chore_disputed_invalid',
        `Invalid dispute raised: ${chore.title}`,
        chore.id,
        chore.assignedTo
      );
      
      // Give bonus to the person who actually did complete it
      await adjustTrustScore(
        chore.assignedTo,
        chore.roomId,
        'chore_confirmed',
        `Chore completion confirmed: ${chore.title}`,
        chore.id,
        disputedBy
      );
    }
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * Calculate weekly trust bonus for consistent users
 */
export const calculateWeeklyTrustBonus = async (
  roomId: string
): Promise<{ success: boolean; bonusesApplied?: number; error?: string }> => {
  try {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of current week
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    // Get all chores for this week
    const weeklyChores = await getDocuments(
      'chores',
      [
        { field: 'roomId', operator: '==', value: roomId },
        { field: 'dueDate', operator: '>=', value: weekStart },
        { field: 'dueDate', operator: '<', value: weekEnd }
      ]
    );
    
    if (weeklyChores.error || !weeklyChores.data) {
      return { success: false, error: weeklyChores.error };
    }
    
    // Group chores by assignee
    const choresByUser: Record<string, Chore[]> = {};
    weeklyChores.data.forEach((chore: Chore) => {
      if (!choresByUser[chore.assignedTo]) {
        choresByUser[chore.assignedTo] = [];
      }
      choresByUser[chore.assignedTo].push(chore);
    });
    
    let bonusesApplied = 0;
    
    // Check each user's completion rate
    for (const [userId, userChores] of Object.entries(choresByUser)) {
      const completedChores = userChores.filter(
        chore => chore.status === 'completed' || chore.status === 'confirmed'
      );
      
      const completionRate = completedChores.length / userChores.length;
      
      // Apply bonus if completion rate is 90% or higher
      if (completionRate >= 0.9 && userChores.length >= 3) {
        await adjustTrustScore(
          userId,
          roomId,
          'helpful_action',
          `Weekly consistency bonus (${Math.round(completionRate * 100)}% completion)`,
          undefined,
          'system'
        );
        bonusesApplied++;
      }
    }
    
    return { success: true, bonusesApplied };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

/**
 * Get trust-based restrictions for a user
 */
export const getTrustRestrictions = (score: number): {
  canCreateChores: boolean;
  canDisputeChores: boolean;
  canManageBills: boolean;
  canInviteMembers: boolean;
  canDeleteItems: boolean;
  maxChoresPerWeek?: number;
  requiresConfirmation: boolean;
  message?: string;
} => {
  const level = getTrustLevel(score);
  
  const restrictions = {
    canCreateChores: canPerformAction(score, 'create_chore'),
    canDisputeChores: canPerformAction(score, 'dispute_chore'),
    canManageBills: canPerformAction(score, 'manage_bills'),
    canInviteMembers: canPerformAction(score, 'invite_members'),
    canDeleteItems: canPerformAction(score, 'delete_items'),
    requiresConfirmation: level === 'critical' || level === 'low',
    message: undefined as string | undefined
  };
  
  // Add specific restrictions based on trust level
  switch (level) {
    case 'critical':
      restrictions.maxChoresPerWeek = 2;
      restrictions.message = 'Your trust score is critically low. Some features are restricted.';
      break;
    case 'low':
      restrictions.maxChoresPerWeek = 5;
      restrictions.message = 'Your trust score is low. Complete chores reliably to improve it.';
      break;
    case 'medium':
      restrictions.message = 'Good standing! Keep up the reliable work.';
      break;
    case 'high':
      restrictions.message = 'Excellent trustworthiness! You have full privileges.';
      break;
  }
  
  return restrictions;
};

/**
 * Reset trust scores (admin function)
 */
export const resetTrustScore = async (
  userId: string,
  roomId: string,
  newScore: number = TRUST_CONSTANTS.INITIAL_SCORE,
  reason: string = 'Manual reset',
  resetBy: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Validate new score
    const clampedScore = Math.max(
      TRUST_CONSTANTS.MIN_SCORE,
      Math.min(TRUST_CONSTANTS.MAX_SCORE, newScore)
    );
    
    // Update user's trust score
    const updateResult = await updateDocument('users', userId, {
      trustScore: clampedScore
    });
    
    if (updateResult.error) {
      return { success: false, error: updateResult.error };
    }
    
    // Create trust action record
    await createDocument('trustActions', {
      userId,
      roomId,
      action: 'manual_adjustment',
      points: clampedScore - TRUST_CONSTANTS.INITIAL_SCORE,
      reason,
      createdBy: resetBy
    });
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};