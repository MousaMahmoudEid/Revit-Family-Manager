"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  createCategoryRow,
  deleteCategoryRow,
  listCategoryRows,
  updateCategoryRow,
  type CategoryRow,
} from "@/app/actions";
import {
  ChevronDown,
  ChevronRight,
  Layers,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

interface ManageCategoriesProps {
  onCategoriesChanged?: () => void;
}

export function ManageCategories({ onCategoriesChanged }: ManageCategoriesProps) {
  const { toast } = useToast();
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const [newCategory, setNewCategory] = useState("");
  const [newSubcategory, setNewSubcategory] = useState("");

  const [editingRow, setEditingRow] = useState<CategoryRow | null>(null);
  const [deletingRow, setDeletingRow] = useState<CategoryRow | null>(null);

  const loadRows = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await listCategoryRows();
      setRows(data);
    } catch (error) {
      console.error("Failed to load categories:", error);
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const grouped = useMemo(() => {
    const groups: Record<string, CategoryRow[]> = {};
    for (const row of rows) {
      const key = row.category || "(Uncategorised)";
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [rows]);

  const existingCategories = useMemo(() => {
    return Array.from(
      new Set(rows.map((r) => r.category).filter((c): c is string => Boolean(c)))
    ).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const notifyChange = () => {
    loadRows();
    onCategoriesChanged?.();
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) {
      toast({
        title: "Validation Error",
        description: "Category is required",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);
    const result = await createCategoryRow(newCategory, newSubcategory);
    setIsAdding(false);

    if (result.success) {
      toast({ title: "Added", description: "Category row added" });
      setNewCategory("");
      setNewSubcategory("");
      notifyChange();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to add category",
        variant: "destructive",
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingRow) return;
    const result = await deleteCategoryRow(deletingRow.id);
    if (result.success) {
      toast({ title: "Deleted", description: "Category row removed" });
      setDeletingRow(null);
      notifyChange();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete",
        variant: "destructive",
      });
    }
  };

  const toggleCollapsed = (key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      {/* Add form */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Add Category / Subcategory
          </h2>
          <p className="text-sm text-muted-foreground">
            Add a new row to the BIM Categories table. Reuse an existing category name to add a
            subcategory under it.
          </p>
        </div>

        <form onSubmit={handleAdd} className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <div className="space-y-2">
            <Label htmlFor="new-category" className="text-foreground">
              Category <span className="text-destructive">*</span>
            </Label>
            <Input
              id="new-category"
              list="category-suggestions"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="e.g., Doors"
              className="bg-secondary border-border"
            />
            <datalist id="category-suggestions">
              {existingCategories.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-subcategory" className="text-foreground">
              Subcategory
            </Label>
            <Input
              id="new-subcategory"
              value={newSubcategory}
              onChange={(e) => setNewSubcategory(e.target.value)}
              placeholder="e.g., Sliding"
              className="bg-secondary border-border"
            />
          </div>

          <Button type="submit" disabled={isAdding} className="md:w-auto">
            {isAdding ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add
              </>
            )}
          </Button>
        </form>
      </div>

      {/* List */}
      <div className="bg-card border border-border rounded-lg">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Existing Categories</h3>
            <p className="text-xs text-muted-foreground">
              {isLoading ? "Loading..." : `${rows.length} rows · ${grouped.length} categories`}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : grouped.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Layers className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              No categories yet. Add the first one above.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {grouped.map(([category, items]) => {
              const isCollapsed = collapsed[category];
              return (
                <div key={category}>
                  <button
                    type="button"
                    onClick={() => toggleCollapsed(category)}
                    className="w-full flex items-center gap-2 px-6 py-3 hover:bg-secondary/40 transition-colors text-left"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="font-medium text-foreground">{category}</span>
                    <span className="text-xs text-muted-foreground">
                      {items.length} {items.length === 1 ? "row" : "rows"}
                    </span>
                  </button>

                  {!isCollapsed && (
                    <ul className="pb-2">
                      {items.map((row) => (
                        <li
                          key={row.id}
                          className="flex items-center justify-between gap-3 px-6 py-2 ml-6 hover:bg-secondary/30"
                        >
                          <span
                            className={`text-sm ${
                              row.subcategory ? "text-foreground" : "text-muted-foreground italic"
                            }`}
                          >
                            {row.subcategory || "— no subcategory —"}
                          </span>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingRow(row)}
                              aria-label="Edit row"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingRow(row)}
                              aria-label="Delete row"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editingRow && (
        <EditCategoryDialog
          row={editingRow}
          existingCategories={existingCategories}
          open={!!editingRow}
          onClose={() => setEditingRow(null)}
          onSaved={() => {
            setEditingRow(null);
            notifyChange();
          }}
        />
      )}

      <AlertDialog open={!!deletingRow} onOpenChange={(open) => !open && setDeletingRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Row</AlertDialogTitle>
            <AlertDialogDescription>
              Remove{" "}
              <span className="text-foreground font-medium">
                {deletingRow?.category}
                {deletingRow?.subcategory ? ` › ${deletingRow.subcategory}` : ""}
              </span>{" "}
              from the BIM Categories table? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EditCategoryDialog({
  row,
  existingCategories,
  open,
  onClose,
  onSaved,
}: {
  row: CategoryRow;
  existingCategories: string[];
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [category, setCategory] = useState(row.category);
  const [subcategory, setSubcategory] = useState(row.subcategory || "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setCategory(row.category);
      setSubcategory(row.subcategory || "");
    }
  }, [open, row]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category.trim()) {
      toast({
        title: "Validation Error",
        description: "Category is required",
        variant: "destructive",
      });
      return;
    }
    setIsSaving(true);
    const result = await updateCategoryRow(row.id, category, subcategory);
    setIsSaving(false);
    if (result.success) {
      toast({ title: "Saved", description: "Category row updated" });
      onSaved();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to save",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Row</DialogTitle>
          <DialogDescription>
            Update this row in the BIM Categories table. Changes are reflected in the dropdowns
            on the next page load.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-cat">
              Category <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-cat"
              list="edit-category-suggestions"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-secondary border-border"
            />
            <datalist id="edit-category-suggestions">
              {existingCategories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-sub">Subcategory</Label>
            <Input
              id="edit-sub"
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
