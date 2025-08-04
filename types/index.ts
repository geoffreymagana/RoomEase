// Core User and Authentication Types
export interface User {
  id: string;
  email: string;
  phone?: string;
  name: string;
  avatar: string; // emoji or image URL
  bio?: string;
  trustScore: number;
  roomId?: string;
  createdAt: Date;
  updatedAt: Date;
  preferences: UserPreferences;
  stats: UserStats;
}

export interface UserPreferences {
  language: 'en' | 'sw'; // English or Swahili
  theme: 'light' | 'dark';
  notifications: NotificationSettings;
  dietary: DietaryPreference[];
}

export interface NotificationSettings {
  push: boolean;
  email: boolean;
  chores: boolean;
  bills: boolean;
  shopping: boolean;
  trust: boolean;
}

export interface UserStats {
  choresCompleted: number;
  choresSkipped: number;
  totalSpent: number;
  trustScoreHistory: TrustScoreEntry[];
  joinDate: Date;
}

export interface TrustScoreEntry {
  score: number;
  change: number;
  reason: string;
  date: Date;
}

// Room and Roommate Types
export interface Room {
  id: string;
  name: string;
  code: string; // 6-digit invite code
  qrCode?: string;
  createdBy: string;
  members: string[]; // user IDs
  maxMembers: number;
  settings: RoomSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoomSettings {
  choreRotationDay: 'monday' | 'sunday';
  billSplitMethod: 'equal' | 'custom';
  trustThreshold: number; // minimum trust score for full privileges
  currency: 'KES' | 'USD' | 'EUR';
  timezone: string;
}

// Chore Management Types
export interface Chore {
  id: string;
  roomId: string;
  title: string;
  description?: string;
  category: ChoreCategory;
  assignedTo: string; // user ID
  createdBy: string;
  status: ChoreStatus;
  priority: 'low' | 'medium' | 'high';
  recurring: boolean;
  recurringPattern?: RecurringPattern;
  dueDate: Date;
  completedAt?: Date;
  confirmedBy?: string[];
  disputedBy?: string[];
  disputeReason?: string;
  estimatedTime: number; // minutes
  trustImpact: number; // points gained/lost
  createdAt: Date;
  updatedAt: Date;
}

export interface ChoreCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export type ChoreStatus = 
  | 'pending' 
  | 'in_progress' 
  | 'completed' 
  | 'confirmed' 
  | 'disputed' 
  | 'overdue' 
  | 'skipped';

export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number; // every N days/weeks/months
  daysOfWeek?: number[]; // 0-6, Sunday = 0
  endDate?: Date;
}

// Recipe and Menu Types
export interface Recipe {
  id: string;
  roomId: string;
  createdBy: string;
  title: string;
  description?: string;
  servings: number;
  prepTime: number; // minutes
  cookTime: number; // minutes
  difficulty: 'easy' | 'medium' | 'hard';
  ingredients: Ingredient[];
  instructions: RecipeStep[];
  tags: string[];
  photos: string[];
  rating: number;
  reviews: RecipeReview[];
  estimatedCost: number;
  dietary: DietaryPreference[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category: 'protein' | 'vegetable' | 'grain' | 'dairy' | 'spice' | 'other';
  optional: boolean;
}

export interface RecipeStep {
  id: string;
  stepNumber: number;
  instruction: string;
  duration?: number; // minutes
  temperature?: number; // celsius
  image?: string;
}

export interface RecipeReview {
  id: string;
  userId: string;
  rating: number;
  comment?: string;
  photos?: string[];
  createdAt: Date;
}

export type DietaryPreference = 
  | 'vegetarian' 
  | 'vegan' 
  | 'halal' 
  | 'kosher' 
  | 'gluten_free' 
  | 'dairy_free' 
  | 'low_carb' 
  | 'keto';

export interface WeeklyMenu {
  id: string;
  roomId: string;
  weekStart: Date;
  meals: MenuMeal[];
  createdBy: string;
  status: 'planning' | 'approved' | 'active';
  totalEstimatedCost: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuMeal {
  id: string;
  day: string; // 'monday', 'tuesday', etc.
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  recipeId?: string;
  recipe?: Recipe;
  assignedTo: string; // user ID responsible for cooking
  notes?: string;
}

// Shopping and Finance Types
export interface ShoppingList {
  id: string;
  roomId: string;
  title: string;
  items: ShoppingItem[];
  status: 'active' | 'completed' | 'archived';
  totalEstimated: number;
  totalActual?: number;
  createdBy: string;
  assignedTo?: string; // who's shopping
  createdAt: Date;
  updatedAt: Date;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  estimatedPrice: number;
  actualPrice?: number;
  purchased: boolean;
  purchasedBy?: string;
  purchasedAt?: Date;
  urgent: boolean;
  notes?: string;
}

export interface Bill {
  id: string;
  roomId: string;
  title: string;
  description?: string;
  category: BillCategory;
  totalAmount: number;
  currency: string;
  dueDate: Date;
  recurring?: RecurringPattern;
  splits: BillSplit[];
  payments: Payment[];
  status: BillStatus;
  receiptUrl?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export type BillCategory = 
  | 'rent' 
  | 'utilities' 
  | 'groceries' 
  | 'internet' 
  | 'cleaning' 
  | 'maintenance' 
  | 'other';

export type BillStatus = 
  | 'pending' 
  | 'partial' 
  | 'paid' 
  | 'overdue';

export interface BillSplit {
  userId: string;
  amount: number;
  percentage: number;
  paid: boolean;
  paidAt?: Date;
}

export interface Payment {
  id: string;
  billId: string;
  userId: string;
  amount: number;
  method: PaymentMethod;
  transactionId?: string;
  status: PaymentStatus;
  createdAt: Date;
  confirmedAt?: Date;
}

export type PaymentMethod = 
  | 'mpesa' 
  | 'bank_transfer' 
  | 'cash' 
  | 'card' 
  | 'paypal';

export type PaymentStatus = 
  | 'pending' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';

// Communication Types
export interface Note {
  id: string;
  roomId: string;
  title?: string;
  content: string;
  type: 'text' | 'voice' | 'image';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  attachments: string[];
  createdBy: string;
  mentions: string[]; // user IDs mentioned
  reactions: NoteReaction[];
  comments: NoteComment[];
  pinned: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface NoteReaction {
  userId: string;
  emoji: string;
  createdAt: Date;
}

export interface NoteComment {
  id: string;
  userId: string;
  content: string;
  createdAt: Date;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  roomId?: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  expiresAt?: Date;
}

export type NotificationType = 
  | 'chore_assigned' 
  | 'chore_reminder' 
  | 'chore_completed' 
  | 'chore_disputed' 
  | 'bill_due' 
  | 'bill_paid' 
  | 'shopping_reminder' 
  | 'trust_score_changed' 
  | 'room_invite' 
  | 'new_note' 
  | 'recipe_shared' 
  | 'system';

// Trust System Types
export interface TrustAction {
  id: string;
  userId: string;
  roomId: string;
  action: TrustActionType;
  points: number;
  reason: string;
  relatedId?: string; // chore ID, bill ID, etc.
  createdBy?: string; // who triggered the action
  createdAt: Date;
}

export type TrustActionType = 
  | 'chore_completed' 
  | 'chore_confirmed' 
  | 'chore_disputed_valid' 
  | 'chore_disputed_invalid' 
  | 'false_completion' 
  | 'bill_paid_on_time' 
  | 'bill_paid_late' 
  | 'helpful_action' 
  | 'manual_adjustment';

// Gamification Types
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  category: 'chores' | 'cooking' | 'bills' | 'trust' | 'social';
  requirements: AchievementRequirement[];
}

export interface AchievementRequirement {
  type: string;
  value: number;
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time';
}

export interface UserAchievement {
  userId: string;
  achievementId: string;
  unlockedAt: Date;
  progress?: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Form Types
export interface CreateRoomForm {
  name: string;
  maxMembers: number;
  settings: Partial<RoomSettings>;
}

export interface JoinRoomForm {
  code: string;
}

export interface CreateChoreForm {
  title: string;
  description?: string;
  category: string;
  assignedTo: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: Date;
  recurring: boolean;
  recurringPattern?: RecurringPattern;
  estimatedTime: number;
}

export interface CreateBillForm {
  title: string;
  description?: string;
  category: BillCategory;
  totalAmount: number;
  dueDate: Date;
  splits: { userId: string; percentage: number }[];
  recurring?: boolean;
  recurringPattern?: RecurringPattern;
}

// Utility Types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface SelectOption {
  value: string;
  label: string;
  icon?: string;
  disabled?: boolean;
}