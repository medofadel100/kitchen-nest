"use client";

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ children, allowedRoles, fallback = null }) => {
  const { appUser, loading } = useAuth();

  if (loading) return null;
  
  if (!appUser || !allowedRoles.includes(appUser.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
