"use client";

import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { cn } from "cn";

function Accordion({ className, ...props }: AccordionPrimitive.Root.Props) {
  return <AccordionPrimitive.Root className={cn("grid", className)} {...props} />;
}

function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
  return <AccordionPrimitive.Item className={cn("border-b", className)} {...props} />;
}

function AccordionTrigger({ className, ...props }: AccordionPrimitive.Trigger.Props) {
  return (
    <AccordionPrimitive.Header>
      <AccordionPrimitive.Trigger className={cn("flex w-full items-center justify-between px-3 py-3 text-left text-sm focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none", className)} {...props} />
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({ className, ...props }: AccordionPrimitive.Panel.Props) {
  return <AccordionPrimitive.Panel className={cn("grid gap-1 px-3 pb-3", className)} {...props} />;
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
