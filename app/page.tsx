"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddFamilyForm } from "@/components/add-family-form";
import { SearchBrowse } from "@/components/search-browse";
import { ManageCategories } from "@/components/manage-categories";
import { Plus, Search, Box, Layers } from "lucide-react";

export default function RevitFamilyManager() {
  const [activeTab, setActiveTab] = useState("browse");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Box className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                Revit Family Manager
              </h1>
              <p className="text-sm text-muted-foreground">
                Organize and manage your BIM content library
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-3 bg-secondary">
            <TabsTrigger
              value="browse"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Search className="w-4 h-4 mr-2" />
              Search & Browse
            </TabsTrigger>
            <TabsTrigger
              value="add"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Family
            </TabsTrigger>
            <TabsTrigger
              value="categories"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Layers className="w-4 h-4 mr-2" />
              Categories
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="mt-6">
            <SearchBrowse />
          </TabsContent>

          <TabsContent value="add" className="mt-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-foreground">Add New Family</h2>
                <p className="text-sm text-muted-foreground">
                  Fill in the details below to add a new Revit family to your library
                </p>
              </div>
              <AddFamilyForm
                onSuccess={() => {
                  setActiveTab("browse");
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="categories" className="mt-6">
            <ManageCategories />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <p className="text-xs text-muted-foreground text-center">
            BIM Content Management System
          </p>
        </div>
      </footer>
    </div>
  );
}
