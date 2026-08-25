import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocFromCache,
  addDoc, 
  getDocs, 
  deleteDoc,
  onSnapshot, 
  updateDoc, 
  query, 
  orderBy, 
  where,
  serverTimestamp,
  increment,
  writeBatch,
  getFirestore,
  arrayUnion
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInAnonymously
} from 'firebase/auth';
import { db, auth, databaseId, app, validateDatabaseId, getSafeFirestoreInstance } from '../firebase/config';

export { validateDatabaseId, getSafeFirestoreInstance };
import appletConfig from '../../firebase-applet-config.json';
import { 
  UserProfile, Category, Product, CartItem, Order, OrderType, 
  OrderStatus, PaymentStatus, PaymentMethod, Voucher, Reward, 
  LoyaltyTransaction, InventoryTransaction, AuditLog, SystemSettings,
  UserRole
} from '../types';
import { DEMO_CATEGORIES, DEMO_PRODUCTS, DEMO_VOUCHERS, DEMO_REWARDS } from '../firebase/demoData';

interface CoffeeAppContextType {
  // DB status check
  dbStatus: {
    connected: boolean;
    databaseId: string;
    error: string | null;
    canReadWrite: boolean;
    details?: string;
  };

  // Auth state
  currentUser: UserProfile | null;
  authLoading: boolean;
  activeWorkspace: UserRole | null;
  switchWorkspace: (role: UserRole) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, phone: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  simulateRole: (role: UserRole) => Promise<void>;

  // Data lists
  categories: Category[];
  products: Product[];
  vouchers: Voucher[];
  userVouchers: any[];
  rewards: Reward[];
  orders: Order[];
  usersList: UserProfile[];
  auditLogs: AuditLog[];
  inventoryLogs: InventoryTransaction[];
  loyaltyTransactions: LoyaltyTransaction[];
  settings: SystemSettings;

  // Loading states
  dataLoading: boolean;

  // Cart operations
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (index: number) => void;
  updateCartItem: (index: number, updatedItem: CartItem) => void;
  clearCart: () => void;
  appliedVoucher: Voucher | null;
  applyVoucher: (code: string) => string | null; // returns error message if invalid, null if success
  removeVoucher: () => void;
  appliedReward: Reward | null;
  applyReward: (reward: Reward) => string | null;
  removeReward: () => void;

  // Operations
  placeOrder: (
    orderType: OrderType, 
    tableNo: string, 
    paymentMethod: PaymentMethod, 
    notes: string, 
    customerPhone?: string,
    customCart?: CartItem[],
    customVoucher?: Voucher | null,
    customCustomerName?: string,
    orderSource?: 'pos' | 'web_app',
    cashReceived?: number,
    change?: number,
    receiptUrl?: string
  ) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  updateOrderItemStatus: (orderId: string, itemIndex: number, itemStatus: 'pending' | 'preparing' | 'ready') => Promise<void>;
  updatePaymentStatus: (orderId: string, status: PaymentStatus, cashReceived?: number, change?: number) => Promise<void>;
  updateSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;
  loadDemoData: () => Promise<void>;
  clearSampleMenuData: () => Promise<void>;
  clearAllMenuData: () => Promise<void>;
  resetDatabase: () => Promise<void>;

  // Admin Management functions
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  
  addVoucher: (voucher: Omit<Voucher, 'id' | 'usageCount'>) => Promise<void>;
  updateVoucher: (id: string, voucher: Partial<Voucher>) => Promise<void>;
  deleteVoucher: (id: string) => Promise<void>;
  claimVoucher: (id: string) => Promise<void>;

  addReward: (reward: Omit<Reward, 'id'>) => Promise<void>;
  updateReward: (id: string, reward: Partial<Reward>) => Promise<void>;
  deleteReward: (id: string) => Promise<void>;

  adjustInventory: (productId: string, quantityChanged: number, reason: string) => Promise<void>;
  adjustUserPoints: (userId: string, pointsChanged: number, reason: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  syncStaffAccounts: (overrideConfig?: SystemSettings['accountsConfig']) => Promise<void>;

  // Generic Firestore CRUD API
  getDocuments: <T>(collectionName: string) => Promise<T[]>;
  getDocument: <T>(collectionName: string, id: string) => Promise<T | null>;
  addDocument: <T extends object>(collectionName: string, data: T, customId?: string) => Promise<string>;
  updateDocument: <T extends object>(collectionName: string, id: string, data: Partial<T>) => Promise<void>;
  deleteDocument: (collectionName: string, id: string) => Promise<void>;
}

const CoffeeAppContext = createContext<CoffeeAppContextType | undefined>(undefined);

const getShopCol = (colName: string) => collection(db, colName);
const getShopDoc = (colName: string, docId?: string) => {
  return docId ? doc(db, colName, docId) : doc(collection(db, colName));
};

// Detailed Firestore Tracing Helper Functions
const traceSetDoc = async (docRef: any, data: any, options?: any, operationName: string = 'setDoc') => {
  const path = docRef.path;
  console.log(`[Firestore Write Trace: ${operationName} START]`, {
    path,
    targetDb: databaseId,
    currentUserUid: auth.currentUser?.uid || 'unauthenticated',
    payload: data,
    timestamp: new Date().toISOString()
  });

  try {
    if (options) {
      await setDoc(docRef, data, options);
    } else {
      await setDoc(docRef, data);
    }
    console.log(`[Firestore Write Trace: ${operationName} SUCCESS]`, {
      path,
      targetDb: databaseId,
      docId: docRef.id,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error(`[Firestore Write Trace: ${operationName} FAILED]`, {
      path,
      targetDb: databaseId,
      errorName: err?.name,
      errorCode: err?.code,
      errorMessage: err?.message || String(err),
      currentUserUid: auth.currentUser?.uid,
      payload: data,
      timestamp: new Date().toISOString()
    });
    throw err;
  }
};

const traceAddDoc = async (colRef: any, data: any, operationName: string = 'addDoc') => {
  const path = colRef.path;
  console.log(`[Firestore Write Trace: ${operationName} START]`, {
    path,
    targetDb: databaseId,
    currentUserUid: auth.currentUser?.uid || 'unauthenticated',
    payload: data,
    timestamp: new Date().toISOString()
  });

  try {
    const docRef = await addDoc(colRef, data);
    console.log(`[Firestore Write Trace: ${operationName} SUCCESS]`, {
      path,
      generatedId: docRef.id,
      targetDb: databaseId,
      timestamp: new Date().toISOString()
    });
    return docRef;
  } catch (err: any) {
    console.error(`[Firestore Write Trace: ${operationName} FAILED]`, {
      path,
      targetDb: databaseId,
      errorName: err?.name,
      errorCode: err?.code,
      errorMessage: err?.message || String(err),
      currentUserUid: auth.currentUser?.uid,
      payload: data,
      timestamp: new Date().toISOString()
    });
    throw err;
  }
};

const traceUpdateDoc = async (docRef: any, data: any, operationName: string = 'updateDoc') => {
  const path = docRef.path;
  console.log(`[Firestore Write Trace: ${operationName} START]`, {
    path,
    targetDb: databaseId,
    currentUserUid: auth.currentUser?.uid || 'unauthenticated',
    payload: data,
    timestamp: new Date().toISOString()
  });

  try {
    await updateDoc(docRef, data);
    console.log(`[Firestore Write Trace: ${operationName} SUCCESS]`, {
      path,
      targetDb: databaseId,
      docId: docRef.id,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error(`[Firestore Write Trace: ${operationName} FAILED]`, {
      path,
      targetDb: databaseId,
      errorName: err?.name,
      errorCode: err?.code,
      errorMessage: err?.message || String(err),
      currentUserUid: auth.currentUser?.uid,
      payload: data,
      timestamp: new Date().toISOString()
    });
    throw err;
  }
};

const traceDeleteDoc = async (docRef: any, operationName: string = 'deleteDoc') => {
  const path = docRef.path;
  console.log(`[Firestore Write Trace: ${operationName} START]`, {
    path,
    targetDb: databaseId,
    currentUserUid: auth.currentUser?.uid || 'unauthenticated',
    timestamp: new Date().toISOString()
  });

  try {
    await deleteDoc(docRef);
    console.log(`[Firestore Write Trace: ${operationName} SUCCESS]`, {
      path,
      targetDb: databaseId,
      docId: docRef.id,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error(`[Firestore Write Trace: ${operationName} FAILED]`, {
      path,
      targetDb: databaseId,
      errorName: err?.name,
      errorCode: err?.code,
      errorMessage: err?.message || String(err),
      currentUserUid: auth.currentUser?.uid,
      timestamp: new Date().toISOString()
    });
    throw err;
  }
};

// Helper function to sync user profile directly to users/{uid} in Firestore
const syncUserProfileToFirestore = async (uid: string, profileData: any, callerTag: string = 'syncUserProfile') => {
  const rootUserRef = doc(db, 'users', uid);
  const payload = {
    uid: uid,
    email: profileData.email || '',
    displayName: profileData.displayName || profileData.name || 'Coffee Customer',
    name: profileData.name || profileData.displayName || 'Coffee Customer',
    phoneNumber: profileData.phoneNumber || profileData.phone || '',
    phone: profileData.phone || profileData.phoneNumber || '',
    role: profileData.role || 'customer',
    loyaltyPoints: profileData.loyaltyPoints ?? 0,
    status: profileData.status || 'active',
    createdAt: profileData.createdAt || serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  
  try {
    await traceSetDoc(rootUserRef, payload, { merge: true }, `${callerTag}:users_root`);
  } catch (e) {
    console.warn(`[syncUserProfile] Error writing to root users/${uid}:`, e);
  }
};

// Helper function to sync staff and terminal accounts (admin, POS register cashier, KDS kitchen) to users & staff collections in Firestore
const syncStaffAccountsToFirestore = async (accountsConfig?: SystemSettings['accountsConfig']) => {
  const cfg = accountsConfig || DEFAULT_SETTINGS.accountsConfig;
  if (!cfg) return;

  const staffEntries = [
    { key: 'admin', role: 'admin' as UserRole, defaultName: 'Master Administrator', defaultEmail: 'admin@shasznaircafe.com', defaultPhone: '+63 917 111 2222' },
    { key: 'pos', role: 'cashier' as UserRole, defaultName: 'POS Register Terminal 1', defaultEmail: 'pos@shasznaircafe.com', defaultPhone: '+63 917 333 4444' },
    { key: 'kds', role: 'kitchen' as UserRole, defaultName: 'Kitchen Display Station (KDS)', defaultEmail: 'kds@shasznaircafe.com', defaultPhone: '+63 917 555 6666' }
  ];

  for (const entry of staffEntries) {
    const acc: any = cfg[entry.key as keyof typeof cfg] || {};
    
    // Check if this terminal is enabled. If explicitly disabled, we skip syncing it (meaning it won't be re-created if deleted)
    if (acc.enabled === false) {
      console.log(`[syncStaffAccounts] Terminal ${entry.key} is disabled in config. Skipping sync.`);
      continue;
    }

    const uid = `terminal_${entry.key}`;
    const staffId = `staff_${entry.key}`;
    const email = acc.email || entry.defaultEmail;
    const name = acc.name || entry.defaultName;
    const phone = acc.mobile || entry.defaultPhone;
    const password = acc.password || '';

    // 1. Sync User Profile document in `users` collection in Firestore
    const userDocRef = doc(db, 'users', uid);
    const userPayload = {
      uid,
      email,
      name,
      displayName: name,
      phone,
      phoneNumber: phone,
      role: entry.role,
      password,
      status: 'active',
      isEmailVerified: acc.isEmailVerified ?? true,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      loyaltyPoints: 0,
      lifetimePoints: 0,
      lifetimeSpending: 0,
      orderCount: 0
    };

    try {
      await traceSetDoc(userDocRef, userPayload, { merge: true }, `syncStaffAccounts:users:${entry.key}`);
    } catch (e) {
      console.warn(`[syncStaffAccounts] Error writing users/${uid}:`, e);
    }

    // 2. Sync Staff Document in `staff` collection in Firestore
    const staffDocRef = doc(db, 'staff', staffId);
    const staffPayload = {
      staffId,
      userId: uid,
      name,
      email,
      role: entry.role,
      status: 'active',
      shift: 'full_time',
      createdBy: 'system_admin',
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    };

    try {
      await traceSetDoc(staffDocRef, staffPayload, { merge: true }, `syncStaffAccounts:staff:${entry.key}`);
    } catch (e) {
      console.warn(`[syncStaffAccounts] Error writing staff/${staffId}:`, e);
    }

    // 3. Update any auth-created user profile with matching email in `users` collection to have the correct role
    try {
      if (email) {
        const q = query(collection(db, 'users'), where('email', '==', email));
        const snap = await getDocs(q);
        snap.forEach(async (docSnap) => {
          if (docSnap.id !== uid) {
            await updateDoc(docSnap.ref, {
              role: entry.role,
              name: name,
              phone: phone,
              updatedAt: serverTimestamp()
            }).catch(() => {});
          }
        });
      }
    } catch (e) {
      // ignore
    }
  }
};

const DEFAULT_SETTINGS: SystemSettings = {
  storeStatus: {
    isOpen: true,
  },
  paymentMethods: [
    {
      id: 'cash',
      name: 'Cash',
      type: 'cash',
      active: true,
    }
  ],
  branding: {
    shopName: "SHASZNAIR CAFE",
    description: "",
    primaryColor: "#c5a059", // Warm Gold
    secondaryColor: "#1a1612", // Dark Roast
    accentColor: "#f5d9a6", // Cream
    fontPreference: "Playfair Display",
    theme: "dark"
  },
  businessInfo: {
    address: "SHASZNAIR CAFE, Manila",
    contactNumber: "+63 917 123 4567",
    email: "shasznaircoffee@gmail.com",
    businessHours: "7:00 AM - 10:00 PM"
  },
  orderSettings: {
    enableOnlineOrdering: true,
    enablePickup: true,
    enableDineIn: true,
    enableTableOrdering: true,
    minimumOrder: 50,
    estimatedPrepTime: 10
  },
  loyaltySettings: {
    pointsPerAmountSpent: 1,
    amountRequired: 100, // 1 point per ₱100
    pointsStrategy: 'amount_spent'
  },
  inventorySettings: {
    lowStockThreshold: 10,
    enableAlerts: true
  },
  accountsConfig: {
    admin: { role: 'admin', name: 'Master Administrator', mobile: '+63 917 111 2222', email: 'admin@shasznaircafe.com', isEmailVerified: true, enabled: true, password: 'admin123' },
    pos: { role: 'cashier', name: 'POS Register Terminal 1', mobile: '+63 917 333 4444', email: 'pos@shasznaircafe.com', isEmailVerified: true, enabled: true, password: 'pos123' },
    kds: { role: 'kitchen', name: 'Kitchen Display Station (KDS)', mobile: '+63 917 555 6666', email: 'kds@shasznaircafe.com', isEmailVerified: true, enabled: true, password: 'kds123' }
  }
};

export const CoffeeAppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeWorkspace, setActiveWorkspace] = useState<UserRole | null>(null);

  // Safety timeout to prevent infinite white loading screen if auth or firestore hangs
  useEffect(() => {
    const timer = setTimeout(() => {
      if (authLoading) {
        console.warn("[CoffeeAppProvider] Auth loading timeout reached. Forcing authLoading to false.");
        setAuthLoading(false);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [authLoading]);

  // Core lists
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [userVouchers, setUserVouchers] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryTransaction[]>([]);
  const [loyaltyTransactions, setLoyaltyTransactions] = useState<LoyaltyTransaction[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);

  const [dataLoading, setDataLoading] = useState(true);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [appliedReward, setAppliedReward] = useState<Reward | null>(null);

  // Database Connection Status check
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    databaseId: string;
    error: string | null;
    canReadWrite: boolean;
    details?: string;
  }>({
    connected: false,
    databaseId: databaseId || '(default)',
    error: 'Initializing...',
    canReadWrite: false
  });

  useEffect(() => {
    const testDbConnection = async () => {
      const configDbId = appletConfig.firestoreDatabaseId;
      const validatedDbId = validateDatabaseId(databaseId) || validateDatabaseId(configDbId);
      
      // Ensure Firestore instance is retrieved safely omitting databaseId if '(default)'
      const activeFirestore = getSafeFirestoreInstance(app, validatedDbId);
      
      console.log(`[Firestore Connection Check] Starting database initialization check...`);
      console.log(`[Firestore Connection Check] Expected config firestoreDatabaseId: "${configDbId}"`);
      console.log(`[Firestore Connection Check] Validated databaseId parameter: ${validatedDbId ? `"${validatedDbId}"` : 'undefined (default database)'}`);
      
      // Determine the active database ID
      const activeDbId = (activeFirestore as any)._databaseId?.database || databaseId || '(default)';
      console.log(`[Firestore Connection Check] Active getFirestore() databaseId: "${activeDbId}"`);

      try {
        // Perform a test read/write to the settings connection_test document
        const testDocRef = doc(activeFirestore, 'coffee-shop-app', 'default', 'settings', 'connection_test');
        
        await setDoc(testDocRef, {
          checkedAt: new Date().toISOString(),
          status: 'verified_active',
          databaseId: activeDbId
        }, { merge: true });

        const snap = await getDoc(testDocRef);
        if (snap.exists() && snap.data()?.status === 'verified_active') {
          console.log(`[Firestore Connection Check] SUCCESS: App successfully read/wrote to the database.`);
          setDbStatus({
            connected: true,
            databaseId: activeDbId,
            error: null,
            canReadWrite: true,
            details: `Firestore database "${activeDbId}" is active, online, and fully read/write verified.`
          });
        } else {
          throw new Error("Read verified failed: Document write succeeded but read check returned inconsistent data.");
        }
      } catch (err: any) {
        console.error(`[Firestore Connection Check] FAILED: Could not complete verified read/write.`, err);
        setDbStatus({
          connected: false,
          databaseId: activeDbId,
          error: err.message || String(err),
          canReadWrite: false,
          details: `Read/write test failed: ${err.message || String(err)}`
        });
      }
    };

    testDbConnection();
  }, []);

  // Automatic Purge of Sample Menu Items on startup
  useEffect(() => {
    if (!currentUser || authLoading) return;
    const purgeSampleDataOnce = async () => {
      try {
        const demoCatIds = ['cat_coffee', 'cat_non_coffee', 'cat_food', 'cat_specials'];
        const demoProdIds = ['prod_choco_lava', 'prod_banana_muffin', 'prod_spanish_latte', 'prod_caramel_macchiato', 'prod_matcha_latte'];
        
        for (const catId of demoCatIds) {
          try {
            await deleteDoc(getShopDoc('categories', catId));
          } catch (e) {}
        }
        for (const prodId of demoProdIds) {
          try {
            await deleteDoc(getShopDoc('products', prodId));
          } catch (e) {}
        }
      } catch (err) {
        console.warn("Initial sample menu purge error:", err);
      }
    };
    purgeSampleDataOnce();
  }, [currentUser?.uid, authLoading]);

  // 1. Public Real-Time Firebase Listeners (Always active for Landing Page & All Experiences)
  useEffect(() => {
    let catsLoaded = false;
    let prodsLoaded = false;
    const checkDataLoaded = () => {
      if (catsLoaded && prodsLoaded) {
        setDataLoading(false);
      }
    };

    // 1. Sync Category Listener
    const unsubCategories = onSnapshot(getShopCol('categories'), (snap) => {
      if (!snap.empty) {
        const list: Category[] = [];
        snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as Category));
        setCategories(list.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)));
      } else {
        setCategories([]);
      }
      catsLoaded = true;
      checkDataLoaded();
    }, (err) => {
      console.warn("Categories snapshot failed:", err);
      catsLoaded = true;
      checkDataLoaded();
    });

    // 2. Sync Products Listener
    const unsubProducts = onSnapshot(getShopCol('products'), (snap) => {
      if (!snap.empty) {
        const list: Product[] = [];
        snap.forEach(doc => {
          const data = doc.data();
          list.push({ 
            id: doc.id, 
            ...data,
            createdAt: data.createdAt?.toDate?.() || (data.createdAt ? new Date(data.createdAt) : new Date()),
            updatedAt: data.updatedAt?.toDate?.() || (data.updatedAt ? new Date(data.updatedAt) : new Date())
          } as Product);
        });
        setProducts(list);
      } else {
        setProducts([]);
      }
      prodsLoaded = true;
      checkDataLoaded();
    }, (err) => {
      console.warn("Products snapshot failed:", err);
      prodsLoaded = true;
      checkDataLoaded();
    });

    // 3. Sync Vouchers Listener
    const unsubVouchers = onSnapshot(getShopCol('vouchers'), (snap) => {
      if (!snap.empty) {
        const list: Voucher[] = [];
        snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as Voucher));
        setVouchers(list);
      } else {
        setVouchers([]);
      }
    }, (err) => {
      console.warn("Vouchers snapshot failed:", err);
    });

    // 4. Sync Rewards Listener
    const unsubRewards = onSnapshot(getShopCol('rewards'), (snap) => {
      if (!snap.empty) {
        const list: Reward[] = [];
        snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as Reward));
        setRewards(list);
      } else {
        setRewards([]);
      }
    }, (err) => {
      console.warn("Rewards snapshot failed:", err);
    });

    // 5. Sync Settings Listener
    const unsubSettings = onSnapshot(getShopDoc('settings', 'config'), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as SystemSettings;
        setSettings(data);
        if (data.accountsConfig) {
          syncStaffAccountsToFirestore(data.accountsConfig);
        }
      } else {
        setSettings(DEFAULT_SETTINGS);
        syncStaffAccountsToFirestore(DEFAULT_SETTINGS.accountsConfig);
      }
    }, (err) => {
      console.warn("Settings snapshot failed, using defaults:", err);
      syncStaffAccountsToFirestore(DEFAULT_SETTINGS.accountsConfig);
    });

    return () => {
      unsubCategories();
      unsubProducts();
      unsubVouchers();
      unsubRewards();
      unsubSettings();
    };
  }, []);

  // 1.5 Sync Current User Profile (Realtime for Everyone)
  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsub = onSnapshot(getShopDoc('users', currentUser.uid), (snap) => {
      if (snap.exists()) {
        const userData = snap.data() as UserProfile;
        const createdAt = userData.createdAt?.toDate?.() || (userData.createdAt ? new Date(userData.createdAt) : new Date());
        setCurrentUser(prev => prev ? ({ ...prev, ...userData, createdAt }) : null);
      }
    });

    return () => unsub();
  }, [currentUser?.uid]);

  // 2. User/Role-Specific Real-Time Firebase Listeners (Orders, Users, Audits, Inventory)
  useEffect(() => {
    if (authLoading || !currentUser) {
      setOrders([]);
      setUsersList([]);
      setAuditLogs([]);
      setInventoryLogs([]);
      return;
    }

    const isStaff = currentUser.role === 'admin' || currentUser.role === 'cashier' || currentUser.role === 'kitchen';
    const ordersQuery = isStaff 
      ? query(getShopCol('orders'), orderBy('createdAt', 'desc'))
      : query(getShopCol('orders'), where('customerId', '==', currentUser.uid));

    const unsubOrders = onSnapshot(ordersQuery, (snap) => {
      const list: Order[] = [];
      snap.forEach(doc => {
        const data = doc.data();
        list.push({ 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt?.toDate?.() || (data.createdAt ? new Date(data.createdAt) : new Date()),
          updatedAt: data.updatedAt?.toDate?.() || (data.updatedAt ? new Date(data.updatedAt) : new Date())
        } as Order);
      });
      list.sort((a, b) => {
        const tA = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
        const tB = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
        return tB - tA;
      });
      setOrders(list);
    }, (err) => {
      console.warn("Orders snapshot failed:", err);
      const stored = localStorage.getItem('local_orders');
      if (stored) {
        setOrders(JSON.parse(stored));
      }
    });

    // Role-Restricted Sync: Users (Staff only)
    let unsubUsers = () => {};
    if (isStaff) {
      unsubUsers = onSnapshot(getShopCol('users'), (snap) => {
        const list: UserProfile[] = [];
        snap.forEach(doc => {
          const data = doc.data();
          const createdAt = data.createdAt?.toDate?.() || (data.createdAt ? new Date(data.createdAt) : new Date());
          list.push({ uid: doc.id, ...data, createdAt } as UserProfile);
        });
        setUsersList(list);
      }, (err) => {
        console.warn("Users snapshot failed:", err);
      });
    } else {
      setUsersList([currentUser]);
    }

    // Role-Restricted Sync: Inventory Logs (Staff only)
    let unsubInv = () => {};
    if (isStaff) {
      const qInv = query(getShopCol('inventoryTransactions'), orderBy('createdAt', 'desc'));
      unsubInv = onSnapshot(qInv, (snap) => {
        const list: InventoryTransaction[] = [];
        snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as InventoryTransaction));
        setInventoryLogs(list);
      }, (err) => {
        console.warn("Inventory logs snapshot failed:", err);
      });
    } else {
      setInventoryLogs([]);
    }

    // Role-Restricted Sync: Audit Logs (Staff only)
    let unsubAudit = () => {};
    if (isStaff) {
      const qAudit = query(getShopCol('auditLogs'), orderBy('timestamp', 'desc'));
      unsubAudit = onSnapshot(qAudit, (snap) => {
        const list: AuditLog[] = [];
        snap.forEach(doc => list.push({ id: doc.id, ...doc.data() } as AuditLog));
        setAuditLogs(list);
      }, (err) => {
        console.warn("Audit snapshot failed:", err);
      });
    } else {
      setAuditLogs([]);
    }

    // Sync User's Claimed Vouchers
    let unsubUserVouchers = () => {};
    if (currentUser) {
      const qUserVouch = query(collection(db, `users/${currentUser.uid}/vouchers`), where('status', '==', 'active'));
      unsubUserVouchers = onSnapshot(qUserVouch, (snap) => {
        const list: any[] = [];
        snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
        setUserVouchers(list);
      }, (err) => {
        console.warn("User vouchers snapshot failed:", err);
      });
    } else {
      setUserVouchers([]);
    }

    // Sync Loyalty Transactions
    const qLoyalty = isStaff 
      ? query(getShopCol('loyaltyTransactions'), orderBy('createdAt', 'desc'))
      : query(getShopCol('loyaltyTransactions'), where('customerId', '==', currentUser.uid), orderBy('createdAt', 'desc'));
    
    const unsubLoyalty = onSnapshot(qLoyalty, (snap) => {
      const list: LoyaltyTransaction[] = [];
      snap.forEach(doc => {
        const data = doc.data();
        list.push({ 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt?.toDate?.() || (data.createdAt ? new Date(data.createdAt) : new Date())
        } as LoyaltyTransaction);
      });
      setLoyaltyTransactions(list);
    }, (err) => {
      console.warn("Loyalty transactions snapshot failed:", err);
    });

    return () => {
      unsubOrders();
      unsubUsers();
      unsubInv();
      unsubAudit();
      unsubUserVouchers();
      unsubLoyalty();
    };
  }, [currentUser, authLoading]);

  // Save local orders fallback when orders state changes
  useEffect(() => {
    if (orders.length > 0) {
      localStorage.setItem('local_orders', JSON.stringify(orders));
    }
  }, [orders]);

  // 2. Auth State Sync
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setAuthLoading(true);
      if (firebaseUser) {
        localStorage.removeItem('simulated_user');
        
        // Fetch profile
        try {
          const userDocRef = getShopDoc('users', firebaseUser.uid);
          let uDoc: any = null;

          try {
            const cachedDoc = await getDocFromCache(userDocRef);
            if (cachedDoc.exists()) {
              uDoc = cachedDoc;
            }
          } catch (cacheErr) {
            // Cache miss
          }

          if (!uDoc) {
            uDoc = await Promise.race([
              getDoc(userDocRef),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Timeout getting user profile from Firestore server")), 1500)
              )
            ]);
          }

          if (uDoc && uDoc.exists()) {
            const userData = uDoc.data() as UserProfile;
            let role = userData.role || 'customer';
            const emailLower = (firebaseUser.email || '').toLowerCase();
            if (emailLower.includes('admin') || emailLower.includes('owner') || emailLower.includes('manager')) {
              role = 'admin';
            } else if (emailLower.includes('cashier') || emailLower.includes('pos')) {
              role = 'cashier';
            } else if (emailLower.includes('kitchen') || emailLower.includes('kds') || emailLower.includes('barista')) {
              role = 'kitchen';
            }

            if (role !== userData.role) {
              try {
                await updateDoc(userDocRef, { role });
                userData.role = role;
              } catch (e) {
                // ignore
              }
            }

            const createdAt = userData.createdAt?.toDate?.() || (userData.createdAt ? new Date(userData.createdAt) : new Date());
            const profile = { uid: uDoc.id, ...userData, createdAt, role };
            setCurrentUser(profile);
            setActiveWorkspace(role);
          } else {
            let assignedRole: UserRole = 'customer';
            const emailLower = (firebaseUser.email || '').toLowerCase();
            if (emailLower.includes('admin') || emailLower.includes('owner') || emailLower.includes('manager')) {
              assignedRole = 'admin';
            } else if (emailLower.includes('cashier') || emailLower.includes('pos')) {
              assignedRole = 'cashier';
            } else if (emailLower.includes('kitchen') || emailLower.includes('kds') || emailLower.includes('barista')) {
              assignedRole = 'kitchen';
            }

            const dbProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || (assignedRole === 'admin' ? 'Store Admin' : assignedRole === 'cashier' ? 'POS Cashier' : assignedRole === 'kitchen' ? 'Kitchen Staff' : 'Customer'),
              phone: '',
              role: assignedRole,
              createdAt: serverTimestamp(),
              loyaltyPoints: 0,
              lifetimePoints: 0,
              lifetimeSpending: 0,
              orderCount: 0
            };
            try {
              await syncUserProfileToFirestore(firebaseUser.uid, dbProfile, 'createAuthInitialUserProfile');
            } catch (writeErr) {
              console.warn("Could not write initial profile to Firestore (offline):", writeErr);
            }

            const tempProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: dbProfile.name,
              phone: '',
              role: assignedRole,
              createdAt: new Date(),
              loyaltyPoints: 0,
              lifetimePoints: 0,
              lifetimeSpending: 0,
              orderCount: 0
            };
            setCurrentUser(tempProfile);
            setActiveWorkspace(assignedRole);
          }
        } catch (e) {
          console.warn("Error checking user profile, falling back to basic auth info:", e);
          const fallbackProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || 'Customer',
            phone: '',
            role: 'customer',
            createdAt: new Date(),
            loyaltyPoints: 0,
            lifetimePoints: 0,
            lifetimeSpending: 0,
            orderCount: 0
          };
          setCurrentUser(fallbackProfile);
          setActiveWorkspace('customer');
        }
      } else {
        localStorage.removeItem('simulated_user');
        const savedCustomUser = localStorage.getItem('custom_firestore_user');
        if (savedCustomUser) {
          try {
            const parsed = JSON.parse(savedCustomUser);
            try {
              const userDocRef = getShopDoc('users', parsed.uid);
              const latestDoc = await getDoc(userDocRef);
              if (latestDoc.exists() && latestDoc.data().status !== 'suspended') {
                const latestData = latestDoc.data();
                const createdAt = latestData.createdAt?.toDate?.() || (latestData.createdAt ? new Date(latestData.createdAt) : new Date());
                const profile = { uid: latestDoc.id, ...latestData, createdAt } as UserProfile;
                setCurrentUser(profile);
                setActiveWorkspace(profile.role || 'customer');
                localStorage.setItem('custom_firestore_user', JSON.stringify(profile));
                setAuthLoading(false);
                return;
              } else {
                localStorage.removeItem('custom_firestore_user');
              }
            } catch (e) {
              setCurrentUser(parsed);
              setActiveWorkspace(parsed.role || 'customer');
              setAuthLoading(false);
              return;
            }
          } catch (e) {
            localStorage.removeItem('custom_firestore_user');
          }
        }
        setCurrentUser(null);
        setActiveWorkspace(null);
      }
      setAuthLoading(false);
    });

    return () => unsubAuth();
  }, []);

  // 3. Auth & Workspace Functions
  const switchWorkspace = async (role: UserRole) => {
    if (!currentUser) {
      throw new Error("Authentication required to switch active workspace.");
    }

    const realRole = currentUser.role;

    // Admin accounts are explicitly disallowed from accessing the Customer App
    if (realRole === 'admin' && role === 'customer') {
      throw new Error("Admin accounts do not have access to the Customer App.");
    }

    // Only Admin can toggle between staff views (Admin, Cashier, Kitchen).
    // POS Cashier and Kitchen Monitor (KDS) cannot toggle to other views.
    if (realRole !== 'admin' && role !== realRole) {
      throw new Error(`Workspace switching is restricted to Admin accounts. As a ${realRole.toUpperCase()}, you are restricted to your assigned workspace.`);
    }

    setActiveWorkspace(role);

    try {
      await writeAuditLog(currentUser.uid, currentUser.name, 'workspace_switch', `Switched view mode to ${role}`, realRole, role);
    } catch (e) {
      // audit log optional
    }
  };

  const simulateRole = async (role: UserRole) => {
    await switchWorkspace(role);
  };

  const login = async (email: string, password: string) => {
    setAuthLoading(true);
    try {
      localStorage.removeItem('simulated_user');
      localStorage.removeItem('custom_firestore_user');
      
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (authErr: any) {
        console.log("Firebase Auth failed, trying Firestore user fallback...", authErr);
        
        // Try searching users collection
        const usersCol = getShopCol('users');
        const q = query(usersCol, where('email', '==', email.trim()));
        const snap = await getDocs(q);
        
        let foundUser: any = null;
        snap.forEach(doc => {
          const d = doc.data();
          if (d.password === password) {
            foundUser = { uid: doc.id, ...d };
          }
        });

        if (!foundUser) {
          const qLower = query(usersCol, where('email', '==', email.trim().toLowerCase()));
          const snapLower = await getDocs(qLower);
          snapLower.forEach(doc => {
            const d = doc.data();
            if (d.password === password) {
              foundUser = { uid: doc.id, ...d };
            }
          });
        }
        
        if (foundUser) {
          if (foundUser.status === 'suspended') {
            throw new Error("This account is currently suspended. Please contact the administrator.");
          }
          const createdAt = foundUser.createdAt?.toDate?.() || (foundUser.createdAt ? new Date(foundUser.createdAt) : new Date());
          const profile: UserProfile = {
            ...foundUser,
            createdAt,
            role: foundUser.role || 'customer'
          };
          localStorage.setItem('custom_firestore_user', JSON.stringify(profile));
          setCurrentUser(profile);
          setActiveWorkspace(profile.role);
          setAuthLoading(false);
          return;
        }
        
        throw authErr;
      }
    } catch (e) {
      setAuthLoading(false);
      throw e;
    }
  };

  const register = async (email: string, password: string, name: string, phone: string, role: UserRole = 'customer') => {
    setAuthLoading(true);
    try {
      localStorage.removeItem('simulated_user');
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      const dbProfile = {
        uid: cred.user.uid,
        email,
        name,
        phone,
        role,
        createdAt: serverTimestamp(),
        loyaltyPoints: 0,
        lifetimePoints: 0,
        lifetimeSpending: 0,
        orderCount: 0
      };
      await syncUserProfileToFirestore(cred.user.uid, dbProfile, 'registerUser');
      
      const localProfile: UserProfile = {
        uid: cred.user.uid,
        email,
        name,
        phone,
        role,
        createdAt: new Date(),
        loyaltyPoints: 0,
        lifetimePoints: 0,
        lifetimeSpending: 0,
        orderCount: 0
      };
      setCurrentUser(localProfile);
      setActiveWorkspace(role);
    } catch (e) {
      setAuthLoading(false);
      throw e;
    }
  };

  const logout = async () => {
    setAuthLoading(true);
    try {
      localStorage.removeItem('simulated_user');
      localStorage.removeItem('custom_firestore_user');
      await signOut(auth);
      setCurrentUser(null);
      setActiveWorkspace(null);
    } catch (e) {
      console.error(e);
    } finally {
      setAuthLoading(false);
    }
  };

  // 4. Cart Operations
  const addToCart = (item: CartItem) => {
    setCart(prev => [...prev, item]);
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const updateCartItem = (index: number, updatedItem: CartItem) => {
    setCart(prev => prev.map((item, i) => i === index ? updatedItem : item));
  };

  const clearCart = () => {
    setCart([]);
    setAppliedVoucher(null);
    setAppliedReward(null);
  };

  const applyVoucher = (code: string): string | null => {
    const cleanCode = code.trim().toUpperCase();
    
    // Check global vouchers first
    let v = vouchers.find(v => v.code === cleanCode && v.active);
    
    // If not found in global, check user's claimed vouchers (by instanceCode)
    if (!v) {
      const claimed = userVouchers.find(uv => uv.instanceCode === cleanCode);
      if (claimed) {
        v = claimed as Voucher;
      }
    }

    if (!v) return "Invalid or expired voucher code.";

    const now = new Date();
    const exp = new Date(v.expirationDate);
    if (now > exp) return "This voucher has expired.";

    if (v.usageCount >= v.usageLimit) return "Voucher maximum usage limit has been reached.";

    // Calculate subtotal
    const subtotal = cart.reduce((acc, item) => {
      const sizePrice = item.selectedSize.priceAdjustment;
      const addOnsPrice = item.selectedAddOns.reduce((sum, ad) => sum + ad.price, 0);
      return acc + ((item.product.price + sizePrice + addOnsPrice) * item.quantity);
    }, 0);

    if (subtotal < v.minPurchase) {
      return `Minimum purchase of ₱${v.minPurchase} is required for this voucher.`;
    }

    // Usage Mode Enforcement
    if (v.usageType === 'once_per_customer' && currentUser) {
      if (currentUser.usedVoucherIds?.includes(v.id)) {
        return "You have already used this voucher once.";
      }
    }

    // Free Item Validation
    if (v.discountType === 'free_item') {
      const hasItem = cart.some(item => item.product.name.toLowerCase() === v.freeItemName?.toLowerCase());
      if (!hasItem) {
        return `This voucher requires a "${v.freeItemName}" in your bag.`;
      }
    }

    setAppliedVoucher(v);
    setAppliedReward(null); // clear reward if applying voucher (mutually exclusive discount)
    return null;
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
  };

  const applyReward = (reward: Reward): string | null => {
    if (!currentUser || currentUser.role !== 'customer') {
      return "Only customers can redeem loyalty rewards.";
    }
    if (currentUser.loyaltyPoints < reward.pointsRequired) {
      return `Insufficient points. You need ${reward.pointsRequired} points (You have ${currentUser.loyaltyPoints}).`;
    }
    setAppliedReward(reward);
    setAppliedVoucher(null); // mutually exclusive
    return null;
  };

  const removeReward = () => {
    setAppliedReward(null);
  };

  // 5. Audit Logging Helper
  const writeAuditLog = async (userId: string, userName: string, action: string, target: string, prevValue: string, newValue: string) => {
    const log: Omit<AuditLog, 'id'> = {
      userId,
      userName,
      action,
      target,
      prevValue,
      newValue,
      timestamp: serverTimestamp()
    };
    try {
      await traceAddDoc(getShopCol('auditLogs'), log, 'writeAuditLog');
    } catch (e) {
      console.warn("Audit logging failed:", e);
    }
  };

  // 6. DB Operations - Place Order
  const placeOrder = async (
    orderType: OrderType, 
    tableNo: string, 
    paymentMethod: PaymentMethod, 
    notes: string, 
    customerPhone?: string,
    customCart?: CartItem[],
    customVoucher?: Voucher | null,
    customCustomerName?: string,
    orderSource?: 'pos' | 'web_app',
    cashReceived?: number,
    change?: number,
    receiptUrl?: string
  ): Promise<Order> => {
    if (settings.storeStatus?.isOpen === false && (orderSource === 'web_app' || (!orderSource && currentUser?.role === 'customer'))) {
      throw new Error("Store is currently closed. Orders cannot be placed through the mobile app right now.");
    }
    const activeCart = (customCart && customCart.length > 0) ? customCart : cart;
    if (activeCart.length === 0) throw new Error("Your shopping cart is empty.");

    // Determine actual order source
    const effectiveOrderSource: 'pos' | 'web_app' = orderSource || (
      (currentUser?.role === 'cashier' || currentUser?.role === 'admin') && customCart ? 'pos' : 'web_app'
    );

    // Determine cashier info if placed via POS
    const cashierName = (effectiveOrderSource === 'pos' && (currentUser?.role === 'cashier' || currentUser?.role === 'admin')) 
      ? (currentUser.name || 'POS Cashier') 
      : undefined;

    // Determine customer info
    let orderCustomerId = 'guest';
    let orderCustomerName = 'Guest';

    // If POS cashier placing order for loyalty customer identified by scan or phone lookup
    if (customerPhone) {
      const matchingCust = usersList.find(u => u.phone === customerPhone || u.uid === customerPhone);
      if (matchingCust) {
        orderCustomerId = matchingCust.uid;
        orderCustomerName = matchingCust.name;
      } else if (customCustomerName?.trim()) {
        orderCustomerName = customCustomerName.trim();
      } else {
        orderCustomerName = customerPhone;
      }
    } else if (customCustomerName?.trim()) {
      // Walk-in customer with specific custom name provided at POS invoice
      orderCustomerId = 'guest';
      orderCustomerName = customCustomerName.trim();
    } else if (effectiveOrderSource === 'pos') {
      // POS walk-in customer with no registered account and no custom name entered
      orderCustomerId = 'guest';
      orderCustomerName = 'Walk-in Guest';
    } else if (currentUser?.role === 'customer') {
      // Online customer ordering through Web App with their customer account
      orderCustomerId = currentUser.uid;
      orderCustomerName = currentUser.name || 'App Customer';
    } else {
      // Fallback
      orderCustomerId = currentUser?.uid || 'guest';
      orderCustomerName = 'Walk-in Guest';
    }

    // 1. Calculate and re-verify totals
    let subtotal = 0;
    const itemsList = activeCart.map(item => {
      const sizePrice = item.selectedSize.priceAdjustment;
      const addOnsPrice = item.selectedAddOns.reduce((sum, ad) => sum + ad.price, 0);
      const unitPrice = item.product.price + sizePrice + addOnsPrice;
      const itemSubtotal = unitPrice * item.quantity;
      subtotal += itemSubtotal;

      return {
        productId: item.product.id,
        name: item.product.name,
        price: unitPrice,
        quantity: item.quantity,
        selectedSize: item.selectedSize.name,
        selectedAddOns: item.selectedAddOns.map(a => a.name),
        notes: item.notes
      };
    });

    let discount = 0;
    let voucherId = '';
    let voucherCode = '';

    const effectiveVoucher = customVoucher !== undefined ? customVoucher : appliedVoucher;

    if (effectiveVoucher) {
      voucherId = effectiveVoucher.id;
      voucherCode = effectiveVoucher.code;
      if (effectiveVoucher.discountType === 'percentage') {
        discount = Math.round((subtotal * effectiveVoucher.discountValue) / 100);
        if (effectiveVoucher.maxDiscount > 0) {
          discount = Math.min(discount, effectiveVoucher.maxDiscount);
        }
      } else {
        discount = effectiveVoucher.discountValue;
      }
    } else if (!customCart && appliedReward) {
      if (appliedReward.rewardType === 'fixed') {
        discount = appliedReward.rewardValue;
      } else if (appliedReward.rewardType === 'percentage') {
        discount = Math.round((subtotal * appliedReward.rewardValue) / 100);
      } else if (appliedReward.rewardType === 'free_item') {
        // Look for matching free item in cart
        const freeItem = activeCart.find(item => item.product.name === appliedReward.freeItemName);
        if (freeItem) {
          const sizePrice = freeItem.selectedSize.priceAdjustment;
          const addOnsPrice = freeItem.selectedAddOns.reduce((sum, ad) => sum + ad.price, 0);
          discount = freeItem.product.price + sizePrice + addOnsPrice;
        } else {
          throw new Error(`Your reward requires adding '${appliedReward.freeItemName}' to your cart first.`);
        }
      }
    }

    const total = Math.max(0, subtotal - discount);

    // 2. Loyalty points calculation
    let pointsEarned = 0;
    if (orderCustomerId !== 'guest') {
      const { pointsStrategy, amountRequired, pointsPerAmountSpent } = settings.loyaltySettings;
      
      if (pointsStrategy === 'amount_spent' || pointsStrategy === 'both') {
        const rate = amountRequired || 100;
        const multiplier = pointsPerAmountSpent || 1;
        pointsEarned += Math.floor(total / rate) * multiplier;
      }
      
      if (pointsStrategy === 'per_item' || pointsStrategy === 'both') {
        activeCart.forEach(item => {
          if (item.product.loyaltyPoints) {
            pointsEarned += item.product.loyaltyPoints * item.quantity;
          }
        });
      }
    }

    // 3. Generate sequential order number
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `OR-${today}-${rand}`;

    const computedChange = change !== undefined 
      ? change 
      : (cashReceived !== undefined ? Math.max(0, cashReceived - total) : undefined);

    const selectedMethod = (settings.paymentMethods || []).find(m => m.id === paymentMethod);
    const resolvedPaymentMethod = selectedMethod ? selectedMethod.name.toUpperCase() : (paymentMethod.startsWith('METHOD-') ? 'GCASH' : paymentMethod.toUpperCase());
    const isCashType = selectedMethod?.type === 'cash' || paymentMethod === 'cash';

    let initialPaymentStatus: PaymentStatus = 'unpaid';
    if (cashReceived !== undefined) {
      initialPaymentStatus = 'paid';
    } else if (!isCashType) {
      if (effectiveOrderSource === 'pos') {
        initialPaymentStatus = 'paid';
      } else {
        initialPaymentStatus = receiptUrl ? 'pending' : 'unpaid';
      }
    }

    const orderData: Omit<Order, 'id'> = {
      orderNumber,
      customerId: orderCustomerId,
      customerName: orderCustomerName,
      ...(cashierName ? { cashierName } : {}),
      orderSource: effectiveOrderSource,
      items: itemsList,
      subtotal,
      discount,
      voucherId,
      voucherCode,
      total,
      orderType,
      tableNo: orderType === 'table' ? tableNo : '',
      paymentStatus: initialPaymentStatus,
      paymentMethod: resolvedPaymentMethod,
      orderStatus: 'pending',

      notes,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      pointsEarned,
      ...(cashReceived !== undefined ? { cashReceived } : {}),
      ...(computedChange !== undefined ? { change: computedChange } : {}),
      ...(receiptUrl ? { receiptUrl } : {})
    };

    // 4. Batch transaction for database reliability, duplicate prevention, and inventory decrement
    try {
      const batch = writeBatch(db);

      // Create order doc
      const orderRef = getShopDoc('orders');
      batch.set(orderRef, orderData);

      // Deduct stock for products
      for (const cartItem of activeCart) {
        if (cartItem.product.stockTracking) {
          const prodRef = getShopDoc('products', cartItem.product.id);
          const newStock = Math.max(0, cartItem.product.stockQuantity - cartItem.quantity);
          batch.update(prodRef, {
            stockQuantity: newStock,
            available: newStock > 0,
            updatedAt: serverTimestamp()
          });

          // Create inventory transaction record
          const invTxRef = getShopDoc('inventoryTransactions');
          batch.set(invTxRef, {
            productId: cartItem.product.id,
            productName: cartItem.product.name,
            quantityChanged: -cartItem.quantity,
            type: 'sale',
            reason: `Order ${orderNumber}`,
            previousStock: cartItem.product.stockQuantity,
            newStock,
            createdAt: serverTimestamp(),
            createdBy: currentUser?.name || 'POS Cashier'
          });
        }
      }

      // If voucher was used, increment usage
      if (effectiveVoucher) {
        const vRef = getShopDoc('vouchers', effectiveVoucher.id);
        batch.update(vRef, {
          usageCount: increment(1),
          // Single use globally - disable after first use
          ...(effectiveVoucher.usageType === 'single_use' ? { active: false } : {})
        });

        // Track usage for "once per customer" logic
        if (effectiveVoucher.usageType === 'once_per_customer' && orderCustomerId !== 'guest') {
          const userRef = doc(db, 'users', orderCustomerId);
          batch.update(userRef, {
            usedVoucherIds: arrayUnion(effectiveVoucher.id)
          });
        }

        // If it was a CLAIMED voucher (reward claim), consume it
        const usedCode = effectiveVoucher.code;
        const claimedVoucher = userVouchers.find(uv => uv.instanceCode === usedCode);
        if (claimedVoucher) {
          const uvRef = doc(db, `users/${orderCustomerId}/vouchers`, claimedVoucher.id);
          batch.delete(uvRef); // Consume the instance
        }
      }

      // If points reward was used, deduct points
      if (!customCart && appliedReward && orderCustomerId !== 'guest') {
        const userRef = getShopDoc('users', orderCustomerId);
        batch.update(userRef, {
          loyaltyPoints: increment(-appliedReward.pointsRequired)
        });

        const loyaltyTxRef = getShopDoc('loyaltyTransactions');
        batch.set(loyaltyTxRef, {
          customerId: orderCustomerId,
          customerName: orderCustomerName,
          pointsChanged: -appliedReward.pointsRequired,
          type: 'redeem',
          description: `Redeemed reward: ${appliedReward.name}`,
          createdAt: serverTimestamp()
        });
      }

      // Credit points earned, lifetime spending, and visit count (orderCount) instantly upon order placement
      if (orderCustomerId !== 'guest') {
        const userRef = getShopDoc('users', orderCustomerId);
        batch.update(userRef, {
          loyaltyPoints: increment(pointsEarned),
          lifetimePoints: increment(pointsEarned),
          lifetimeSpending: increment(total),
          orderCount: increment(1)
        });

        const loyaltyTxRef = getShopDoc('loyaltyTransactions');
        batch.set(loyaltyTxRef, {
          customerId: orderCustomerId,
          customerName: orderCustomerName,
          pointsChanged: pointsEarned,
          type: 'earn',
          orderId: orderRef.id,
          description: `Earned points from order ${orderNumber}`,
          createdAt: serverTimestamp()
        });
      }

      await batch.commit();

      // Clear the local customer cart if not customCart
      if (!customCart) {
        clearCart();
      }

      // Return a temporary full order representation for the customer to view immediately
      return {
        id: orderRef.id,
        ...orderData,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Order;

    } catch (e: any) {
      console.error("Order placement failed:", e);
      // Fallback local persistence if offline
      const tempId = `local_order_${Date.now()}`;
      const localOrder: Order = {
        id: tempId,
        ...orderData,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Order;
      
      setOrders(prev => [localOrder, ...prev]);
      clearCart();
      return localOrder;
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const orderRef = getShopDoc('orders', orderId);
      await updateDoc(orderRef, {
        orderStatus: status,
        updatedAt: serverTimestamp(),
        ...(status === 'completed' ? { completedAt: serverTimestamp() } : {})
      });

      const orderDoc = orders.find(o => o.id === orderId);

      await writeAuditLog(
        currentUser?.uid || 'staff',
        currentUser?.name || 'Staff',
        'order_status',
        orderId,
        orderDoc?.orderStatus || '',
        status
      );

    } catch (e) {
      console.error("Failed to update status:", e);
      // fallback
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, orderStatus: status, updatedAt: new Date() } : o));
    }
  };

  const updateOrderItemStatus = async (orderId: string, itemIndex: number, itemStatus: 'pending' | 'preparing' | 'ready') => {
    try {
      const orderDoc = orders.find(o => o.id === orderId);
      if (!orderDoc) return;

      const updatedItems = orderDoc.items.map((item, idx) => {
        if (idx === itemIndex) {
          return { ...item, itemStatus };
        }
        return item;
      });

      // Synchronize overall orderStatus if applicable
      let newOrderStatus = orderDoc.orderStatus;
      const allReady = updatedItems.every(i => (i.itemStatus || 'pending') === 'ready');
      const anyPreparing = updatedItems.some(i => (i.itemStatus || 'pending') === 'preparing' || (i.itemStatus || 'pending') === 'ready');

      if (allReady && newOrderStatus !== 'completed' && newOrderStatus !== 'cancelled') {
        newOrderStatus = 'ready';
      } else if (anyPreparing && newOrderStatus === 'pending') {
        newOrderStatus = 'preparing';
      }

      const orderRef = getShopDoc('orders', orderId);
      const updatePayload: any = {
        items: updatedItems,
        orderStatus: newOrderStatus,
        updatedAt: serverTimestamp()
      };
      if (newOrderStatus === 'completed') {
        updatePayload.completedAt = serverTimestamp();
      }

      await updateDoc(orderRef, updatePayload);

      // Optimistic update
      setOrders(prev => prev.map(o => o.id === orderId ? {
        ...o,
        items: updatedItems,
        orderStatus: newOrderStatus,
        updatedAt: new Date()
      } : o));

      await writeAuditLog(
        currentUser?.uid || 'staff',
        currentUser?.name || 'Staff',
        'order_item_status',
        `${orderId}-item-${itemIndex}`,
        orderDoc.items[itemIndex]?.itemStatus || 'pending',
        itemStatus
      );
    } catch (e) {
      console.error("Failed to update item status:", e);
      setOrders(prev => prev.map(o => {
        if (o.id !== orderId) return o;
        const updatedItems = o.items.map((item, idx) => idx === itemIndex ? { ...item, itemStatus } : item);
        return { ...o, items: updatedItems, updatedAt: new Date() };
      }));
    }
  };

  const updatePaymentStatus = async (orderId: string, status: PaymentStatus, cashReceived?: number, change?: number) => {
    try {
      const orderRef = getShopDoc('orders', orderId);
      const orderDoc = orders.find(o => o.id === orderId);
      
      let computedChange = change;
      if (computedChange === undefined && cashReceived !== undefined) {
        if (orderDoc?.total !== undefined) {
          computedChange = Math.max(0, cashReceived - orderDoc.total);
        } else {
          computedChange = 0;
        }
      }
      
      const updatePayload: any = {
        paymentStatus: status,
        updatedAt: serverTimestamp()
      };

      if (cashReceived !== undefined) {
        updatePayload.cashReceived = cashReceived;
      }
      if (computedChange !== undefined) {
        updatePayload.change = computedChange;
      }

      await updateDoc(orderRef, updatePayload);

      await writeAuditLog(
        currentUser?.uid || 'staff',
        currentUser?.name || 'Staff',
        'payment_status',
        orderId,
        orderDoc?.paymentStatus || '',
        status
      );

      // Optimistic update
      setOrders(prev => prev.map(o => o.id === orderId ? { 
        ...o, 
        paymentStatus: status, 
        updatedAt: new Date(),
        ...(cashReceived !== undefined ? { cashReceived } : {}),
        ...(computedChange !== undefined ? { change: computedChange } : {})
      } : o));
    } catch (e) {
      console.error("Failed to update payment status:", e);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, paymentStatus: status, updatedAt: new Date() } : o));
    }
  };

  const updateSettings = async (newSettings: Partial<SystemSettings>) => {
    try {
      const mergedSettings: SystemSettings = {
        ...settings,
        ...newSettings,
        storeStatus: {
          ...settings.storeStatus,
          ...(newSettings.storeStatus || {})
        },
        branding: {
          ...settings.branding,
          ...(newSettings.branding || {})
        },
        businessInfo: {
          ...settings.businessInfo,
          ...(newSettings.businessInfo || {})
        },
        orderSettings: {
          ...settings.orderSettings,
          ...(newSettings.orderSettings || {})
        },
        loyaltySettings: {
          ...settings.loyaltySettings,
          ...(newSettings.loyaltySettings || {})
        }
      };

      await traceSetDoc(getShopDoc('settings', 'config'), mergedSettings, { merge: true }, 'updateSettings');
      setSettings(mergedSettings);

      if (mergedSettings.accountsConfig) {
        await syncStaffAccountsToFirestore(mergedSettings.accountsConfig);
      }

      await writeAuditLog(
        currentUser?.uid || 'admin',
        currentUser?.name || 'Admin',
        'update_settings',
        'config',
        '',
        JSON.stringify(newSettings)
      );
    } catch (e) {
      console.error("Failed to update system settings:", e);
      throw e;
    }
  };

  const syncStaffAccounts = async (overrideConfig?: SystemSettings['accountsConfig']) => {
    await syncStaffAccountsToFirestore(overrideConfig || settings.accountsConfig);
  };

  // 7. Clear Sample Menu & All Menu Data operations
  const clearSampleMenuData = async () => {
    try {
      // 1. Delete all default demo categories from Firestore
      const demoCatIds = DEMO_CATEGORIES.map(c => c.id);
      for (const catId of demoCatIds) {
        try {
          await traceDeleteDoc(getShopDoc('categories', catId), 'clearSampleMenuData:category');
        } catch (err) {
          console.warn("Failed deleting demo category:", catId, err);
        }
      }

      // 2. Delete all default demo products from Firestore
      const demoProdIds = DEMO_PRODUCTS.map(p => p.id);
      for (const prodId of demoProdIds) {
        try {
          await traceDeleteDoc(getShopDoc('products', prodId), 'clearSampleMenuData:product');
        } catch (err) {
          console.warn("Failed deleting demo product:", prodId, err);
        }
      }

      // 3. Delete demo vouchers and rewards
      for (const v of DEMO_VOUCHERS) {
        try {
          await traceDeleteDoc(getShopDoc('vouchers', v.id), 'clearSampleMenuData:voucher');
        } catch (err) {
          console.warn("Failed deleting demo voucher:", v.id, err);
        }
      }
      for (const r of DEMO_REWARDS) {
        try {
          await traceDeleteDoc(getShopDoc('rewards', r.id), 'clearSampleMenuData:reward');
        } catch (err) {
          console.warn("Failed deleting demo reward:", r.id, err);
        }
      }

      // 4. Query and delete any remaining categories or products matching sample names or IDs
      try {
        const catSnap = await getDocs(getShopCol('categories'));
        catSnap.forEach(async (d) => {
          const data = d.data();
          if (demoCatIds.includes(d.id) || ['Coffee', 'Non-Coffee', 'Food & Pastries', 'Signature Specials'].includes(data.name)) {
            await traceDeleteDoc(getShopDoc('categories', d.id), 'clearSampleMenuData:categoryDoc');
          }
        });
      } catch (err) {
        console.warn("Cat cleanup query failed:", err);
      }

      try {
        const prodSnap = await getDocs(getShopCol('products'));
        prodSnap.forEach(async (d) => {
          const data = d.data();
          if (demoProdIds.includes(d.id) || ['Choco Lava', 'Banana muffin', 'Spanish Latte', 'Caramel Macchiato', 'Uji Matcha Latte'].includes(data.name)) {
            await traceDeleteDoc(getShopDoc('products', d.id), 'clearSampleMenuData:productDoc');
          }
        });
      } catch (err) {
        console.warn("Prod cleanup query failed:", err);
      }

      setCategories([]);
      setProducts([]);
      setCart([]);

      await writeAuditLog(
        currentUser?.uid || 'admin',
        currentUser?.name || 'Admin',
        'clear_sample_menu',
        'database',
        'sample_menu',
        'cleared'
      );
    } catch (e) {
      console.error("Clear sample menu data failed:", e);
      setCategories([]);
      setProducts([]);
      setCart([]);
    }
  };

  const clearAllMenuData = async () => {
    try {
      const catSnap = await getDocs(getShopCol('categories'));
      catSnap.forEach(async (d) => {
        await traceDeleteDoc(getShopDoc('categories', d.id), 'clearAllMenuData:category');
      });

      const prodSnap = await getDocs(getShopCol('products'));
      prodSnap.forEach(async (d) => {
        await traceDeleteDoc(getShopDoc('products', d.id), 'clearAllMenuData:product');
      });

      setCategories([]);
      setProducts([]);
      setCart([]);
    } catch (e) {
      console.error("Clear all menu data failed:", e);
      setCategories([]);
      setProducts([]);
    }
  };

  // Demo Data Loader (Now aliases to clear sample menu to ensure clean state as requested)
  const loadDemoData = async () => {
    await clearSampleMenuData();
  };

  const resetDatabase = async () => {
    try {
      await clearSampleMenuData();
      await setDoc(getShopDoc('settings', 'config'), DEFAULT_SETTINGS);
      setCart([]);
      setAppliedVoucher(null);
      setAppliedReward(null);
    } catch (e) {
      console.error(e);
    }
  };

  // CRUD OPERATIONS FOR ADMIN PANEL
  const addCategory = async (cat: Omit<Category, 'id'>) => {
    const id = `cat_${Date.now()}`;
    await traceSetDoc(getShopDoc('categories', id), cat, undefined, 'addCategory');
    await writeAuditLog(currentUser?.uid || 'admin', currentUser?.name || 'Admin', 'add_category', id, '', cat.name);
  };

  const updateCategory = async (id: string, cat: Partial<Category>) => {
    await traceUpdateDoc(getShopDoc('categories', id), cat, 'updateCategory');
    await writeAuditLog(currentUser?.uid || 'admin', currentUser?.name || 'Admin', 'update_category', id, '', JSON.stringify(cat));
  };

  const deleteCategory = async (id: string) => {
    const cRef = getShopDoc('categories', id);
    await traceDeleteDoc(cRef, 'deleteCategory');
    await writeAuditLog(currentUser?.uid || 'admin', currentUser?.name || 'Admin', 'delete_category', id, '', '');
  };

  const addProduct = async (prod: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = `prod_${Date.now()}`;
    const payload = {
      ...prod,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await traceSetDoc(getShopDoc('products', id), payload, undefined, 'addProduct');
    await writeAuditLog(currentUser?.uid || 'admin', currentUser?.name || 'Admin', 'add_product', id, '', prod.name);
  };

  const updateProduct = async (id: string, prod: Partial<Product>) => {
    const payload = {
      ...prod,
      updatedAt: serverTimestamp()
    };
    await traceUpdateDoc(getShopDoc('products', id), payload, 'updateProduct');
    await writeAuditLog(currentUser?.uid || 'admin', currentUser?.name || 'Admin', 'update_product', id, '', JSON.stringify(prod));
  };

  const deleteProduct = async (id: string) => {
    // Hard delete from master records
    await traceDeleteDoc(getShopDoc('products', id), 'deleteProduct');
    await writeAuditLog(currentUser?.uid || 'admin', currentUser?.name || 'Admin', 'delete_product', id, '', 'deleted');
  };

  const addVoucher = async (v: Omit<Voucher, 'id' | 'usageCount'>) => {
    const id = `vouch_${Date.now()}`;
    await traceSetDoc(getShopDoc('vouchers', id), { ...v, usageCount: 0 }, undefined, 'addVoucher');
    await writeAuditLog(currentUser?.uid || 'admin', currentUser?.name || 'Admin', 'add_voucher', id, '', v.code);
  };

  const updateVoucher = async (id: string, v: Partial<Voucher>) => {
    await traceUpdateDoc(getShopDoc('vouchers', id), v, 'updateVoucher');
    await writeAuditLog(currentUser?.uid || 'admin', currentUser?.name || 'Admin', 'update_voucher', id, '', JSON.stringify(v));
  };

  const deleteVoucher = async (id: string) => {
    await traceDeleteDoc(getShopDoc('vouchers', id), 'deleteVoucher');
    await writeAuditLog(currentUser?.uid || 'admin', currentUser?.name || 'Admin', 'delete_voucher', id, '', 'deleted');
  };

  const claimVoucher = async (voucherId: string) => {
    if (!currentUser) throw new Error("Authentication required to claim rewards.");
    
    const voucher = vouchers.find(v => v.id === voucherId);
    if (!voucher) throw new Error("Voucher not found.");
    if (!voucher.claimableViaPoints || !voucher.pointCost) throw new Error("This voucher is not claimable via points.");
    
    if (currentUser.loyaltyPoints < voucher.pointCost) {
      throw new Error(`Insufficient points. You need ${voucher.pointCost} points.`);
    }

    const batch = writeBatch(db);
    
    // Deduct points
    batch.update(doc(db, 'users', currentUser.uid), {
      loyaltyPoints: increment(-voucher.pointCost),
      updatedAt: serverTimestamp()
    });
    
    // Log loyalty transaction
    const txRef = doc(collection(db, `users/${currentUser.uid}/loyaltyTransactions`));
    batch.set(txRef, {
      customerId: currentUser.uid,
      customerName: currentUser.name,
      pointsChanged: -voucher.pointCost,
      type: 'redeem',
      description: `Claimed Voucher: ${voucher.name}`,
      createdAt: serverTimestamp()
    });

    // Add to user's vouchers
    const userVoucherRef = doc(collection(db, `users/${currentUser.uid}/vouchers`));
    batch.set(userVoucherRef, {
      ...voucher,
      originalVoucherId: voucher.id,
      claimedAt: serverTimestamp(),
      status: 'active',
      instanceCode: `${voucher.code}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
    });

    await batch.commit();
    await writeAuditLog(currentUser.uid, currentUser.name, 'claim_voucher', voucher.id, `${currentUser.loyaltyPoints}`, `${currentUser.loyaltyPoints - voucher.pointCost}`);
  };

  const addReward = async (rew: Omit<Reward, 'id'>) => {
    const id = `rew_${Date.now()}`;
    await traceSetDoc(getShopDoc('rewards', id), rew, undefined, 'addReward');
    await writeAuditLog(currentUser?.uid || 'admin', currentUser?.name || 'Admin', 'add_reward', id, '', rew.name);
  };

  const updateReward = async (id: string, rew: Partial<Reward>) => {
    await traceUpdateDoc(getShopDoc('rewards', id), rew, 'updateReward');
    await writeAuditLog(currentUser?.uid || 'admin', currentUser?.name || 'Admin', 'update_reward', id, '', JSON.stringify(rew));
  };

  const deleteReward = async (id: string) => {
    await traceDeleteDoc(getShopDoc('rewards', id), 'deleteReward');
    await writeAuditLog(currentUser?.uid || 'admin', currentUser?.name || 'Admin', 'delete_reward', id, '', 'deleted');
  };

  const adjustInventory = async (productId: string, quantityChanged: number, reason: string) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    const previousStock = prod.stockQuantity;
    const newStock = Math.max(0, previousStock + quantityChanged);

    const batch = writeBatch(db);
    batch.update(getShopDoc('products', productId), {
      stockQuantity: newStock,
      available: newStock > 0,
      updatedAt: serverTimestamp()
    });

    const txRef = getShopDoc('inventoryTransactions');
    batch.set(txRef, {
      productId,
      productName: prod.name,
      quantityChanged,
      type: quantityChanged > 0 ? 'add' : 'remove',
      reason,
      previousStock,
      newStock,
      createdAt: serverTimestamp(),
      createdBy: currentUser?.name || 'Administrator'
    });

    await batch.commit();
    await writeAuditLog(
      currentUser?.uid || 'admin',
      currentUser?.name || 'Admin',
      'adjust_inventory',
      productId,
      `Stock: ${previousStock}`,
      `Stock: ${newStock}`
    );
  };

  const adjustUserPoints = async (userId: string, pointsChanged: number, reason: string) => {
    const user = usersList.find(u => u.uid === userId);
    if (!user) return;

    const prevPoints = user.loyaltyPoints;
    const newPoints = Math.max(0, prevPoints + pointsChanged);

    const batch = writeBatch(db);
    batch.update(getShopDoc('users', userId), {
      loyaltyPoints: newPoints,
      lifetimePoints: pointsChanged > 0 ? increment(pointsChanged) : increment(0)
    });

    const txRef = getShopDoc('loyaltyTransactions');
    batch.set(txRef, {
      customerId: userId,
      customerName: user.name,
      pointsChanged,
      type: pointsChanged > 0 ? 'adjust' : 'redeem',
      description: `Manual Adjustment: ${reason}`,
      createdAt: serverTimestamp()
    });

    await batch.commit();
    await writeAuditLog(
      currentUser?.uid || 'admin',
      currentUser?.name || 'Admin',
      'adjust_points',
      userId,
      `Points: ${prevPoints}`,
      `Points: ${newPoints}`
    );
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    const userDocRef = getShopDoc('users', currentUser.uid);
    const payload = {
      ...data,
      updatedAt: serverTimestamp()
    };
    await traceUpdateDoc(userDocRef, payload, 'updateUserProfile');
    setCurrentUser(prev => prev ? { ...prev, ...data } : null);
    setUsersList(prev => prev.map(u => u.uid === currentUser.uid ? { ...u, ...data } : u));
  };

  // Generic Firestore CRUD API
  const getDocuments = async <T,>(collectionName: string): Promise<T[]> => {
    const qSnap = await getDocs(getShopCol(collectionName));
    const list: any[] = [];
    qSnap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
    return list as T[];
  };

  const getDocument = async <T,>(collectionName: string, id: string): Promise<T | null> => {
    const dSnap = await getDoc(getShopDoc(collectionName, id));
    if (dSnap.exists()) {
      return { id: dSnap.id, ...dSnap.data() } as T;
    }
    return null;
  };

  const addDocument = async <T extends object>(collectionName: string, data: T, customId?: string): Promise<string> => {
    if (customId) {
      await traceSetDoc(getShopDoc(collectionName, customId), data, undefined, `addDocument:${collectionName}`);
      return customId;
    } else {
      const docRef = await traceAddDoc(getShopCol(collectionName), data, `addDocument:${collectionName}`);
      return docRef.id;
    }
  };

  const updateDocument = async <T extends object>(collectionName: string, id: string, data: Partial<T>): Promise<void> => {
    await traceUpdateDoc(getShopDoc(collectionName, id), data as any, `updateDocument:${collectionName}`);
  };

  const deleteDocument = async (collectionName: string, id: string): Promise<void> => {
    await traceDeleteDoc(getShopDoc(collectionName, id), `deleteDocument:${collectionName}`);
  };

  return (
    <CoffeeAppContext.Provider value={{
      dbStatus,
      currentUser,
      authLoading,
      activeWorkspace,
      switchWorkspace,
      login,
      register,
      logout,
      simulateRole,
      categories,
      products,
      vouchers,
      userVouchers,
      rewards,
      orders,
      usersList,
      auditLogs,
      inventoryLogs,
      loyaltyTransactions,
      settings,
      dataLoading,
      cart,
      addToCart,
      removeFromCart,
      updateCartItem,
      clearCart,
      appliedVoucher,
      applyVoucher,
      removeVoucher,
      appliedReward,
      applyReward,
      removeReward,
      placeOrder,
      updateOrderStatus,
      updateOrderItemStatus,
      updatePaymentStatus,
      updateSettings,
      loadDemoData,
      clearSampleMenuData,
      clearAllMenuData,
      resetDatabase,
      addCategory,
      updateCategory,
      deleteCategory,
      addProduct,
      updateProduct,
      deleteProduct,
      addVoucher,
      updateVoucher,
      deleteVoucher,
      claimVoucher,
      addReward,
      updateReward,
      deleteReward,
      adjustInventory,
      adjustUserPoints,
      updateUserProfile,
      syncStaffAccounts,
      getDocuments,
      getDocument,
      addDocument,
      updateDocument,
      deleteDocument
    }}>
      {children}
    </CoffeeAppContext.Provider>
  );
};

export const useCoffeeApp = () => {
  const context = useContext(CoffeeAppContext);
  if (!context) throw new Error("useCoffeeApp must be used inside CoffeeAppProvider");
  return context;
};
