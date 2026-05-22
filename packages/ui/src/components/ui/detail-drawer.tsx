'use client';

import * as React from 'react';

import { cn } from '../../lib/cn';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

interface DetailDrawerTab {
    value: string;
    label: string;
    content: React.ReactNode;
}

interface DetailDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    subtitle?: string;
    tabs?: DetailDrawerTab[];
    footer?: React.ReactNode;
    children?: React.ReactNode;
    width?: 'sm' | 'md' | 'lg';
}

const widthClass: Record<NonNullable<DetailDrawerProps['width']>, string> = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-xl',
    lg: 'sm:max-w-2xl',
};

function DetailDrawer({
    open,
    onOpenChange,
    title,
    subtitle,
    tabs,
    footer,
    children,
    width = 'md',
}: DetailDrawerProps) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className={cn('flex h-full w-full flex-col gap-0 p-0', widthClass[width])}>
                <SheetHeader className="border-border border-b px-5 py-4">
                    <SheetTitle className="text-foreground text-base font-medium">{title}</SheetTitle>
                    {subtitle ? (
                        <SheetDescription className="text-muted-foreground text-sm">{subtitle}</SheetDescription>
                    ) : null}
                </SheetHeader>
                {tabs && tabs.length > 0 ? (
                    <Tabs defaultValue={tabs[0]?.value} className="flex h-full min-h-0 flex-col">
                        <div className="border-border border-b px-5 pt-3">
                            <TabsList>
                                {tabs.map((tab) => (
                                    <TabsTrigger key={tab.value} value={tab.value}>
                                        {tab.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                            {tabs.map((tab) => (
                                <TabsContent key={tab.value} value={tab.value} className="mt-0 outline-none">
                                    {tab.content}
                                </TabsContent>
                            ))}
                        </div>
                    </Tabs>
                ) : (
                    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
                )}
                {footer ? (
                    <div className="border-border bg-background sticky bottom-0 border-t px-5 py-3">{footer}</div>
                ) : null}
            </SheetContent>
        </Sheet>
    );
}

export { DetailDrawer };
export type { DetailDrawerProps, DetailDrawerTab };
