import Purchases, {
  type CustomerInfo,
  type PurchasesPackage,
} from 'react-native-purchases';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { AppState, Platform } from 'react-native';
import { usePathname } from 'expo-router';

import { getOpenDatingClient } from '@/lib/opendating/open-dating-client';
import {
  deriveRevenueCatAppUserId,
  getRevenueCatApiKey,
  isRevenueCatEnabled,
  isRevenueCatKeyValid,
  isTrustedRevenueCatVerification,
  OPENDATING_ENTITLEMENT_ID,
  OPENDATING_OFFERING_ID,
  OPENDATING_PRODUCT_IDS,
} from '@/lib/revenuecat-config';

interface RevenueCatValue {
  enabled: boolean;
  ready: boolean;
  isPlus: boolean;
  packages: PurchasesPackage[];
  error: string | null;
  purchase: (pkg: PurchasesPackage) => Promise<boolean>;
  restore: () => Promise<boolean>;
}

const RevenueCatContext = createContext<RevenueCatValue>({
  enabled: false,
  ready: true,
  isPlus: false,
  packages: [],
  error: null,
  purchase: async () => false,
  restore: async () => false,
});

let configuredApiKey: string | null = null;

function hasPlus(customerInfo: CustomerInfo): boolean {
  const entitlement = customerInfo.entitlements.active[OPENDATING_ENTITLEMENT_ID];
  return Boolean(entitlement && isTrustedRevenueCatVerification(entitlement.verification));
}

function messageFor(error: unknown): string {
  if (
    typeof error === 'object' &&
    error &&
    'code' in error &&
    error.code === Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR
  ) {
    return '';
  }
  return 'Purchases are unavailable right now. Please try again later.';
}

export function RevenueCatProvider({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const apiKey = getRevenueCatApiKey(Platform.OS);
  const enabled =
    isRevenueCatEnabled() &&
    Platform.OS !== 'web' &&
    isRevenueCatKeyValid(apiKey, Platform.OS);
  const [ready, setReady] = useState(!enabled);
  const [isPlus, setIsPlus] = useState(false);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [customerInfo, offerings] = await Promise.all([
      Purchases.getCustomerInfo(),
      Purchases.getOfferings(),
    ]);
    setIsPlus(hasPlus(customerInfo));
    const offering = offerings.all[OPENDATING_OFFERING_ID] ?? offerings.current;
    setPackages(
      (offering?.availablePackages ?? []).filter((pkg) =>
        OPENDATING_PRODUCT_IDS.has(pkg.product.identifier),
      ),
    );
  }, []);

  const syncOpaqueIdentity = useCallback(async () => {
    const pubkey = await getOpenDatingClient().getPubkey();
    const currentUserId = await Purchases.getAppUserID();
    if (!pubkey) {
      if (!currentUserId.startsWith('$RCAnonymousID')) {
        const customerInfo = await Purchases.logOut();
        setIsPlus(hasPlus(customerInfo));
      }
      return;
    }

    const billingId = await deriveRevenueCatAppUserId(pubkey);
    if (currentUserId !== billingId) {
      const result = await Purchases.logIn(billingId);
      setIsPlus(hasPlus(result.customerInfo));
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let active = true;
    const listener = (customerInfo: CustomerInfo) => {
      if (active) setIsPlus(hasPlus(customerInfo));
    };
    const initialize = async () => {
      try {
        setError(null);
        if (!configuredApiKey) {
          Purchases.configure({
            apiKey,
            entitlementVerificationMode:
              Purchases.ENTITLEMENT_VERIFICATION_MODE.INFORMATIONAL,
          });
          configuredApiKey = apiKey;
        }
        Purchases.addCustomerInfoUpdateListener(listener);
        await syncOpaqueIdentity();
        await refresh();
      } catch (caught) {
        if (active) setError(messageFor(caught) || null);
      } finally {
        if (active) setReady(true);
      }
    };

    void initialize();
    return () => {
      active = false;
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [apiKey, enabled, refresh, syncOpaqueIdentity]);

  useEffect(() => {
    if (!enabled || !configuredApiKey) return;
    queueMicrotask(() => {
      void syncOpaqueIdentity().then(refresh).catch((caught) => setError(messageFor(caught)));
    });
  }, [enabled, pathname, refresh, syncOpaqueIdentity]);

  useEffect(() => {
    if (!enabled) return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void syncOpaqueIdentity().then(refresh).catch((caught) => setError(messageFor(caught)));
      }
    });
    return () => subscription.remove();
  }, [enabled, refresh, syncOpaqueIdentity]);

  const purchase = useCallback(async (pkg: PurchasesPackage) => {
    if (!enabled) return false;
    try {
      setError(null);
      const result = await Purchases.purchasePackage(pkg);
      const active = hasPlus(result.customerInfo);
      setIsPlus(active);
      return active;
    } catch (caught) {
      const message = messageFor(caught);
      if (message) setError(message);
      return false;
    }
  }, [enabled]);

  const restore = useCallback(async () => {
    if (!enabled) return false;
    try {
      setError(null);
      const customerInfo = await Purchases.restorePurchases();
      const active = hasPlus(customerInfo);
      setIsPlus(active);
      return active;
    } catch (caught) {
      setError(messageFor(caught));
      return false;
    }
  }, [enabled]);

  const value = useMemo<RevenueCatValue>(() => ({
    enabled,
    ready,
    isPlus,
    packages,
    error,
    purchase,
    restore,
  }), [enabled, error, isPlus, packages, purchase, ready, restore]);

  return <RevenueCatContext.Provider value={value}>{children}</RevenueCatContext.Provider>;
}

export function useRevenueCat(): RevenueCatValue {
  return useContext(RevenueCatContext);
}
