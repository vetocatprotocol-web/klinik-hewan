"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";

export function DashboardShell({
  role,
  userName,
  userEmail,
  userImage,
  children,
}: {
  role: string;
  userName: string;
  userEmail: string;
  userImage: string | null;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        role={role}
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
        userName={userName}
        userImage={userImage}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar userName={userName} userEmail={userEmail} userImage={userImage} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
