"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateCanteenProduct,
  useUpdateCanteenProduct,
} from "@/hooks/useCanteenProducts";
import { CanteenProductGetAllDto } from "@/types/canteenProduct.types";
import { toast } from "sonner";
import { ShoppingBag, Sparkles } from "lucide-react";

interface CanteenProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: CanteenProductGetAllDto | null;
}

const DEFAULT_EMOJIS = ["💧", "🧃", "🥤", "🥛", "☕", "🍫", "🍪", "🥪", "🥋", "🧦", "🥊", "✨", "🛒"];
const CATEGORIES = [
  "Su & İçecek",
  "Meşrubat",
  "Kantin & Atıştırmalık",
  "Ekipman & Malzeme",
  "Giyim & Aksesuar",
  "Diğer",
];

export function CanteenProductDialog({
  open,
  onOpenChange,
  product,
}: CanteenProductDialogProps) {
  const isEditing = !!product;

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Su & İçecek");
  const [icon, setIcon] = useState("💧");
  const [barcode, setBarcode] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [description, setDescription] = useState("");

  const createMutation = useCreateCanteenProduct();
  const updateMutation = useUpdateCanteenProduct();

  useEffect(() => {
    if (open) {
      if (product) {
        setName(product.name || "");
        setPrice(String(product.price || ""));
        setCategory(product.category || "Su & İçecek");
        setIcon(product.icon || "💧");
        setBarcode(product.barcode || "");
        setStockQuantity(product.stockQuantity !== undefined && product.stockQuantity !== null ? String(product.stockQuantity) : "");
        setDescription(product.description || "");
      } else {
        setName("");
        setPrice("");
        setCategory("Su & İçecek");
        setIcon("💧");
        setBarcode("");
        setStockQuantity("");
        setDescription("");
      }
    }
  }, [open, product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Lütfen ürün adını giriniz.");
      return;
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      toast.error("Lütfen geçerli bir ürün fiyatı giriniz.");
      return;
    }

    const numStock = stockQuantity.trim() ? Number(stockQuantity) : undefined;

    try {
      if (isEditing && product) {
        await updateMutation.mutateAsync({
          id: product.id,
          name: name.trim(),
          price: numPrice,
          category,
          icon,
          barcode: barcode.trim() || undefined,
          stockQuantity: numStock,
          description: description.trim() || undefined,
        });
        toast.success("Ürün başarıyla güncellendi.");
      } else {
        await createMutation.mutateAsync({
          name: name.trim(),
          price: numPrice,
          category,
          icon,
          barcode: barcode.trim() || undefined,
          stockQuantity: numStock,
          description: description.trim() || undefined,
        });
        toast.success("Yeni ürün başarıyla eklendi.");
      }

      onOpenChange(false);
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.Message ||
        err?.response?.data?.message ||
        err?.message ||
        "İşlem sırasında bir hata oluştu.";
      toast.error(errorMsg);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-indigo-600">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                {isEditing ? "Ürün Düzenle" : "Yeni Kantin / Dolap Ürünü"}
              </DialogTitle>
              <DialogDescription>
                Dolap ve kantinde satılan ürünleri ve sabit fiyatlarını tanımlayın.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* İkon Seçici & Ürün Adı */}
          <div className="grid grid-cols-4 gap-2">
            <div className="col-span-1 space-y-1.5">
              <Label className="font-semibold text-xs">Simge</Label>
              <Select value={icon} onValueChange={(val) => setIcon(val ?? "🛒")}>
                <SelectTrigger className="h-10 text-xl text-center">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  alignItemWithTrigger={false}
                  side="bottom"
                  className="p-1.5 max-h-56 overflow-y-auto"
                >
                  {DEFAULT_EMOJIS.map((emoji) => (
                    <SelectItem key={emoji} value={emoji} className="text-xl justify-center py-1.5">
                      {emoji}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-3 space-y-1.5">
              <Label htmlFor="productName" className="font-semibold text-xs">
                Ürün Adı <span className="text-red-500">*</span>
              </Label>
              <Input
                id="productName"
                placeholder="Örn: Soğuk Su (0.5L)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Fiyat & Kategori */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="price" className="font-semibold text-xs">
                Satış Fiyatı (₺) <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground font-semibold">₺</span>
                <Input
                  id="price"
                  type="number"
                  step="0.5"
                  min="0.5"
                  placeholder="10.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="pl-8 text-base font-semibold"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="category" className="font-semibold text-xs">
                Kategori <span className="text-red-500">*</span>
              </Label>
              <Select value={category} onValueChange={(val) => setCategory(val ?? "Su & İçecek")}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Barkod & Stok Miktarı */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="barcode" className="font-semibold text-xs">
                Barkod / Ürün Kodu
              </Label>
              <Input
                id="barcode"
                placeholder="Örn: 8690123456"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="stock" className="font-semibold text-xs">
                Stok Adedi (İsteğe Bağlı)
              </Label>
              <Input
                id="stock"
                type="number"
                min="0"
                placeholder="Örn: 50"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
              />
            </div>
          </div>

          {/* Açıklama */}
          <div className="space-y-1.5">
            <Label htmlFor="desc" className="font-semibold text-xs">
              Açıklama / Not
            </Label>
            <Input
              id="desc"
              placeholder="Örn: Soğutucu dolapta yer alan pet şişe su"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              İptal
            </Button>
            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={isPending}
            >
              {isPending ? "Kaydediliyor..." : isEditing ? "Güncelle" : "Ürünü Ekle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
