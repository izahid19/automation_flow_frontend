import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Quote Summary Sidebar
 * Shows subtotal, charges, discounts, tax, and total
 */
export const QuoteSummaryCard = ({
  subtotal,
  discount,
  tax,
  total,
  formData,
  onChange,
  onSaveDraft,
  onSubmit,
  loading,
}) => {
  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle>Quote Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {/* Subtotal */}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>

          {/* Cylinder Charges */}
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="cylinderCharges" className="text-muted-foreground">
              Cylinder Charges
            </Label>
            <Input
              id="cylinderCharges"
              type="number"
              name="cylinderCharges"
              value={formData.cylinderCharges}
              onChange={onChange}
              className="w-24 text-right"
              min="0"
            />
          </div>

          {/* Inventory Charges */}
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="inventoryCharges" className="text-muted-foreground">
              Inventory Charges
            </Label>
            <Input
              id="inventoryCharges"
              type="number"
              name="inventoryCharges"
              value={formData.inventoryCharges}
              onChange={onChange}
              className="w-24 text-right"
              min="0"
            />
          </div>

          {/* Discount Percent */}
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="discountPercent" className="text-muted-foreground">
              Discount (%)
            </Label>
            <Input
              id="discountPercent"
              type="number"
              name="discountPercent"
              value={formData.discountPercent}
              onChange={onChange}
              className="w-20 text-right"
              min="0"
              max="100"
            />
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-green-500">
              <span>Discount</span>
              <span>-₹{discount.toFixed(2)}</span>
            </div>
          )}

          {/* Tax Percent */}
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="taxPercent" className="text-muted-foreground">
              Tax (%)
            </Label>
            <Input
              id="taxPercent"
              type="number"
              name="taxPercent"
              value={formData.taxPercent}
              onChange={onChange}
              className="w-20 text-right"
              min="0"
              max="100"
            />
          </div>
          {tax > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
          )}

          <Separator />

          {/* Total */}
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-primary">₹{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={onSaveDraft}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save as Draft'}
          </Button>
          <Button className="w-full" onClick={onSubmit} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit for Approval'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
