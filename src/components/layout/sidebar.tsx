"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn, getInitials } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  FileText,
  ShoppingCart,
  Receipt,
  BarChart3,
  Heart,
  Pill,
  Package,
  Warehouse,
  UserCog,
  Settings,
  PawPrint,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signOut } from "next-auth/react";

const iconMap: Record<string, React.ComponentType<any>> = {
  LayoutDashboard,
  Users,
  Stethoscope,
  FileText,
  ShoppingCart,
  Receipt,
  BarChart3,
  Heart,
  Pill,
  Package,
  Warehouse,
  UserCog,
  Settings,
  PawPrint,
  Clock,
  User,
};

interface SidebarProps {
  role: string;
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ role, collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const items = NAV_ITEMS[role as keyof typeof NAV_ITEMS] || [];
  const user = session?.user;

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && (
          <span className="text-lg font-bold text-primary">PetCare</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        {items.map((item, index) => {
          if ("type" in item && item.type === "divider") {
            return <div key={index} className="my-2 border-t" />;
          }

          if ("href" in item) {
            const Icon = iconMap[item.icon || "LayoutDashboard"];
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                title={collapsed ? item.label : undefined}
              >
                {Icon && <Icon className="h-4 w-4 shrink-0" />}
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          }

          return null;
        })}
      </nav>

      <div className="border-t p-3">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.image || ""} alt={user?.name || ""} />
            <AvatarFallback>{getInitials(user?.name || "U")}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate capitalize">{role}</p>
            </div>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => signOut({ callbackUrl: "/login" })}
              title="Keluar"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
