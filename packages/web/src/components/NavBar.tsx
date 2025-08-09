import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
  cn
} from "@medimate/components";
import { User, LogOut } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

const components: { title: string; href: string; description: string }[] = [
  {
    title: "All Medications",
    href: "/medications",
    description:
      "View and manage all your medications in one place.",
  },
  {
    title: "Add Medication",
    href: "/medications/add",
    description:
      "Add a new medication to your tracking list.",
  },
];

const reminders: { title: string; href: string; description: string }[] = [
  {
    title: "Active Reminders",
    href: "/reminders",
    description:
      "View all your active medication reminders.",
  },
  {
    title: "Create Reminder",
    href: "/reminders/create",
    description:
      "Set up a new medication reminder.",
  },
  {
    title: "History",
    href: "/reminders/history",
    description: "View your reminder history and adherence.",
  },
];

export function NavBar({ user, onLogout }: { user: any; onLogout: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-card shadow-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-8">
            <h1 
              className="text-3xl font-bold text-foreground cursor-pointer"
              onClick={() => navigate('/dashboard')}
            >
              MediMate
            </h1>
            
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink 
                    className={navigationMenuTriggerStyle()} 
                    onClick={() => navigate('/dashboard')}
                    data-active={isActive('/dashboard') ? true : undefined}
                  >
                    Dashboard
                  </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger>Medications</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                      <li className="row-span-3">
                        <NavigationMenuLink asChild>
                          <a
                            className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md cursor-pointer"
                            onClick={() => navigate('/medications')}
                          >
                            <div className="mb-2 mt-4 text-lg font-medium">
                              Medication Management
                            </div>
                            <p className="text-sm leading-tight text-muted-foreground">
                              Track, manage, and stay on top of all your medications.
                            </p>
                          </a>
                        </NavigationMenuLink>
                      </li>
                      {components.map((component) => (
                        <ListItem
                          key={component.title}
                          title={component.title}
                          onClick={() => navigate(component.href)}
                        >
                          {component.description}
                        </ListItem>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger>Reminders</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                      {reminders.map((reminder) => (
                        <ListItem
                          key={reminder.title}
                          title={reminder.title}
                          onClick={() => navigate(reminder.href)}
                        >
                          {reminder.description}
                        </ListItem>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuLink 
                    className={navigationMenuTriggerStyle()} 
                    onClick={() => navigate('/calendar')}
                    data-active={isActive('/calendar') ? true : undefined}
                  >
                    Calendar
                  </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuLink 
                    className={navigationMenuTriggerStyle()} 
                    onClick={() => navigate('/analytics')}
                    data-active={isActive('/analytics') ? true : undefined}
                  >
                    Analytics
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <span className="text-sm text-muted-foreground">
                Welcome, {user.name}
              </span>
            )}
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink 
                    className={cn(navigationMenuTriggerStyle(), "h-9 w-9 p-0")}
                    onClick={() => navigate('/profile')}
                    title="Profile"
                  >
                    <User className="h-5 w-5" />
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
            <ThemeToggle />
            <button
              onClick={onLogout}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";