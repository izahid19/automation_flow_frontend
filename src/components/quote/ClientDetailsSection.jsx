import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Client Details Form Section
 * Handles party name, marketed by, email, and phone inputs
 */
export const ClientDetailsSection = ({ formData, errors, onChange }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Party Name */}
          <div className="space-y-2">
            <Label htmlFor="partyName">
              Party Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="partyName"
              name="partyName"
              value={formData.partyName}
              onChange={onChange}
              placeholder="Party / Client Name"
              className={errors.partyName ? 'border-destructive' : ''}
            />
            {errors.partyName && (
              <p className="text-xs text-destructive">{errors.partyName}</p>
            )}
          </div>

          {/* Marketed By */}
          <div className="space-y-2">
            <Label htmlFor="marketedBy">
              Marketed By <span className="text-red-500">*</span>
            </Label>
            <Input
              id="marketedBy"
              name="marketedBy"
              value={formData.marketedBy}
              onChange={onChange}
              placeholder="Sales person name"
              className={errors.marketedBy ? 'border-destructive' : ''}
            />
            {errors.marketedBy && (
              <p className="text-xs text-destructive">{errors.marketedBy}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="clientEmail">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="clientEmail"
              name="clientEmail"
              type="email"
              value={formData.clientEmail}
              onChange={onChange}
              placeholder="client@email.com"
              className={errors.clientEmail ? 'border-destructive' : ''}
            />
            {errors.clientEmail && (
              <p className="text-xs text-destructive">{errors.clientEmail}</p>
            )}
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="clientPhone">Phone Number</Label>
            <Input
              id="clientPhone"
              name="clientPhone"
              value={formData.clientPhone}
              onChange={onChange}
              placeholder="+91 XXXXX XXXXX"
              className={errors.clientPhone ? 'border-destructive' : ''}
            />
            {errors.clientPhone && (
              <p className="text-xs text-destructive">{errors.clientPhone}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
