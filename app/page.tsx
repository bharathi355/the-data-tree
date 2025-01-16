"use client";

import { useState } from "react";
import { Upload, FileUp, Trash2, Download, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MindMap from "@/components/MindMap";
import FileUpload from "@/components/FileUpload";
import Analytics from "@/components/Analytics";

export default function Home() {
  const [activeFile, setActiveFile] = useState<File | null>(null);
  
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileUp className="h-6 w-6" />
              <h1 className="text-2xl font-bold">The Data Visualizer</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="mindmap" className="space-y-4">
          <TabsList>
            <TabsTrigger value="mindmap">Mind Map</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="mindmap" className="space-y-4">
            <Card className="p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <FileUpload onFileSelect={setActiveFile} />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" disabled={!activeFile}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="destructive" disabled={!activeFile}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </div>
            </Card>
            <MindMap file={activeFile} />
          </TabsContent>

          <TabsContent value="analytics">
            <Analytics file={activeFile} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}