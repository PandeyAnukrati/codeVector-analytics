import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: number;
  name: string;
  category: string;
  price: string;
  created_at: string;
}

const CATEGORY_COLORS: Record<string, { badge: string; dot: string }> = {
  "Electronics": {
    badge: "bg-blue-50/70 text-blue-700 border-blue-200/60 hover:bg-blue-50/90",
    dot: "bg-blue-500"
  },
  "Clothing": {
    badge: "bg-purple-50/70 text-purple-700 border-purple-200/60 hover:bg-purple-50/90",
    dot: "bg-purple-500"
  },
  "Home & Kitchen": {
    badge: "bg-amber-50/70 text-amber-700 border-amber-200/60 hover:bg-amber-50/90",
    dot: "bg-amber-500"
  },
  "Books": {
    badge: "bg-emerald-50/70 text-emerald-700 border-emerald-200/60 hover:bg-emerald-50/90",
    dot: "bg-emerald-500"
  },
  "Sports": {
    badge: "bg-rose-50/70 text-rose-700 border-rose-200/60 hover:bg-rose-50/90",
    dot: "bg-rose-500"
  },
  "Beauty": {
    badge: "bg-pink-50/70 text-pink-700 border-pink-200/60 hover:bg-pink-50/90",
    dot: "bg-pink-500"
  }
};

const getCategoryStyles = (cat: string) => {
  return CATEGORY_COLORS[cat] || {
    badge: "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100",
    dot: "bg-slate-400"
  };
};

const API_BASE = 'http://localhost:3000/api/products';

// Standalone fetch function — no closures, all values passed in
async function fetchPage(
  pageNumber: number,
  cat: string,
  lim: number,
  cursors: (string | null)[]
): Promise<{ data: Product[]; nextCursor: string | null } | null> {
  let url = `${API_BASE}?limit=${lim}`;
  if (cat !== "all") url += `&category=${cat}`;
  const cursor = cursors[pageNumber - 1];
  if (cursor) url += `&cursor=${cursor}`;

  const res = await fetch(url);
  const result = await res.json();
  if (result.success) {
    return { data: result.data, nextCursor: result.meta.next_cursor };
  }
  return null;
}

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageCursors, setPageCursors] = useState<(string | null)[]>([null]);
  const [limit, setLimit] = useState<number>(12);

  // Navigate to a specific page — called directly from button clicks
  const goToPage = async (pageNumber: number) => {
    setLoading(true);
    try {
      const result = await fetchPage(pageNumber, category, limit, pageCursors);
      if (result) {
        setProducts(result.data);
        setPageCursors((prev) => {
          const next = [...prev];
          next[pageNumber] = result.nextCursor;
          return next;
        });
        setCurrentPage(pageNumber);
      }
    } catch (err) {
      console.error("Failed to pull data from backend link:", err);
    } finally {
      setLoading(false);
    }
  };

  // Reset to page 1 whenever category or limit changes
  useEffect(() => {
    let cancelled = false;
    const reset = async () => {
      setLoading(true);
      try {
        const result = await fetchPage(1, category, limit, [null]);
        if (!cancelled && result) {
          setProducts(result.data);
          setPageCursors([null, result.nextCursor]);
          setCurrentPage(1);
        }
      } catch (err) {
        console.error("Failed to pull data from backend link:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    reset();
    return () => { cancelled = true; };
  }, [category, limit]);

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-12 font-sans antialiased text-slate-900">
      <div className="max-w-6xl mx-auto space-y-4">

        {/* Sleek Header */}
        <div className="flex justify-between items-end pb-1">
          <h1 className="text-xl font-bold tracking-tight text-slate-800">CodeVector Analytics</h1>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            B-Tree Composite Indexes: <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">category, created_at, id</span>
          </span>
        </div>

        {/* Filters Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex gap-3 items-center w-full sm:w-auto">
            <div className="w-full sm:w-48">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full bg-white border-slate-200 shadow-none text-xs h-9">
                  <SelectValue placeholder="Select Category"></SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />
                      <span>All Categories</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="Electronics">
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                      <span>Electronics</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="Clothing">
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block" />
                      <span>Clothing</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="Home & Kitchen">
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                      <span>Home & Kitchen</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="Books">
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      <span>Books</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="Sports">
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
                      <span>Sports</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="Beauty">
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-500 inline-block" />
                      <span>Beauty</span>
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={() => setCategory("all")}
              disabled={category === "all"}
              className="text-xs h-9 px-3"
            >
              Clear
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            B-Tree index query browsing over <span className="font-semibold text-slate-700">200,000</span> live entities.
          </div>
        </div>

        {/* Data Table View */}
        <div className="rounded-lg border border-slate-200 overflow-hidden bg-white shadow-sm">
          <Table>
            <TableHeader className="bg-slate-800">
              <TableRow className="hover:bg-slate-800 border-b-0">
                <TableHead className="w-[80px] text-slate-200 font-semibold">ID</TableHead>
                <TableHead className="text-slate-200 font-semibold">Item Descriptor</TableHead>
                <TableHead className="text-slate-200 font-semibold">Category Class</TableHead>
                <TableHead className="text-right text-slate-200 font-semibold">Price</TableHead>
                <TableHead className="text-right text-slate-200 font-semibold">Ingested Stamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-mono text-muted-foreground">{product.id}</TableCell>
                  <TableCell className="font-semibold text-slate-800">{product.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`rounded-md font-medium text-xs px-2 py-0.5 border ${getCategoryStyles(product.category).badge}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 inline-block ${getCategoryStyles(product.category).dot}`} />
                      {product.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-emerald-600">
                    ${parseFloat(product.price).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground font-mono">
                    {new Date(product.created_at).toLocaleTimeString()}
                  </TableCell>
                </TableRow>
              ))}

              {products.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                    No records found matching criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination Controls Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 bg-slate-50/50 py-3.5 px-6">
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
              {products.length > 0 ? (
                <span className="text-xs text-muted-foreground">
                  Showing <span className="font-semibold text-slate-800">{(currentPage - 1) * limit + 1}</span> to{" "}
                  <span className="font-semibold text-slate-800">{(currentPage - 1) * limit + products.length}</span>
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">No records to display</span>
              )}
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground whitespace-nowrap">Per page:</span>
                <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
                  <SelectTrigger className="w-[70px] h-8 bg-white border-slate-200 shadow-none text-xs">
                    <SelectValue placeholder="12" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">12</SelectItem>
                    <SelectItem value="24">24</SelectItem>
                    <SelectItem value="48">48</SelectItem>
                    <SelectItem value="96">96</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
              <span className="text-xs font-medium text-slate-700">
                Page <span className="text-slate-900 font-semibold">{currentPage}</span>
              </span>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className="bg-white border-slate-200 text-xs h-8 px-3 shadow-none hover:bg-slate-50"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={!pageCursors[currentPage] || loading}
                  className="bg-white border-slate-200 text-xs h-8 px-3 shadow-none hover:bg-slate-50"
                >
                  {loading ? "Loading..." : "Next"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}