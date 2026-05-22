'use client';

import { FeatureLayout } from '@lumiris/ui/components/feature-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@lumiris/ui/components/tabs';
import { IdentityTab } from './identity-tab';
import { LabelsTab } from './labels-tab';
import { SecurityTab } from './security-tab';
import { TeamTab } from './team-tab';

export function WorkspaceProfile() {
    return (
        <div className="p-4 md:p-8">
            <FeatureLayout title="Profil de l'atelier" description="Identité, labels, équipe et sécurité.">
                <Tabs defaultValue="identity">
                    <TabsList>
                        <TabsTrigger value="identity">Identité</TabsTrigger>
                        <TabsTrigger value="labels">Labels</TabsTrigger>
                        <TabsTrigger value="team">Équipe</TabsTrigger>
                        <TabsTrigger value="security">Sécurité</TabsTrigger>
                    </TabsList>
                    <TabsContent value="identity" className="pt-4">
                        <IdentityTab />
                    </TabsContent>
                    <TabsContent value="labels" className="pt-4">
                        <LabelsTab />
                    </TabsContent>
                    <TabsContent value="team" className="pt-4">
                        <TeamTab />
                    </TabsContent>
                    <TabsContent value="security" className="pt-4">
                        <SecurityTab />
                    </TabsContent>
                </Tabs>
            </FeatureLayout>
        </div>
    );
}
