"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Plus, Edit, Trash2, Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

import { useFeatures, useCreateFeature, useUpdateFeature, useDeleteFeature } from "@/hooks/useFeatures";
import { Feature } from "@/types/api.types";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FeatureDialog } from "@/components/admin/feature-dialog";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const MINIO_URL = process.env.NEXT_PUBLIC_MINIO_URL || "http://127.0.0.1:9000";

function getMinioUrl(path?: string) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${MINIO_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export default function FeaturesPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Feature | null>(null);

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setSelected(null);
      setDialogOpen(true);
    }
  }, [searchParams]);

  const { data, isLoading, isFetching, refetch } = useFeatures();
  
  // Güvenli dizi alma (backend'den DTO içinde dönerse)
  const features: Feature[] = Array.isArray(data) ? data : (data as any)?.data || [];

  const createMutation = useCreateFeature();
  const updateMutation = useUpdateFeature();
  const deleteMutation = useDeleteFeature();

  const handleSubmit = (data: any) => {
    if (selected) {
      updateMutation.mutate({ id: selected.id, ...data }, {
        onSuccess: () => {
          toast.success("Özellik güncellendi.");
          setDialogOpen(false);
        },
        onError: () => toast.error("Özellik güncellenirken hata oluştu.")
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          toast.success("Özellik başarıyla eklendi.");
          setDialogOpen(false);
        },
        onError: () => toast.error("Özellik eklenirken hata oluştu.")
      });
    }
  };

  const handleDelete = (id: number) => {
    if(!confirm("Bu özelliği silmek istediğinize emin misiniz?")) return;
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Özellik silindi.");
      },
      onError: () => {
        toast.error("Özellik silinirken hata oluştu.");
      }
    });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const columns: ColumnDef<Feature>[] = [
    {
      accessorKey: "icon",
      header: "İkon",
      cell: ({ row }) => {
        const url = row.original.icon;
        return url ? (
          <div className="w-8 h-8 bg-white border rounded p-1 flex items-center justify-center">
            <img src={getMinioUrl(url)} alt={row.original.name} className="max-w-full max-h-full object-contain" />
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Yok</span>
        );
      },
    },
    { accessorKey: "name", header: "Özellik Adı" },
    {
      id: "actions",
      header: "İşlemler",
      cell: ({ row }) => {
        if (role === "VIEWER") return null;
        const item = row.original;
        return (
          <div className="flex items-center gap-2 justify-end">
            <Button variant="ghost" size="icon" onClick={() => { setSelected(item); setDialogOpen(true); }} title="Düzenle">
              <Edit className="h-4 w-4 text-primary" />
            </Button>
            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(item.id)} title="Sil">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in p-2 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" />
            Özellik Yönetimi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sistem ürün ve modül özelliklerini bu ekrandan tanımlayın ve yönetin.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading || isFetching}
            className="h-10"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Yenile
          </Button>
          {role !== "VIEWER" && (
            <Button onClick={() => { setSelected(null); setDialogOpen(true); }} className="h-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
              <Plus className="mr-2 h-4 w-4" /> Özellik Ekle
            </Button>
          )}
        </div>
      </div>

      {/* Main Card */}
      <Card className="border border-border shadow-sm">
        <CardContent className="p-4 sm:p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Spinner size="lg" className="mb-4" />
              <p>Özellikler yükleniyor...</p>
            </div>
          ) : (
            <DataTable columns={columns} data={features} />
          )}
        </CardContent>
      </Card>

      <FeatureDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={selected}
        isPending={isPending}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
