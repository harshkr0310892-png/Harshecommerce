import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cartStore";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Cart() {
  const { items, updateQuantity, removeItem, getTotal, getDiscountedTotal, clearCart } = useCartStore();
  const total = getTotal();
  const discountedTotal = getDiscountedTotal();
  const savings = total - discountedTotal;

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center cart-empty-container">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 cart-empty-icon">
              <ShoppingBag className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-xl font-bold mb-2 cart-empty-title">Your Cart is Empty</h1>
            <p className="text-muted-foreground mb-4 cart-empty-desc">
              Looks like you haven't added any items to your cart yet.
            </p>
            <Link to="/products" className="cart-empty-btn">
              <Button variant="royal" size="lg" className="w-full">
                <Crown className="w-5 h-5 mr-2" />
                Browse Collection
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 cart-container">
        <h1 className="font-display text-2xl md:text-4xl font-bold mb-4 cart-title">
          Shopping <span className="gradient-gold-text">Cart</span>
        </h1>

        <div className="grid lg:grid-cols-3 gap-4 md:gap-8 cart-grid">
          {/* Order Summary - shown first on mobile */}
          <div className="lg:col-span-1 order-summary">
            <div className="bg-card rounded-xl border border-border/50 p-4 md:p-6 sticky top-24 order-summary-container">
              <h2 className="font-display text-lg md:text-xl font-semibold mb-4 order-summary-title">Order Summary</h2>

              <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
                <div className="flex justify-between text-sm md:text-base order-summary-item">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
                {savings > 0 && (
                  <div className="flex justify-between text-sm md:text-base text-green-600 dark:text-green-400 order-summary-item">
                    <span>Discount</span>
                    <span>-₹{savings.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-border pt-3 md:pt-4">
                  <div className="flex justify-between">
                    <span className="font-display text-base md:text-lg font-semibold order-summary-item">Total</span>
                    <span className="font-display text-lg md:text-xl font-bold text-primary order-summary-total">
                      ₹{discountedTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <Link to="/checkout" className="checkout-btn">
                <Button variant="royal" size="lg" className="w-full mb-2 md:mb-0">
                  Proceed to Checkout
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>

              <Link to="/products" className="continue-shopping-btn">
                <Button variant="royalOutline" size="lg" className="w-full">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>

          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3 md:space-y-4 cart-items">
            {items.map((item, index) => {
              const discountedPrice = item.price * (1 - item.discount_percentage / 100);
              
              return (
                <div 
                  key={item.id}
                  className={cn(
                    "flex flex-col gap-3 md:gap-4 p-3 md:p-4 bg-card rounded-xl border border-border/50 cart-item",
                    "opacity-0 animate-fade-in",
                    `stagger-${(index % 5) + 1}`
                  )}
                >
                  {/* Image */}
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0 cart-item-image">
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Crown className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 cart-item-details">
                    <Link 
                      to={`/product/${item.product_id || item.id}`}
                      className="font-display text-base md:text-lg font-semibold hover:text-primary transition-colors line-clamp-1 cart-item-name"
                    >
                      {item.name}
                    </Link>
                    
                    <div className="flex items-center gap-2 mt-1 cart-item-price">
                      {item.discount_percentage > 0 ? (
                        <>
                          <span className="font-semibold text-primary">
                            ₹{discountedPrice.toFixed(2)}
                          </span>
                          <span className="text-xs md:text-sm text-muted-foreground line-through">
                            ₹{item.price.toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span className="font-semibold text-primary">
                          ₹{item.price.toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mt-2 md:mt-3 cart-item-quantity">
                      <div className="flex items-center border border-border rounded-lg quantity-controls">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1.5 md:p-2 hover:bg-muted transition-colors quantity-btn"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="px-2 md:px-4 py-1.5 md:py-2 font-medium quantity-display">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1.5 md:p-2 hover:bg-muted transition-colors quantity-btn"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors remove-item-btn"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            <Button
              variant="ghost"
              size="sm"
              onClick={clearCart}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Cart
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
