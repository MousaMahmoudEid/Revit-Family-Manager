"use client";

import { useState, useEffect, useCallback } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  searchFamilies,
  getCategoryMap,
  updateFamily,
  deleteFamily,
  type RevitFamily,
  type SearchFilters,
  type FamilyFormData,
} from "@/app/actions";
import {
  Search,
  Filter,
  Copy,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  X,
  FolderOpen,
  ArrowUpDown,
} from "lucide-react";

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

const STATUS_COLORS: Record<string, string> = {
  Active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Archived: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  Draft: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Needs Update": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Deprecated: "bg-red-500/20 text-red-400 border-red-500/30",
};

function FamilyCard({
  family,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
}: {
  family: RevitFamily;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyPath = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (family.filePath) {
      await navigator.clipboard.writeText(family.filePath);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={`bg-card border border-border rounded-lg overflow-hidden transition-all duration-200 ${
        isExpanded ? "ring-1 ring-primary/50" : "hover:border-primary/30"
      }`}
    >
      <div
        className="p-4 cursor-pointer"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onToggle()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground truncate">{family.familyName}</h3>
              {family.status && (
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded border ${
                    STATUS_COLORS[family.status] || "bg-secondary text-muted-foreground"
                  }`}
                >
                  {family.status}
                </span>
              )}
            </div>

            {(family.category || family.subcategory) && (
              <p className="text-sm text-primary mb-1">
                {family.category}
                {family.subcategory && ` > ${family.subcategory}`}
              </p>
            )}

            {family.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {family.description}
              </p>
            )}

            {family.filePath && (
              <button
                onClick={handleCopyPath}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors font-mono bg-secondary/50 px-2 py-1 rounded max-w-full"
              >
                <FolderOpen className="w-3 h-3 shrink-0" />
                <span className="truncate">{family.filePath}</span>
                {copied ? (
                  <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                ) : (
                  <Copy className="w-3 h-3 shrink-0" />
                )}
              </button>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-3">
              {family.tags &&
                family.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs bg-secondary text-secondary-foreground rounded"
                  >
                    {tag}
                  </span>
                ))}
              {family.tags && family.tags.length > 3 && (
                <span className="text-xs text-muted-foreground">+{family.tags.length - 3} more</span>
              )}
              {family.revitVersion && (
                <span className="text-xs text-muted-foreground">{family.revitVersion}</span>
              )}
              {family.lod && <span className="text-xs text-muted-foreground">{family.lod}</span>}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-border pt-4 space-y-4 bg-secondary/30">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-1">Version</p>
              <p className="text-foreground">{family.version || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">File Format</p>
              <p className="text-foreground font-mono">{family.fileFormat || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Manufacturer</p>
              <p className="text-foreground">{family.manufacturer || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Date Added</p>
              <p className="text-foreground">
                {family.dateAdded ? new Date(family.dateAdded).toLocaleDateString() : "-"}
              </p>
            </div>
          </div>

          {family.tags && family.tags.length > 0 && (
            <div>
              <p className="text-muted-foreground text-xs mb-2">All Tags</p>
              <div className="flex flex-wrap gap-1">
                {family.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs bg-secondary text-secondary-foreground rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {family.notes && (
            <div>
              <p className="text-muted-foreground text-xs mb-1">Notes</p>
              <p className="text-foreground text-sm whitespace-pre-wrap">{family.notes}</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Pencil className="w-4 h-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function EditDialog({
  family,
  open,
  onClose,
  onSave,
  categoryMap,
  loadingCategories,
}: {
  family: RevitFamily;
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  categoryMap: Record<string, string[]>;
  loadingCategories: boolean;
}) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = Object.keys(categoryMap).sort((a, b) => a.localeCompare(b));

  const [formData, setFormData] = useState<FamilyFormData>({
    familyName: family.familyName,
    description: family.description || "",
    category: family.category || "",
    subcategory: family.subcategory || "",
    filePath: family.filePath || "",
    version: family.version || "",
    revitVersion: family.revitVersion || "",
    fileFormat: family.fileFormat || "",
    manufacturer: family.manufacturer || "",
    tags: family.tags || [],
    status: family.status || "Active",
    lod: family.lod || "",
    notes: family.notes || "",
  });

  useEffect(() => {
    if (open) {
      setFormData({
        familyName: family.familyName,
        description: family.description || "",
        category: family.category || "",
        subcategory: family.subcategory || "",
        filePath: family.filePath || "",
        version: family.version || "",
        revitVersion: family.revitVersion || "",
        fileFormat: family.fileFormat || "",
        manufacturer: family.manufacturer || "",
        tags: family.tags || [],
        status: family.status || "Active",
        lod: family.lod || "",
        notes: family.notes || "",
      });
    }
  }, [open, family]);

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
      const result = await updateFamily(family.id, formData);

      if (result.success) {
        toast({
          title: "Success",
          description: "Family updated successfully",
        });
        onSave();
        onClose();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update family",
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Family</DialogTitle>
          <DialogDescription>Update the Revit family details below.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-familyName">
                Family Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-familyName"
                value={formData.familyName}
                onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="bg-secondary border-border resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value, subcategory: "" })}
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

            <div className="space-y-2">
              <Label>Subcategory</Label>
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

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-filePath">File Path</Label>
              <Input
                id="edit-filePath"
                value={formData.filePath}
                onChange={(e) => setFormData({ ...formData, filePath: e.target.value })}
                className="bg-secondary border-border font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label>Revit Version</Label>
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

            <div className="space-y-2">
              <Label>File Format</Label>
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

            <div className="space-y-2">
              <Label htmlFor="edit-version">Version</Label>
              <Input
                id="edit-version"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-manufacturer">Manufacturer</Label>
              <Input
                id="edit-manufacturer"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
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

            <div className="space-y-2">
              <Label>LOD</Label>
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

            <div className="space-y-2 md:col-span-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      formData.tags?.includes(tag)
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {formData.tags?.includes(tag) && <Check className="w-3 h-3 inline mr-1" />}
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="bg-secondary border-border resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function SearchBrowse() {
  const { toast } = useToast();
  const [families, setFamilies] = useState<RevitFamily[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [categoryMap, setCategoryMap] = useState<Record<string, string[]>>({});
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Edit dialog state
  const [editingFamily, setEditingFamily] = useState<RevitFamily | null>(null);

  // Delete dialog state
  const [deletingFamily, setDeletingFamily] = useState<RevitFamily | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [filters, setFilters] = useState<SearchFilters>({
    search: "",
    category: "",
    subcategory: "",
    revitVersion: "",
    fileFormat: "",
    status: "",
    lod: "",
    tags: [],
    sortBy: "name",
  });

  const loadFamilies = useCallback(async () => {
    setIsLoading(true);
    try {
      const results = await searchFamilies(filters);
      setFamilies(results);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load families",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    loadFamilies();
  }, [loadFamilies]);

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
  const subcategories = filters.category ? categoryMap[filters.category] ?? [] : [];

  const handleDelete = async () => {
    if (!deletingFamily) return;

    setIsDeleting(true);
    try {
      const result = await deleteFamily(deletingFamily.id);

      if (result.success) {
        toast({
          title: "Success",
          description: "Family deleted successfully",
        });
        setDeletingFamily(null);
        loadFamilies();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete family",
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
      setIsDeleting(false);
    }
  };

  const toggleTagFilter = (tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags?.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...(prev.tags || []), tag],
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      category: "",
      subcategory: "",
      revitVersion: "",
      fileFormat: "",
      status: "",
      lod: "",
      tags: [],
      sortBy: "name",
    });
  };

  const hasActiveFilters =
    filters.category ||
    filters.subcategory ||
    filters.revitVersion ||
    filters.fileFormat ||
    filters.status ||
    filters.lod ||
    (filters.tags && filters.tags.length > 0);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search families by name, description, notes, manufacturer, or file path..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="pl-10 bg-secondary border-border"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={hasActiveFilters ? "border-primary text-primary" : ""}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded">
              {[
                filters.category,
                filters.subcategory,
                filters.revitVersion,
                filters.fileFormat,
                filters.status,
                filters.lod,
              ].filter(Boolean).length + (filters.tags?.length || 0)}
            </span>
          )}
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="p-4 bg-card border border-border rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Filters</h3>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Category</Label>
              <Select
                value={filters.category}
                onValueChange={(value) =>
                  setFilters({ ...filters, category: value, subcategory: "" })
                }
                disabled={loadingCategories}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue
                    placeholder={loadingCategories ? "Loading..." : "Any category"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any category</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Subcategory</Label>
              <Select
                value={filters.subcategory}
                onValueChange={(value) => setFilters({ ...filters, subcategory: value })}
                disabled={!filters.category || loadingCategories || subcategories.length === 0}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue
                    placeholder={
                      loadingCategories
                        ? "Loading..."
                        : !filters.category
                        ? "Select category first"
                        : subcategories.length === 0
                        ? "No subcategories"
                        : "Any subcategory"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any subcategory</SelectItem>
                  {subcategories.map((sub) => (
                    <SelectItem key={sub} value={sub}>
                      {sub}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Revit Version</Label>
              <Select
                value={filters.revitVersion}
                onValueChange={(value) => setFilters({ ...filters, revitVersion: value })}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Any version" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any version</SelectItem>
                  {REVIT_VERSIONS.map((ver) => (
                    <SelectItem key={ver} value={ver}>
                      {ver}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">File Format</Label>
              <Select
                value={filters.fileFormat}
                onValueChange={(value) => setFilters({ ...filters, fileFormat: value })}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Any format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any format</SelectItem>
                  {FILE_FORMATS.map((fmt) => (
                    <SelectItem key={fmt} value={fmt}>
                      {fmt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Any status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any status</SelectItem>
                  {STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">LOD</Label>
              <Select
                value={filters.lod}
                onValueChange={(value) => setFilters({ ...filters, lod: value })}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Any LOD" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any LOD</SelectItem>
                  {LOD_OPTIONS.map((lod) => (
                    <SelectItem key={lod} value={lod}>
                      {lod}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Tags</Label>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTagFilter(tag)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    filters.tags?.includes(tag)
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {filters.tags?.includes(tag) && <Check className="w-3 h-3 inline mr-1" />}
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sort and Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Loading..." : `${families.length} families found`}
        </p>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
          <Select
            value={filters.sortBy}
            onValueChange={(value) =>
              setFilters({ ...filters, sortBy: value as SearchFilters["sortBy"] })
            }
          >
            <SelectTrigger className="w-[160px] bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name A-Z</SelectItem>
              <SelectItem value="dateAddedDesc">Newest First</SelectItem>
              <SelectItem value="dateAdded">Oldest First</SelectItem>
              <SelectItem value="category">By Category</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : families.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-lg">
            <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No families found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          families.map((family) => (
            <FamilyCard
              key={family.id}
              family={family}
              isExpanded={expandedId === family.id}
              onToggle={() => setExpandedId(expandedId === family.id ? null : family.id)}
              onEdit={() => setEditingFamily(family)}
              onDelete={() => setDeletingFamily(family)}
            />
          ))
        )}
      </div>

      {/* Edit Dialog */}
      {editingFamily && (
        <EditDialog
          family={editingFamily}
          open={!!editingFamily}
          onClose={() => setEditingFamily(null)}
          onSave={loadFamilies}
          categoryMap={categoryMap}
          loadingCategories={loadingCategories}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingFamily} onOpenChange={() => setDeletingFamily(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Family</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingFamily?.familyName}&quot;? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
