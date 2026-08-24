export type UserRole = 'customer' | 'cashier' | 'kitchen' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  displayName?: string;
  phone: string;
  phoneNumber?: string;
  avatar?: string;
  photoURL?: string;
  role: UserRole;
  status?: string;
  createdAt: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
  loyaltyPoints: number;
  lifetimePoints: number;
  lifetimeSpending: number;
  orderCount: number;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  image?: string;
  icon?: string;
  displayOrder: number;
  active: boolean;
}

export interface SizeOption {
  name: string;
  priceAdjustment: number;
}

export interface AddOnOption {
  name: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  category: string; // Category ID or Name
  description: string;
  price: number;
  cost: number;
  image: string;
  available: boolean;
  stockTracking: boolean;
  stockQuantity: number;
  minStock: number;
  sizes: SizeOption[];
  addOns: AddOnOption[];
  createdAt: any;
  updatedAt: any;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: SizeOption;
  selectedAddOns: AddOnOption[];
  notes: string;
}

export type OrderType = 'pickup' | 'dine_in' | 'table';
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';
export type PaymentMethod = string;

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  selectedSize: string;
  selectedAddOns: string[];
  notes: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  cashierName?: string;
  orderSource?: 'pos' | 'web_app';
  items: OrderItem[];
  subtotal: number;
  discount: number;
  voucherId: string;
  voucherCode: string;
  total: number;
  orderType: OrderType;
  tableNo: string;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  orderStatus: OrderStatus;
  notes: string;
  createdAt: any;
  updatedAt: any;
  completedAt?: any;
  pointsEarned: number;
  cashReceived?: number;
  change?: number;
}

export interface Voucher {
  id: string;
  code: string;
  name: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchase: number;
  maxDiscount: number;
  expirationDate: string; // ISO date string
  active: boolean;
  usageLimit: number;
  usageCount: number;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  active: boolean;
  rewardType: 'percentage' | 'fixed' | 'free_item';
  rewardValue: number; // For discount rewards
  freeItemName?: string;
}

export interface LoyaltyTransaction {
  id: string;
  customerId: string;
  customerName: string;
  pointsChanged: number;
  type: 'earn' | 'redeem' | 'adjust';
  orderId?: string;
  description: string;
  createdAt: any;
}

export interface InventoryTransaction {
  id: string;
  productId: string;
  productName: string;
  quantityChanged: number; // positive or negative
  type: 'add' | 'remove' | 'sale' | 'adjust';
  reason: string;
  previousStock: number;
  newStock: number;
  createdAt: any;
  createdBy: string; // User ID/Name
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  target: string;
  prevValue: string;
  newValue: string;
  timestamp: any;
}

export interface PaymentMethodConfig {
  id: string;
  name: string;
  type: 'cash' | 'qr' | 'card' | 'other';
  active: boolean;
  qrCodeUrl?: string;
}

export interface StaffAccountConfig {
  role: 'admin' | 'cashier' | 'kitchen';
  name: string;
  mobile: string;
  email: string;
  isEmailVerified: boolean;
  password?: string;
}

export interface SystemSettings {
  storeStatus: {
    isOpen: boolean;
  };
  paymentMethods: PaymentMethodConfig[];
  branding: {
    shopName: string;
    description: string;
    logoUrl?: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontPreference: string;
    theme?: 'dark' | 'light';
  };
  businessInfo: {
    address: string;
    contactNumber: string;
    email: string;
    businessHours: string;
  };
  orderSettings: {
    enableOnlineOrdering: boolean;
    enablePickup: boolean;
    enableDineIn: boolean;
    enableTableOrdering: boolean;
    minimumOrder: number;
    estimatedPrepTime: number; // in minutes
  };
  loyaltySettings: {
    pointsPerAmountSpent: number; // e.g. 1 point per 100 pesos
    amountRequired: number;
  };
  accountsConfig: {
    admin: StaffAccountConfig;
    pos: StaffAccountConfig;
    kds: StaffAccountConfig;
  };
}
