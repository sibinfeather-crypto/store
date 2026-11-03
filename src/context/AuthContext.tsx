import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ShippingAddress } from '../types/index.ts';

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  savedAddresses: ShippingAddress[];
}

interface AuthContextType {
  customer: CustomerUser | null;
  setCustomer: (customer: CustomerUser | null) => void;
  loginCustomer: (name: string, email: string, phone: string) => void;
  logoutCustomer: () => void;
  saveAddress: (address: ShippingAddress) => void;
  isAdminLoggedIn: boolean;
  adminToken: string | null;
  adminUser: { id: string; username: string; role: string } | null;
  loginAdmin: (token: string, user: { id: string; username: string; role: string }) => void;
  logoutAdmin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customer, setCustomer] = useState<CustomerUser | null>(() => {
    try {
      const saved = localStorage.getItem('fanko_customer');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [adminToken, setAdminToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('fanko_admin_token') || null;
    } catch {
      return null;
    }
  });

  const [adminUser, setAdminUser] = useState<{ id: string; username: string; role: string } | null>(
    () => {
      try {
        const saved = localStorage.getItem('fanko_admin_user');
        return saved ? JSON.parse(saved) : null;
      } catch {
        return null;
      }
    }
  );

  useEffect(() => {
    if (customer) {
      localStorage.setItem('fanko_customer', JSON.stringify(customer));
    } else {
      localStorage.removeItem('fanko_customer');
    }
  }, [customer]);

  const loginCustomer = (name: string, email: string, phone: string) => {
    const newUser: CustomerUser = {
      id: `cust-${Date.now()}`,
      name,
      email,
      phone,
      savedAddresses: customer?.savedAddresses || [],
    };
    setCustomer(newUser);
  };

  const logoutCustomer = () => {
    setCustomer(null);
  };

  const saveAddress = (address: ShippingAddress) => {
    setCustomer((prev) => {
      if (!prev) {
        return {
          id: `cust-${Date.now()}`,
          name: address.fullName,
          email: address.email || '',
          phone: address.phone,
          savedAddresses: [address],
        };
      }
      const existingIdx = prev.savedAddresses.findIndex(
        (a) => a.addressLine === address.addressLine && a.pincode === address.pincode
      );
      const updated = [...prev.savedAddresses];
      if (existingIdx >= 0) {
        updated[existingIdx] = address;
      } else {
        updated.unshift(address);
      }
      return { ...prev, savedAddresses: updated };
    });
  };

  const loginAdmin = (token: string, user: { id: string; username: string; role: string }) => {
    setAdminToken(token);
    setAdminUser(user);
    localStorage.setItem('fanko_admin_token', token);
    localStorage.setItem('fanko_admin_user', JSON.stringify(user));
  };

  const logoutAdmin = () => {
    setAdminToken(null);
    setAdminUser(null);
    localStorage.removeItem('fanko_admin_token');
    localStorage.removeItem('fanko_admin_user');
  };

  return (
    <AuthContext.Provider
      value={{
        customer,
        setCustomer,
        loginCustomer,
        logoutCustomer,
        saveAddress,
        isAdminLoggedIn: Boolean(adminToken),
        adminToken,
        adminUser,
        loginAdmin,
        logoutAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
