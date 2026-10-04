import { useEffect, useState } from "react";
import { Check, ShoppingBag } from "lucide-react-native";
import { colors } from "@/constants/theme";
import { useAddToCart } from "@/mutations/cart";
import { toUserMessage } from "@/lib/errors";
import type { Product } from "@/types/product";
import { Button } from "./ui/Button";

interface Props {
  product: Product;
  quantity?: number;
  size?: "sm" | "md" | "lg";
  compact?: boolean;
  onError?: (message: string) => void;
}

/** Adds to the shared Supabase cart (cart_add_item RPC), optimistically. */
export function AddToCartButton({ product, quantity = 1, size = "md", compact = false, onError }: Props) {
  const addToCart = useAddToCart();
  const [added, setAdded] = useState(false);
  const outOfStock = product.stockQuantity <= 0;

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 2000);
    return () => clearTimeout(t);
  }, [added]);

  const label = outOfStock ? "Out of stock" : added ? "Added" : compact ? "Add" : "Add to Cart";
  const iconColor = colors.warmWhite;

  return (
    <Button
      size={size}
      variant={added ? "accent" : "primary"}
      disabled={outOfStock}
      accessibilityLabel={`${label}: ${product.name}`}
      icon={added ? <Check size={16} color={iconColor} /> : <ShoppingBag size={16} color={iconColor} />}
      onPress={() => {
        setAdded(true);
        addToCart.mutate(
          { product, quantity },
          {
            onError: (error) => {
              setAdded(false);
              onError?.(toUserMessage(error));
            },
          },
        );
      }}
    >
      {label}
    </Button>
  );
}
