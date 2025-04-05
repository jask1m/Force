"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileText,
  Video,
  CheckSquare,
  User,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type SidebarProps = {
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const DashboardSidebar = ({
  isMobileSidebarOpen,
  setIsMobileSidebarOpen
}: SidebarProps) => {
  const pathname = usePathname();

  const menuItems = [
    {
      title: 'Dashboard',
      icon: <FileText className="h-5 w-5" />,
      path: '/dashboard',
    },
    {
      title: 'Record Video',
      icon: <Video className="h-5 w-5" />,
      path: '/dashboard/record',
    },
    {
      title: 'My Documents',
      icon: <CheckSquare className="h-5 w-5" />,
      path: '/dashboard/documents',
    },
    {
      title: 'Profile',
      icon: <User className="h-5 w-5" />,
      path: '/dashboard/profile',
    },
  ];

  return (
    <>
      {/* Mobile Sidebar Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          aria-label="Toggle menu"
        >
          {isMobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-5 border-b border-border">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
                name of project
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-5 overflow-y-auto">
            <ul className="space-y-1">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className={cn(
                      "flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors",
                      pathname === item.path
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    {item.icon}
                    <span className="ml-3">{item.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-5 border-t border-border">
            <Button
              variant="outline"
              className="w-full flex items-center justify-center"
              asChild
            >
              <Link href="/">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </Link>
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default DashboardSidebar;