"use client";

import * as React from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToast } from "@/components/toast-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteResource, getCollection } from "@/lib/api/resources";

export type Column = {
  header: string;
  cell: (row: Record<string, unknown>) => React.ReactNode;
  exportValue?: (row: Record<string, unknown>) => string;
  className?: string;
};

export type DataPageShellRef = {
  refresh: () => Promise<void>;
};

type DataPageShellProps = {
  title: string;
  description: string;
  listPath: string;
  deletePathBase?: string;
  detailPathBase?: string;
  searchPlaceholder?: string;
  columns: Column[];
  pageSize?: number;
  exportFilename?: string;
  onEditClick?: (row: Record<string, unknown>) => void;
  canEdit?: boolean;
};

export const DataPageShell = React.forwardRef<
  DataPageShellRef,
  DataPageShellProps
>(function DataPageShell(
  {
    title,
    description,
    listPath,
    deletePathBase,
    detailPathBase,
    searchPlaceholder,
    columns,
    pageSize = 20,
    exportFilename,
    onEditClick,
    canEdit = false,
  },
  ref,
) {
  const { toast } = useToast();
  const [query, setQuery] = React.useState("");
  const [items, setItems] = React.useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [toDelete, setToDelete] = React.useState<string | null>(null);
  const [cursor, setCursor] = React.useState<string | null>(null);
  const [currentPageCursor, setCurrentPageCursor] = React.useState<
    string | null
  >(null);
  const [history, setHistory] = React.useState<Array<string | null>>([]);
  const [hasMore, setHasMore] = React.useState(false);
  const [total, setTotal] = React.useState<number | null>(null);
  const [isExporting, setIsExporting] = React.useState(false);
  const [limit, setLimit] = React.useState(pageSize);
  const [sortBy, setSortBy] = React.useState(columns[0]?.header ?? "");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");

  const load = React.useCallback(
    async (nextCursor?: string | null) => {
      try {
        setLoading(true);
        const result = await getCollection<Record<string, unknown>>(listPath, {
          cursor: nextCursor ?? undefined,
          search: query || undefined,
          limit,
        });
        setItems(result.items);
        setHasMore(result.meta.hasMore);
        setCursor(result.meta.cursor);
        setTotal(result.meta.total);
        setCurrentPageCursor(nextCursor ?? null);
      } catch (error) {
        toast({
          title: `Failed to load ${title.toLowerCase()}`,
          description:
            error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [listPath, query, title, toast, limit],
  );

  React.useEffect(() => {
    setHistory([]);
    setCurrentPageCursor(null);
    load(null);
  }, [load]);

  React.useImperativeHandle(ref, () => ({ refresh: load }), [load]);

  async function onDelete() {
    if (!toDelete || !deletePathBase) return;
    try {
      await deleteResource(`${deletePathBase}/${toDelete}`);
      toast({ title: "Deleted", description: "Record removed successfully." });
      setToDelete(null);
      await load();
    } catch (error) {
      toast({
        title: "Delete failed",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  }

  async function onNextPage() {
    if (!hasMore || !cursor) return;
    setHistory((prev) => [...prev, currentPageCursor]);
    await load(cursor);
  }

  async function onPreviousPage() {
    const previous = history[history.length - 1] ?? null;
    setHistory((prev) => prev.slice(0, -1));
    await load(previous);
  }

  const pageNumber = history.length + 1;
  const totalPages =
    total != null ? Math.max(1, Math.ceil(total / limit)) : null;

  const sortedItems = React.useMemo(() => {
    if (!sortBy) return items;
    const sortColumn = columns.find((col) => col.header === sortBy);
    if (!sortColumn) return items;

    const source = [...items];
    source.sort((a, b) => {
      const aRaw = sortColumn.exportValue
        ? sortColumn.exportValue(a)
        : nodeToText(sortColumn.cell(a));
      const bRaw = sortColumn.exportValue
        ? sortColumn.exportValue(b)
        : nodeToText(sortColumn.cell(b));
      const comparison = compareSortValues(aRaw, bRaw);
      return sortDir === "asc" ? comparison : -comparison;
    });
    return source;
  }, [items, columns, sortBy, sortDir]);

  async function onExportCsv() {
    try {
      setIsExporting(true);
      const headers = columns.map((col) => col.header);
      const rows = sortedItems.map((item) =>
        columns.map((col) => {
          if (col.exportValue) return col.exportValue(item);
          return nodeToText(col.cell(item));
        }),
      );
      const metaRows = [
        ["Page", `${pageNumber}${totalPages ? ` of ${totalPages}` : ""}`],
        ["Rows on page", String(sortedItems.length)],
        ["Total rows", total != null ? String(total) : "Unknown"],
        ["Sort", sortBy ? `${sortBy} (${sortDir})` : "None"],
        [],
      ];
      const csv = [...metaRows, headers, ...rows]
        .map((row) =>
          row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","),
        )
        .join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const stamp = new Date().toISOString().slice(0, 10);
      link.download =
        exportFilename ??
        `${title.toLowerCase().replace(/\s+/g, "-")}-${stamp}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast({
        title: "Export ready",
        description: "CSV downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  }

  async function onExportPdf() {
    try {
      setIsExporting(true);
      const [{ jsPDF }, autoTableModule] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const autoTable = autoTableModule.default;

      const headers = columns.map((col) => col.header);
      const rows = sortedItems.map((item) =>
        columns.map((col) => {
          if (col.exportValue) return col.exportValue(item);
          return nodeToText(col.cell(item));
        }),
      );
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4",
      });
      const stamp = new Date().toISOString().slice(0, 10);
      doc.setFontSize(16);
      doc.text(`${title} Export`, 40, 40);
      doc.setFontSize(10);
      doc.text(description, 40, 58);
      doc.text(
        `Page: ${pageNumber}${totalPages ? ` of ${totalPages}` : ""}`,
        40,
        74,
      );
      doc.text(
        `Records: ${sortedItems.length}${total != null ? ` of ${total}` : ""}`,
        220,
        74,
      );
      doc.text(`Sort: ${sortBy ? `${sortBy} (${sortDir})` : "None"}`, 430, 74);

      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 86,
        styles: { fontSize: 8, cellPadding: 4 },
        headStyles: { fillColor: [25, 25, 25] },
      });

      const fileName =
        exportFilename ??
        `${title.toLowerCase().replace(/\s+/g, "-")}-${stamp}.pdf`;
      doc.save(fileName);
      toast({
        title: "Export ready",
        description: "PDF downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  }

  const hasActions = Boolean(
    detailPathBase || deletePathBase || (canEdit && onEditClick),
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            <div className="grid w-full min-w-0 gap-2 xl:w-auto xl:grid-cols-none xl:gap-0">
              <div className="relative w-full sm:w-auto xl:hidden">
                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={
                    searchPlaceholder ?? `Search ${title.toLowerCase()}...`
                  }
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-8 sm:w-[260px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 md:flex md:items-center xl:hidden">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => load(null)}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  <RefreshCw className={loading ? "animate-spin" : ""} />
                </Button>
                <Button
                  variant="outline"
                  onClick={onExportCsv}
                  disabled={loading || isExporting || sortedItems.length === 0}
                  className="w-full sm:w-auto"
                >
                  <Download />
                  {isExporting ? "Exporting..." : "Export CSV"}
                </Button>
                <Button
                  variant="outline"
                  onClick={onExportPdf}
                  disabled={loading || isExporting || sortedItems.length === 0}
                  className="w-full sm:w-auto"
                >
                  <Download />
                  {isExporting ? "Exporting..." : "Export PDF"}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 md:flex md:items-center xl:hidden">
                <select
                  aria-label="Sort by"
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                >
                  {columns.map((col) => (
                    <option key={col.header} value={col.header}>
                      Sort: {col.header}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Sort direction"
                  value={sortDir}
                  onChange={(event) =>
                    setSortDir(event.target.value as "asc" | "desc")
                  }
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                >
                  <option value="asc">Asc</option>
                  <option value="desc">Desc</option>
                </select>
                <select
                  aria-label="Rows per page"
                  value={String(limit)}
                  onChange={(event) => setLimit(Number(event.target.value))}
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                >
                  <option value="10">10 / page</option>
                  <option value="20">20 / page</option>
                  <option value="50">50 / page</option>
                </select>
              </div>
              <div className="hidden xl:flex xl:items-center xl:gap-2 xl:whitespace-nowrap">
                <div className="relative w-[220px]">
                  <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={
                      searchPlaceholder ?? `Search ${title.toLowerCase()}...`
                    }
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full pl-8"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => load(null)}
                  disabled={loading}
                >
                  <RefreshCw className={loading ? "animate-spin" : ""} />
                </Button>
                <Button
                  variant="outline"
                  onClick={onExportCsv}
                  disabled={loading || isExporting || sortedItems.length === 0}
                >
                  <Download />
                  {isExporting ? "Exporting..." : "Export CSV"}
                </Button>
                <Button
                  variant="outline"
                  onClick={onExportPdf}
                  disabled={loading || isExporting || sortedItems.length === 0}
                >
                  <Download />
                  {isExporting ? "Exporting..." : "Export PDF"}
                </Button>
                <select
                  aria-label="Sort by"
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                >
                  {columns.map((col) => (
                    <option key={col.header} value={col.header}>
                      Sort: {col.header}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Sort direction"
                  value={sortDir}
                  onChange={(event) =>
                    setSortDir(event.target.value as "asc" | "desc")
                  }
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                >
                  <option value="asc">Asc</option>
                  <option value="desc">Desc</option>
                </select>
                <select
                  aria-label="Rows per page"
                  value={String(limit)}
                  onChange={(event) => setLimit(Number(event.target.value))}
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                >
                  <option value="10">10 / page</option>
                  <option value="20">20 / page</option>
                  <option value="50">50 / page</option>
                </select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No {title.toLowerCase()} found.
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                {query
                  ? "Try a different search term."
                  : "Create one to get started."}
              </p>
            </div>
          ) : (
            <div className="min-w-0 space-y-3">
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((col) => (
                        <TableHead key={col.header} className={col.className}>
                          {col.header}
                        </TableHead>
                      ))}
                      {hasActions && (
                        <TableHead className="w-[80px] text-right">
                          Actions
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedItems.map((item, index) => {
                      const key = String(item.id ?? index);
                      return (
                        <TableRow key={key}>
                          {columns.map((col) => (
                            <TableCell
                              key={col.header}
                              className={col.className}
                            >
                              {col.cell(item)}
                            </TableCell>
                          ))}
                          {hasActions && (
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                {detailPathBase && item.id != null && (
                                  <Button
                                    asChild
                                    variant="ghost"
                                    size="icon-xs"
                                  >
                                    <Link
                                      href={`${detailPathBase}/${String(item.id)}`}
                                    >
                                      <Eye />
                                    </Link>
                                  </Button>
                                )}
                                {canEdit && onEditClick && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onEditClick(item)}
                                  >
                                    Edit
                                  </Button>
                                )}
                                {deletePathBase && item.id != null && (
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => setToDelete(String(item.id))}
                                  >
                                    <Trash2 />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                <p>
                  Showing {sortedItems.length} record
                  {sortedItems.length === 1 ? "" : "s"}
                  {total != null ? ` of ${total}` : ""} • Page {pageNumber}
                  {totalPages ? ` of ${totalPages}` : ""}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onPreviousPage}
                    disabled={loading || history.length === 0}
                  >
                    <ChevronLeft />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onNextPage}
                    disabled={loading || !hasMore || !cursor}
                  >
                    Next
                    <ChevronRight />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={`Delete ${title.slice(0, -1)}`}
        description="This action cannot be undone. Are you sure?"
        confirmLabel="Delete"
        onCancel={() => setToDelete(null)}
        onConfirm={onDelete}
      />
    </>
  );
});

function nodeToText(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node))
    return node.map(nodeToText).join(" ").replace(/\s+/g, " ").trim();
  if (React.isValidElement(node)) {
    const element = node as React.ReactElement<{ children?: React.ReactNode }>;
    return nodeToText(element.props?.children);
  }
  return "";
}

function compareSortValues(a: string, b: string): number {
  const aNum = parseNumeric(a);
  const bNum = parseNumeric(b);
  if (aNum != null && bNum != null) return aNum - bNum;

  const aTime = parseDate(a);
  const bTime = parseDate(b);
  if (aTime != null && bTime != null) return aTime - bTime;

  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function parseNumeric(input: string): number | null {
  const cleaned = input.replaceAll(",", "").replace(/[^\d.-]/g, "");
  if (!cleaned || cleaned === "-" || cleaned === "." || cleaned === "-.")
    return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDate(input: string): number | null {
  const parsed = Date.parse(input);
  return Number.isFinite(parsed) ? parsed : null;
}
