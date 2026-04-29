"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createFamily, getCategoryMap, type FamilyFormData } from "@/app/actions";
import { Loader2, Plus, Check } from "lucide-react";

const REVIT_VERSIONS = [
  "Revit 2020",
  "Revit 2021",
  "Revit 2022",
  "Revit 2023",
  "Revit 2024",
  "Revit 2025",
  "Revit 2026",
];

const FILE_FORMATS = [".rfa", ".rte", ".rvt", ".rft"];

const TAGS = [
  "Parametric",
  "Nested",
  "Shared",
  "Face-Based",
  "Adaptive",
  "In-Place",
  "Type Catalog",
  "Annotation",
  "Detail",
  "Model",
  "Non Hosted",
  "Title Block",
];

const STATUSES = ["Active", "Archived", "Draft", "Needs Update", "Deprecated"];

const LOD_OPTIONS = ["LOD 100", "LOD 200", "LOD 300", "LOD 350", "LOD 400", "LOD 500"];

export function AddFamilyForm({ onSuccess }: { onSuccess?: () => void }) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryMap, setCategoryMap] = useState<Record<string, string[]>>({});
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [formData, setFormData] = useState<FamilyFormData>({
    familyName: "",
    description: "",
    category: "",
    subcategory: "",
    filePath: "",
    version: "",
    revitVersion: "",
    fileFormat: "",
    manufacturer: "",
    tags: [],
    status: "Active",
    lod: "",
    dateAdded: new Date().toISOString().split("T")[0],
    notes: "",
  });

  // Fetch the full category/subcategory map live from the BIM Categories table on mount.
  useEffect(() => {
    let cancelled = false;
    async function loadCategoryMap() {
      setLoadingCategories(true);
      try {
        const map = await getCategoryMap();
        if (!cancelled) setCategoryMap(map);
      } catch (error) {
        console.error("Error loading categories:", error);
        if (!cancelled) {
          toast({
            title: "Error",
            description: "Failed to load categories",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setLoadingCategories(false);
      }
    }
    loadCategoryMap();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const categories = Object.keys(categoryMap).sort((a, b) => a.localeCompare(b));
  const subcategories = formData.category ? categoryMap[formData.category] ?? [] : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.familyName.trim()) {
      toast({
        title: "Validation Error",
        description: "Family Name is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createFamily(formData);

      if (result.success) {
        toast({
          title: "Success",
          description: "Revit family added successfully",
        });
        // Reset form
        setFormData({
          familyName: "",
          description: "",
          category: "",
          subcategory: "",
          filePath: "",
          version: "",
          revitVersion: "",
          fileFormat: "",
          manufacturer: "",
          tags: [],
          status: "Active",
          lod: "",
          dateAdded: new Date().toISOString().split("T")[0],
          notes: "",
        });
        onSuccess?.();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to add family",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...(prev.tags || []), tag],
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Family Name */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="familyName" className="text-foreground">
            Family Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="familyName"
            value={formData.familyName}
            onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
            placeholder="e.g., Generic Door - Single Flush"
            className="bg-secondary border-border"
          />
        </div>

        {/* Description */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description" className="text-foreground">
            Description
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Detailed description of the family..."
            rows={3}
            className="bg-secondary border-border resize-none"
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category" className="text-foreground">
            Category
          </Label>
          <Select
            value={formData.category}
            onValueChange={(value) =>
              setFormData({ ...formData, category: value, subcategory: "" })
            }
            disabled={loadingCategories}
          >
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue
                placeholder={loadingCategories ? "Loading..." : "Select category"}
              />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Subcategory */}
        <div className="space-y-2">
          <Label htmlFor="subcategory" className="text-foreground">
            Subcategory
          </Label>
          <Select
            value={formData.subcategory}
            onValueChange={(value) => setFormData({ ...formData, subcategory: value })}
            disabled={!formData.category || loadingCategories || subcategories.length === 0}
          >
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue
                placeholder={
                  loadingCategories
                    ? "Loading..."
                    : !formData.category
                    ? "Select category first"
                    : subcategories.length === 0
                    ? "No subcategories"
                    : "Select subcategory"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {subcategories.map((sub) => (
                <SelectItem key={sub} value={sub}>
                  {sub}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* File Path */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="filePath" className="text-foreground">
            File Path
          </Label>
          <Input
            id="filePath"
            value={formData.filePath}
            onChange={(e) => setFormData({ ...formData, filePath: e.target.value })}
            placeholder="e.g., C:\Revit\Families\Doors\Generic Door.rfa"
            className="bg-secondary border-border font-mono text-sm"
          />
        </div>

        {/* Version */}
        <div className="space-y-2">
          <Label htmlFor="version" className="text-foreground">
            Version
          </Label>
          <Input
            id="version"
            value={formData.version}
            onChange={(e) => setFormData({ ...formData, version: e.target.value })}
            placeholder="e.g., 1.0.0"
            className="bg-secondary border-border"
          />
        </div>

        {/* Revit Version */}
        <div className="space-y-2">
          <Label htmlFor="revitVersion" className="text-foreground">
            Revit Version
          </Label>
          <Select
            value={formData.revitVersion}
            onValueChange={(value) => setFormData({ ...formData, revitVersion: value })}
          >
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="Select version" />
            </SelectTrigger>
            <SelectContent>
              {REVIT_VERSIONS.map((ver) => (
                <SelectItem key={ver} value={ver}>
                  {ver}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* File Format */}
        <div className="space-y-2">
          <Label htmlFor="fileFormat" className="text-foreground">
            File Format
          </Label>
          <Select
            value={formData.fileFormat}
            onValueChange={(value) => setFormData({ ...formData, fileFormat: value })}
          >
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              {FILE_FORMATS.map((fmt) => (
                <SelectItem key={fmt} value={fmt}>
                  {fmt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Manufacturer */}
        <div className="space-y-2">
          <Label htmlFor="manufacturer" className="text-foreground">
            Manufacturer
          </Label>
          <Input
            id="manufacturer"
            value={formData.manufacturer}
            onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
            placeholder="e.g., Autodesk"
            className="bg-secondary border-border"
          />
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label htmlFor="status" className="text-foreground">
            Status
          </Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* LOD */}
        <div className="space-y-2">
          <Label htmlFor="lod" className="text-foreground">
            LOD (Level of Development)
          </Label>
          <Select
            value={formData.lod}
            onValueChange={(value) => setFormData({ ...formData, lod: value })}
          >
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="Select LOD" />
            </SelectTrigger>
            <SelectContent>
              {LOD_OPTIONS.map((lod) => (
                <SelectItem key={lod} value={lod}>
                  {lod}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Added */}
        <div className="space-y-2">
          <Label htmlFor="dateAdded" className="text-foreground">
            Date Added
          </Label>
          <Input
            id="dateAdded"
            type="date"
            value={formData.dateAdded}
            onChange={(e) => setFormData({ ...formData, dateAdded: e.target.value })}
            className="bg-secondary border-border"
          />
        </div>

        {/* Tags */}
        <div className="space-y-2 md:col-span-2">
          <Label className="text-foreground">Tags</Label>
          <div className="flex flex-wrap gap-2">
            {TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  formData.tags?.includes(tag)
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {formData.tags?.includes(tag) && <Check className="w-3 h-3 inline mr-1" />}
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes" className="text-foreground">
            Notes
          </Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional notes or comments..."
            rows={3}
            className="bg-secondary border-border resize-none"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-border">
        <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Add Family
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
