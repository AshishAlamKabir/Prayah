import { useState } from "react";
import { useLocation } from "wouter";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/utils/business";
import { ShoppingCart, CreditCard, MapPin, User } from "lucide-react";

export default function CartCheckout() {
  const [, navigate] = useLocation();
  const { cartItems, clearCart, isLoadingCart } = useCart();
  const { toast } = useToast();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    // Customer info
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    
    // Shipping address
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    
    // Order notes
    notes: ""
  });

  const subtotal = cartItems.reduce((sum, item) => sum + (item.book?.price || 0) * item.quantity, 0);
  const shipping = subtotal > 500 ? 0 : 50; // Free shipping over ₹500
  const total = subtotal + shipping;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cartItems.length === 0) {
      toast({
        title: "Cart Empty",
        description: "Please add items to your cart before checking out.",
        variant: "destructive"
      });
      return;
    }

    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.address) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Generate order number
      const orderNumber = `ORD-${Date.now().toString().slice(-8)}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      
      // Create order data
      const orderData = {
        orderNumber,
        totalAmount: total,
        currency: "inr",
        shippingAddress: {
          name: `${formData.firstName} ${formData.lastName}`,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          postalCode: formData.postalCode,
          phone: formData.phone
        },
        billingAddress: {
          name: `${formData.firstName} ${formData.lastName}`,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          postalCode: formData.postalCode,
          phone: formData.phone
        },
        notes: formData.notes,
        paymentMethod: "cod", // Cash on delivery
        status: "pending",
        paymentStatus: "pending"
      };

      // Create order via API
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        throw new Error(`Order creation failed: ${response.statusText}`);
      }

      const order = await response.json();
      
      // Create order items for each cart item
      const orderItemPromises = cartItems.map(async (item) => {
        const orderItemResponse = await fetch("/api/order-items", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("auth_token")}`
          },
          body: JSON.stringify({
            orderId: order.id,
            bookId: item.bookId,
            quantity: item.quantity,
            price: item.book?.price || 0,
            title: item.book?.title || "Unknown Title",
            author: item.book?.author || "Unknown Author"
          })
        });
        
        if (!orderItemResponse.ok) {
          throw new Error(`Failed to create order item: ${orderItemResponse.statusText}`);
        }
        
        return orderItemResponse.json();
      });

      await Promise.all(orderItemPromises);
      
      // Clear the cart after successful order creation
      await clearCart();
      
      toast({
        title: "Order Placed Successfully!",
        description: `Your order #${orderNumber} for ${formatCurrency(total)} has been placed. You will receive a confirmation email shortly.`
      });
      
      // Navigate to a success page or back to store
      navigate("/books-store");
      
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Order Failed",
        description: error instanceof Error ? error.message : "There was an error processing your order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoadingCart) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some books to your cart before checking out.</p>
          <Button onClick={() => navigate("/books-store")}>
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="Street address, apartment, unit, etc."
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleInputChange("state", e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => handleInputChange("postalCode", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => handleInputChange("country", e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Order Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Any special instructions for your order..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between border-b pb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.book?.title}</h4>
                      <p className="text-sm text-gray-600">{item.book?.author}</p>
                      <p className="text-sm">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency((item.book?.price || 0) * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
                
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? "Free" : formatCurrency(shipping)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 border rounded-lg bg-gray-50">
                  <h4 className="font-medium mb-2">Cash on Delivery (COD)</h4>
                  <p className="text-sm text-gray-600">
                    Pay when your order is delivered to your doorstep.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={handleSubmit}
              className="w-full h-12 text-lg"
              disabled={isProcessing || cartItems.length === 0}
            >
              {isProcessing ? "Processing..." : `Place Order - ${formatCurrency(total)}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}