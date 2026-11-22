'use client';
/* eslint-disable react/jsx-no-literals -- dev-only showcase, deliberately not translated */

import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

/** Interactive shadcn components for the /dev/ui page. Dev only, so the copy is not translated. */
export function Demos() {
  return (
    <div className="grid gap-10">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="dev-input">Input</Label>
          <Input id="dev-input" placeholder="Hotel name" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="dev-select">Select</Label>
          <Select defaultValue="djerba">
            <SelectTrigger id="dev-select" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="djerba">Djerba</SelectItem>
              <SelectItem value="sousse">Sousse</SelectItem>
              <SelectItem value="hammamet">Hammamet</SelectItem>
              <SelectItem value="tozeur">Tozeur</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2 md:col-span-2">
          <Label htmlFor="dev-textarea">Textarea</Label>
          <Textarea id="dev-textarea" placeholder="Anything we should know?" />
        </div>
        <div className="flex items-center gap-3">
          <Switch id="dev-switch" defaultChecked />
          <Label htmlFor="dev-switch">Switch: heated pool</Label>
        </div>
        <div className="flex items-center gap-3">
          <Checkbox id="dev-check" />
          <Label htmlFor="dev-check">Checkbox: I agree</Label>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="pt-3 text-muted">Tabs: overview panel.</TabsContent>
        <TabsContent value="notes" className="pt-3 text-muted">Tabs: notes panel.</TabsContent>
        <TabsContent value="history" className="pt-3 text-muted">Tabs: history panel.</TabsContent>
      </Tabs>

      <div className="flex flex-wrap items-center gap-3">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Open dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dialog</DialogTitle>
              <DialogDescription>Focus is trapped inside and Escape closes it.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button>Got it</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">Open sheet</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Sheet</SheetTitle>
              <SheetDescription>Used for the mobile menu.</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
        <Button variant="outline" onClick={() => toast.success('Toast: request sent')}>
          Show toast
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost">Hover or focus me</Button>
          </TooltipTrigger>
          <TooltipContent>Tooltip</TooltipContent>
        </Tooltip>
      </div>

      <Accordion type="single" collapsible className="max-w-xl">
        <AccordionItem value="a">
          <AccordionTrigger>Accordion: what does a study cost?</AccordionTrigger>
          <AccordionContent>Price on request, after a first call.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="b">
          <AccordionTrigger>Accordion: how long does it take?</AccordionTrigger>
          <AccordionContent>A few weeks, depending on the bills.</AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
