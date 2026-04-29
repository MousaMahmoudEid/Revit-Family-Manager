"use server";

import { sqlQuery, createRecord, updateRecord, deleteRecord, safeParseJson } from "@/lib/teable";

const BASE_ID = "bseLuyqRqrhi1cLNIqh";
const FAMILIES_TABLE_ID = "tbljxEDp6dXrS6nLbcD";
const CATEGORIES_TABLE_ID = "tblMucgDo7OmbFmMWxj";

// Field IDs for BIM Categories table
const CATEGORY_FIELD_IDS = {
  category: "fldjmJ4Rbll0SfWesBy",
  subcategory: "fld1pRzm1yx7HgrQ4FB",
};

// Field IDs for Revit Families table
const FIELD_IDS = {
  familyName: "fldi4p2WeaDrbKbKyjr",
  description: "fld04vdSNQMX4YUn5Bj",
  filePath: "fldUEdYrPGPZ4b5j45w",
  version: "fldH1s18abDeULvBIX7",
  revitVersion: "fldsNIBatIvd8DJyZVu",
  fileFormat: "fldPBZHtzkaCRhGma4H",
  manufacturer: "flduvoFGxp9bil1F8P2",
  tags: "fldTME7qSOcQ2JY9mm4",
  status: "fldexfMVaYmGtS0LyRU",
  lod: "fldawWxcERpWRicfbyJ",
  dateAdded: "fldi07O1nBtehsyMTd1",
  notes: "fldD1HVf5XEUszoUEbl",
  category: "fldTZ3R1bn0TXJGLbWp",
  subcategory: "fld45MszkWanc10pdU3",
};

export interface RevitFamily {
  id: string;
  familyName: string;
  description: string | null;
  filePath: string | null;
  version: string | null;
  revitVersion: string | null;
  fileFormat: string | null;
  manufacturer: string | null;
  tags: string[] | null;
  status: string | null;
  lod: string | null;
  dateAdded: string | null;
  notes: string | null;
  category: string | null;
  subcategory: string | null;
}

export interface FamilyFormData {
  familyName: string;
  description?: string;
  filePath?: string;
  version?: string;
  revitVersion?: string;
  fileFormat?: string;
  manufacturer?: string;
  tags?: string[];
  status?: string;
  lod?: string;
  dateAdded?: string;
  notes?: string;
  category?: string;
  subcategory?: string;
}

export interface CategoryRow {
  id: string;
  category: string;
  subcategory: string | null;
}

// Fetch every row in the BIM Categories table — used by the Manage Categories tab.
export async function listCategoryRows(): Promise<CategoryRow[]> {
  const { rows } = await sqlQuery(
    BASE_ID,
    `SELECT "__id", "Category", "Subcategory"
     FROM "bseLuyqRqrhi1cLNIqh"."BIM_Categories"
     ORDER BY "Category" ASC NULLS LAST, "Subcategory" ASC NULLS LAST
     LIMIT 5000`
  );

  return rows.map((row) => ({
    id: row.__id as string,
    category: (row.Category as string) ?? "",
    subcategory: (row.Subcategory as string) ?? null,
  }));
}

export async function createCategoryRow(
  category: string,
  subcategory: string
): Promise<{ success: boolean; error?: string }> {
  const trimmedCategory = category.trim();
  const trimmedSubcategory = subcategory.trim();

  if (!trimmedCategory) {
    return { success: false, error: "Category is required" };
  }

  try {
    const fields: Record<string, string> = {
      [CATEGORY_FIELD_IDS.category]: trimmedCategory,
    };
    if (trimmedSubcategory) {
      fields[CATEGORY_FIELD_IDS.subcategory] = trimmedSubcategory;
    }
    await createRecord(CATEGORIES_TABLE_ID, fields);
    return { success: true };
  } catch (error) {
    console.error("Error creating category row:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function updateCategoryRow(
  recordId: string,
  category: string,
  subcategory: string
): Promise<{ success: boolean; error?: string }> {
  const trimmedCategory = category.trim();
  const trimmedSubcategory = subcategory.trim();

  if (!trimmedCategory) {
    return { success: false, error: "Category is required" };
  }

  try {
    await updateRecord(CATEGORIES_TABLE_ID, recordId, {
      [CATEGORY_FIELD_IDS.category]: trimmedCategory,
      [CATEGORY_FIELD_IDS.subcategory]: trimmedSubcategory || null,
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating category row:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function deleteCategoryRow(
  recordId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteRecord(CATEGORIES_TABLE_ID, recordId);
    return { success: true };
  } catch (error) {
    console.error("Error deleting category row:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// Fetch the full category -> subcategories map live from the BIM Categories table.
// One round-trip; consumers derive subcategories from the map.
export async function getCategoryMap(): Promise<Record<string, string[]>> {
  const { rows } = await sqlQuery(
    BASE_ID,
    `SELECT "Category", "Subcategory"
     FROM "bseLuyqRqrhi1cLNIqh"."BIM_Categories"
     WHERE "Category" IS NOT NULL AND "Category" <> ''
     ORDER BY "Category" ASC, "Subcategory" ASC
     LIMIT 5000`
  );

  const map: Record<string, string[]> = {};
  for (const row of rows) {
    const category = typeof row.Category === "string" ? row.Category.trim() : "";
    const subcategory = typeof row.Subcategory === "string" ? row.Subcategory.trim() : "";
    if (!category) continue;
    if (!map[category]) map[category] = [];
    if (subcategory && !map[category].includes(subcategory)) {
      map[category].push(subcategory);
    }
  }
  return map;
}

// Create a new family record
export async function createFamily(data: FamilyFormData): Promise<{ success: boolean; error?: string }> {
  try {
    const fields: Record<string, unknown> = {
      [FIELD_IDS.familyName]: data.familyName,
    };

    if (data.description) fields[FIELD_IDS.description] = data.description;
    if (data.filePath) fields[FIELD_IDS.filePath] = data.filePath;
    if (data.version) fields[FIELD_IDS.version] = data.version;
    if (data.revitVersion) fields[FIELD_IDS.revitVersion] = data.revitVersion;
    if (data.fileFormat) fields[FIELD_IDS.fileFormat] = data.fileFormat;
    if (data.manufacturer) fields[FIELD_IDS.manufacturer] = data.manufacturer;
    if (data.tags && data.tags.length > 0) fields[FIELD_IDS.tags] = data.tags;
    if (data.status) fields[FIELD_IDS.status] = data.status;
    if (data.lod) fields[FIELD_IDS.lod] = data.lod;
    if (data.dateAdded) fields[FIELD_IDS.dateAdded] = data.dateAdded;
    if (data.notes) fields[FIELD_IDS.notes] = data.notes;
    if (data.category) fields[FIELD_IDS.category] = data.category;
    if (data.subcategory) fields[FIELD_IDS.subcategory] = data.subcategory;

    await createRecord(FAMILIES_TABLE_ID, fields);
    return { success: true };
  } catch (error) {
    console.error("Error creating family:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// Update an existing family record
export async function updateFamily(
  recordId: string,
  data: FamilyFormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const fields: Record<string, unknown> = {
      [FIELD_IDS.familyName]: data.familyName,
    };

    fields[FIELD_IDS.description] = data.description || null;
    fields[FIELD_IDS.filePath] = data.filePath || null;
    fields[FIELD_IDS.version] = data.version || null;
    fields[FIELD_IDS.revitVersion] = data.revitVersion || null;
    fields[FIELD_IDS.fileFormat] = data.fileFormat || null;
    fields[FIELD_IDS.manufacturer] = data.manufacturer || null;
    fields[FIELD_IDS.tags] = data.tags && data.tags.length > 0 ? data.tags : null;
    fields[FIELD_IDS.status] = data.status || null;
    fields[FIELD_IDS.lod] = data.lod || null;
    fields[FIELD_IDS.notes] = data.notes || null;
    fields[FIELD_IDS.category] = data.category || null;
    fields[FIELD_IDS.subcategory] = data.subcategory || null;

    await updateRecord(FAMILIES_TABLE_ID, recordId, fields);
    return { success: true };
  } catch (error) {
    console.error("Error updating family:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// Delete a family record
export async function deleteFamily(recordId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await deleteRecord(FAMILIES_TABLE_ID, recordId);
    return { success: true };
  } catch (error) {
    console.error("Error deleting family:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export interface SearchFilters {
  search?: string;
  category?: string;
  subcategory?: string;
  revitVersion?: string;
  fileFormat?: string;
  status?: string;
  lod?: string;
  tags?: string[];
  sortBy?: "name" | "dateAdded" | "dateAddedDesc" | "category";
}

// Search and filter families
export async function searchFamilies(filters: SearchFilters): Promise<RevitFamily[]> {
  const conditions: string[] = [];

  if (filters.search) {
    const searchEscaped = filters.search.replace(/'/g, "''");
    conditions.push(`(
      "Family_Name" ILIKE '%${searchEscaped}%' 
      OR "Description" ILIKE '%${searchEscaped}%' 
      OR "Notes" ILIKE '%${searchEscaped}%' 
      OR "Manufacturer" ILIKE '%${searchEscaped}%' 
      OR "File_Path" ILIKE '%${searchEscaped}%'
    )`);
  }

  if (filters.category) {
    conditions.push(`"Category" = '${filters.category.replace(/'/g, "''")}'`);
  }

  if (filters.subcategory) {
    conditions.push(`"Subcategory" = '${filters.subcategory.replace(/'/g, "''")}'`);
  }

  if (filters.revitVersion) {
    conditions.push(`"Revit_Version" = '${filters.revitVersion.replace(/'/g, "''")}'`);
  }

  if (filters.fileFormat) {
    conditions.push(`"File_Format" = '${filters.fileFormat.replace(/'/g, "''")}'`);
  }

  if (filters.status) {
    conditions.push(`"Status" = '${filters.status.replace(/'/g, "''")}'`);
  }

  if (filters.lod) {
    conditions.push(`"LOD" = '${filters.lod.replace(/'/g, "''")}'`);
  }

  if (filters.tags && filters.tags.length > 0) {
    const tagConditions = filters.tags.map(
      (tag) => `"Tags"::text ILIKE '%${tag.replace(/'/g, "''")}%'`
    );
    conditions.push(`(${tagConditions.join(" OR ")})`);
  }

  let orderBy = '"Family_Name" ASC';
  switch (filters.sortBy) {
    case "dateAdded":
      orderBy = '"Date_Added" ASC NULLS LAST';
      break;
    case "dateAddedDesc":
      orderBy = '"Date_Added" DESC NULLS LAST';
      break;
    case "category":
      orderBy = '"Category" ASC NULLS LAST, "Family_Name" ASC';
      break;
    default:
      orderBy = '"Family_Name" ASC';
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const { rows } = await sqlQuery(
    BASE_ID,
    `SELECT 
      "__id",
      "Family_Name",
      "Description",
      "File_Path",
      "Version",
      "Revit_Version",
      "File_Format",
      "Manufacturer",
      "Tags",
      "Status",
      "LOD",
      "Date_Added",
      "Notes",
      "Category",
      "Subcategory"
    FROM "bseLuyqRqrhi1cLNIqh"."Revit_Families"
    ${whereClause}
    ORDER BY ${orderBy}
    LIMIT 200`
  );

  return rows.map((row) => ({
    id: row.__id as string,
    familyName: row.Family_Name as string,
    description: row.Description as string | null,
    filePath: row.File_Path as string | null,
    version: row.Version as string | null,
    revitVersion: row.Revit_Version as string | null,
    fileFormat: row.File_Format as string | null,
    manufacturer: row.Manufacturer as string | null,
    tags: safeParseJson(row.Tags) as string[] | null,
    status: row.Status as string | null,
    lod: row.LOD as string | null,
    dateAdded: row.Date_Added as string | null,
    notes: row.Notes as string | null,
    category: row.Category as string | null,
    subcategory: row.Subcategory as string | null,
  }));
}
