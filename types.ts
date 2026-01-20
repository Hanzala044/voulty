
export enum Category {
  RESTAURANT = 'Restaurant',
  ACCOMMODATION = 'Accommodation',
  FOOD = 'Food',
  EVENTS = 'Events',
  CABS_BUS = 'Cabs/Bus',
  FLIGHT_TRAINS = 'Flight/Trains',
  PERSONAL = 'Personal'
}

export interface User {
  id: string;
  name: string;
  emoji: string;
  pin?: string;
  notificationPrefs: {
    newExpenses: boolean;
    balanceChanges: boolean;
    systemUpdates: boolean;
  };
}

export type SplitType = 'EQUAL' | 'EXACT' | 'SHARES';

export interface Split {
  userId: string;
  value: number;
}

export interface Location {
  lat: number;
  lng: number;
  name?: string;
}

export interface VaultNotification {
  id: string;
  type: 'EXPENSE' | 'SETTLEMENT' | 'SYSTEM' | 'BALANCE_ALERT';
  message: string;
  timestamp: string;
  read: boolean;
}

export interface Expense {
  id: string;
  caption: string;
  amount: number;
  paidBy: string;
  date: string;
  timestamp: number;
  dueDate?: string;
  category: Category;
  isPrivate: boolean;
  invoiceUrl?: string; // Kept for backward compatibility if needed
  invoiceData?: string; // base64 representation of image/pdf
  participants: string[];
  splitType: SplitType;
  splits?: Split[];
  location?: Location;
  // Payment tracking fields
  isPaid?: boolean;
  paidAmount?: number;
  paidDate?: string;
  paymentProof?: string; // base64 image of payment proof
  paidByUser?: string; // user ID who made the payment
}

export interface SessionLock {
  isLocked: boolean;
  lockedAt?: number;
}

export interface RecentUser {
  groupCode: string;
  userId: string;
  userName: string;
  userEmoji: string;
  lastAccessed: number;
}

export interface VaultDocument {
  id: string;
  title: string;
  date: string;
  time: string;
  timestamp: number;
  category: string;
  fileData?: string; // base64
  uploaderId: string;
}

export interface GroupState {
  groupCode: string;
  groupSize: number;
  users: User[];
  expenses: Expense[];
  documents: VaultDocument[];
  currentUserId: string | null;
  currency: string;
  notifications: VaultNotification[];
  pin?: string;
  isSessionLocked?: boolean;
  sessionLock?: SessionLock;
}

export type AppView = 'LANDING' | 'AUTH' | 'DASHBOARD' | 'CREATE_GROUP' | 'JOIN_GROUP' | 'UNLOCK' | 'PIN_LOGIN' | 'DOCUMENTATION';
