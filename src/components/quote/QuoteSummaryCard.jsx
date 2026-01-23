import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Save, Send, Loader2 } from 'lucide-react';

/**
 * Quote Summary Sidebar
 * Shows subtotal, charges, tax, and total with action buttons
 */
export const QuoteSummaryCard = ({
  subtotal = 0,
  taxPercent = 0,
  taxOnSubtotal = 0,
  cylinderCharges = 0,
  numberOfCylinders = 0,
  inventoryCharges = 0,
  taxOnCharges = 0,
  totalTax = 0,
  total = 0,
  advancePayment = 0,
  onTaxPercentChange,
  onCylinderChargesChange,
  onNumberOfCylindersChange,
  onInventoryChargesChange,
  // Button props
  onSaveDraft,
  onSubmitForApproval,
  loading = false,
  hasChanges = false,
  isEditMode = false,
}) => {
  const handleNumericKeyDown = (e) => {
    if (!/[0-9.]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <Card>
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

          {/* Tax Percent */}
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="taxPercent" className="text-muted-foreground">Tax (%)</Label>
            <Select
              value={taxPercent?.toString() || '0'}
              onValueChange={(value) => onTaxPercentChange && onTaxPercentChange(parseFloat(value))}
            >
              <SelectTrigger className="w-20">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0%</SelectItem>
                <SelectItem value="5">5%</SelectItem>
                <SelectItem value="18">18%</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tax on Subtotal */}
          {taxOnSubtotal > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax on Subtotal</span>
              <span>₹{taxOnSubtotal.toFixed(2)}</span>
            </div>
          )}

          {/* Cylinder Charges */}
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="cylinderCharges" className="text-muted-foreground">Cylinder Charges</Label>
                <Select
                  value={String(numberOfCylinders || 0)}
                  onValueChange={(value) => onNumberOfCylindersChange && onNumberOfCylindersChange(parseInt(value))}
                >
                  <SelectTrigger className="w-14 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <SelectItem key={num} value={String(num)}>{num}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                id="cylinderCharges"
                type="text"
                inputMode="decimal"
                value={cylinderCharges}
                onChange={(e) => onCylinderChargesChange && onCylinderChargesChange(e.target.value)}
                onKeyDown={handleNumericKeyDown}
                className="w-24 text-right"
              />
            </div>
            {numberOfCylinders > 0 && (
              <p className="text-xs text-muted-foreground">
                ({numberOfCylinders} Cylinder{numberOfCylinders > 1 ? 's' : ''})
              </p>
            )}
          </div>

          {/* Inventory Charges */}
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="inventoryCharges" className="text-muted-foreground">Inventory Charges</Label>
            <Input
              id="inventoryCharges"
              type="text"
              inputMode="decimal"
              value={inventoryCharges}
              onChange={(e) => onInventoryChargesChange && onInventoryChargesChange(e.target.value)}
              onKeyDown={handleNumericKeyDown}
              className="w-24 text-right"
            />
          </div>

          {/* Tax on Charges % - Display Only */}
          <div className="flex items-center justify-between gap-2">
            <Label className="text-muted-foreground">Tax on Charges (%)</Label>
            <span className="w-20 text-right font-medium">18%</span>
          </div>

          {/* Tax on Cylinder & Inventory Charges */}
          {taxOnCharges > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax on Cylinder & Inventory Charges</span>
              <span>₹{taxOnCharges.toFixed(2)}</span>
            </div>
          )}

          {/* Total Tax */}
          {totalTax > 0 && (
            <div className="flex justify-between font-semibold">
              <span className="text-muted-foreground">Total Tax</span>
              <span>₹{totalTax.toFixed(2)}</span>
            </div>
          )}

          <Separator />

          {/* Total */}
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-primary">₹{total.toFixed(2)}</span>
          </div>

          {/* Advance Payment */}
          <div className="flex justify-between text-sm font-semibold text-muted-foreground pt-2 border-t border-dashed">
            <span>Advance Payment (35%)</span>
            <span>₹{advancePayment.toFixed(2)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={onSaveDraft}
            disabled={loading || !hasChanges}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
            Save as Draft
          </Button>
          <Button
            className="w-full"
            onClick={onSubmitForApproval}
            disabled={loading || !hasChanges}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send size={16} className="mr-2" />}
            {isEditMode ? 'Submit Updated Approval' : 'Submit for Approval'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuoteSummaryCard;
