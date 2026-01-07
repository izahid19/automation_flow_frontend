import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

/**
 * Additional Information Section
 * Shows read-only terms and bank details from settings
 */
export const AdditionalInfoSection = ({ formData }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Additional Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Terms & Conditions */}
        <div className="space-y-2">
          <Label htmlFor="terms">Terms & Conditions</Label>
          <Textarea
            id="terms"
            name="terms"
            value={formData.terms}
            readOnly
            rows={3}
            className="bg-muted/50 cursor-not-allowed"
          />
        </div>

        {/* Account Details */}
        <div className="space-y-2">
          <Label htmlFor="bankDetails">Account Details</Label>
          <Textarea
            id="bankDetails"
            name="bankDetails"
            value={formData.bankDetails}
            readOnly
            rows={3}
            className="bg-muted/50 cursor-not-allowed"
          />
        </div>

        <p className="text-xs text-muted-foreground">
          These fields can only be updated by Admin/Manager from Settings.
        </p>
      </CardContent>
    </Card>
  );
};
