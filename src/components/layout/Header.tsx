import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Header = () => {
  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-background px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <Button variant="ghost" size="sm" className="lg:hidden">
        <Menu className="h-6 w-6" />
      </Button>

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1"></div>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <Button variant="ghost" size="sm">
            <Bell className="h-6 w-6" />
            <span className="sr-only">View notifications</span>
          </Button>

          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-border" aria-hidden="true" />

          <div className="flex items-center gap-x-4">
            <span className="text-sm font-medium text-foreground">John Manager</span>
            <div className="h-8 w-8 rounded-full bg-primary" />
          </div>
        </div>
      </div>
    </div>
  );
};