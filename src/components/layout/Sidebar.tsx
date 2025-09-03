import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  Clock,
  Users,
  FileText,
  Settings,
  LogOut,
  UserCircle,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "My Requests", href: "/requests", icon: Clock },
  { name: "Team Calendar", href: "/calendar", icon: Calendar },
  { name: "Employees", href: "/employees", icon: Users },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Profile", href: "/profile", icon: UserCircle },
];

export const Sidebar = () => {
  const location = useLocation();

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-sidebar px-6 pb-4">
        <div className="flex h-16 shrink-0 items-center">
          <h1 className="text-xl font-bold text-sidebar-foreground">LeaveManager Pro</h1>
        </div>
        
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={cn(
                        location.pathname === item.href
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6"
                      )}
                    >
                      <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
            
            <li className="mt-auto">
              <ul role="list" className="-mx-2 space-y-1">
                <li>
                  <Link
                    to="/settings"
                    className={cn(
                      location.pathname === "/settings"
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6"
                    )}
                  >
                    <Settings className="h-6 w-6 shrink-0" aria-hidden="true" />
                    Settings
                  </Link>
                </li>
                <li>
                  <button className="group flex w-full gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                    <LogOut className="h-6 w-6 shrink-0" aria-hidden="true" />
                    Sign out
                  </button>
                </li>
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};