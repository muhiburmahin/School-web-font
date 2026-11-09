"use client";

import { NavigationMenu as NavigationMenuPrimitive } from "@base-ui/react/navigation-menu";
import { cn } from "cn";

function NavigationMenu({ className, ...props }: NavigationMenuPrimitive.Root.Props) {
  return <NavigationMenuPrimitive.Root className={cn("relative", className)} {...props} />;
}

function NavigationMenuList({ className, ...props }: NavigationMenuPrimitive.List.Props) {
  return <NavigationMenuPrimitive.List className={cn("flex items-center gap-1", className)} {...props} />;
}

function NavigationMenuItem({ ...props }: NavigationMenuPrimitive.Item.Props) {
  return <NavigationMenuPrimitive.Item {...props} />;
}

function NavigationMenuTrigger({ className, ...props }: NavigationMenuPrimitive.Trigger.Props) {
  return <NavigationMenuPrimitive.Trigger className={cn("rounded-md px-3 py-2 text-sm hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none", className)} {...props} />;
}

function NavigationMenuContent({ className, ...props }: NavigationMenuPrimitive.Content.Props) {
  return <NavigationMenuPrimitive.Content className={cn("grid min-w-48 gap-1 p-2", className)} {...props} />;
}

function NavigationMenuLink({ className, ...props }: NavigationMenuPrimitive.Link.Props) {
  return <NavigationMenuPrimitive.Link className={cn("rounded-md px-3 py-2 text-sm hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none aria-[current=page]:bg-muted", className)} {...props} />;
}

function NavigationMenuPopup() {
  return (
    <NavigationMenuPrimitive.Portal>
      <NavigationMenuPrimitive.Positioner className="z-50" sideOffset={8}>
        <NavigationMenuPrimitive.Popup className="rounded-lg border bg-popover text-popover-foreground shadow-md outline-none motion-reduce:animate-none">
          <NavigationMenuPrimitive.Viewport />
        </NavigationMenuPrimitive.Popup>
      </NavigationMenuPrimitive.Positioner>
    </NavigationMenuPrimitive.Portal>
  );
}

export { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuPopup, NavigationMenuTrigger };
