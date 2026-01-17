import { useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Save, Loader2, Tag, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import QuotePreview from '../components/QuotePreview';

const InvoiceLabel = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewDesign, setPreviewDesign] = useState(null);
  const [settings, setSettings] = useState({
    invoiceLabel: 'QUOTATION',
    companyPhone: '+917696275527',
    companyEmail: 'user@gmail.com',
    invoiceDesign: 'design2',
    terms: 'Payment due within 30 days. All prices in INR.',
    bankDetails: '',
    advancePaymentNote: 'Please pay the advance amount to continue the process.',
  });
  const [originalSettings, setOriginalSettings] = useState({
    invoiceLabel: 'QUOTATION',
    companyPhone: '+917696275527',
    companyEmail: 'user@gmail.com',
    invoiceDesign: 'design2',
    terms: 'Payment due within 30 days. All prices in INR.',
    bankDetails: '',
    advancePaymentNote: 'Please pay the advance amount to continue the process.',
  });
  
  // Sample quote data for preview - will use settings values
  const getSampleQuote = () => ({
    quoteNumber: 'CR-2024-0001',
    clientName: 'Sample Client Company',
    partyName: 'Sample Client Company',
    clientEmail: 'client@example.com',
    clientPhone: '+91 98765 43210',
    marketedBy: 'John Doe',
    createdAt: new Date().toISOString(),
    createdBy: { email: 'admin@example.com' },
    items: [
      {
        brandName: 'Sample Product 1',
        composition: 'Paracetamol 500mg',
        formulationType: 'Tablet',
        packing: '10x10',
        packagingType: 'Blister',
        pvcType: 'Clear PVC',
        cartonPacking: '-',
        specification: 'Test Specification',
        quantity: 100,
        mrp: 50,
        rate: 40,
      },
      {
        brandName: 'Sample Product 2',
        composition: 'Ibuprofen 400mg',
        formulationType: 'Capsule',
        packing: '10x10',
        packagingType: 'Alu Alu',
        cartonPacking: '-',
        specification: '',
        quantity: 50,
        mrp: 60,
        rate: 45,
      },
    ],
    taxPercent: 18,
    cylinderCharges: 500,
    inventoryCharges: 300,
    terms: settings.terms || 'Payment due within 30 days. All prices in INR.',
    bankDetails: settings.bankDetails || 'Account Number: 123456789\nBank: Example Bank\nIFSC: EXMP0001234',
  });

  useEffect(() => {
    fetchInvoiceLabel();
  }, []);

  const fetchInvoiceLabel = async () => {
    try {
      const response = await settingsAPI.getAll();
      if (response.data.success) {
        const fetchedSettings = {
          invoiceLabel: response.data.data.invoiceLabel || 'QUOTATION',
          companyPhone: response.data.data.companyPhone || '+917696275527',
          companyEmail: response.data.data.companyEmail || 'user@gmail.com',
          invoiceDesign: response.data.data.invoiceDesign || 'design2',
          terms: response.data.data.terms || 'Payment due within 30 days. All prices in INR.',
          bankDetails: response.data.data.bankDetails || '',
          advancePaymentNote: response.data.data.advancePaymentNote || 'Please pay the advance amount to continue the process.',
        };
        setSettings(fetchedSettings);
        setOriginalSettings(fetchedSettings);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsAPI.update(settings);
      setOriginalSettings(settings);
      toast.success('Settings saved successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Check if settings have changed
  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings({
      ...settings,
      [name]: name === 'invoiceLabel' ? value.toUpperCase() : value,
    });
  };

  const handleDesignChange = (value) => {
    setSettings({
      ...settings,
      invoiceDesign: value,
    });
  };

  const handlePreview = (design) => {
    setPreviewDesign(design);
  };

  const closePreview = () => {
    setPreviewDesign(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg bg-primary/10">
          <Tag className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Invoice Label & Contact</h1>
          <p className="text-muted-foreground">Customize the document heading and company contact information</p>
        </div>
      </div>

      {/* Settings Card */}
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Document & Contact Settings</CardTitle>
          <CardDescription>
            These details will appear on all generated quote PDFs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Invoice Label */}
            <div className="space-y-2">
              <Label htmlFor="invoiceLabel">Document Heading</Label>
              <Input
                id="invoiceLabel"
                name="invoiceLabel"
                value={settings.invoiceLabel}
                onChange={handleChange}
                placeholder="QUOTATION"
                className="text-lg font-bold"
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">
                Examples: QUOTATION, INVOICE, PROFORMA INVOICE, TAX INVOICE, ESTIMATE
              </p>
            </div>

            {/* Invoice Design Selection */}
            <div className="space-y-2">
              <Label htmlFor="invoiceDesign">Invoice Design</Label>
              <Select value={settings.invoiceDesign} onValueChange={handleDesignChange}>
                <SelectTrigger id="invoiceDesign" className="w-full">
                  <SelectValue placeholder="Select Design" />
                </SelectTrigger>
                <SelectContent>
                  {/* <SelectItem value="design1">Design 1 - Table Layout (Default)</SelectItem> - Commented out for future reference */}
                  <SelectItem value="design2">Design 2 - Card Layout</SelectItem>
                  {/* Design 3 removed - no longer needed */}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose how items are displayed on invoices and quotes
              </p>
              
              {/* Design Preview Buttons */}
              <div className="flex gap-2 mt-3">
                {/* <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreview('design1')}
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview Design 1
                </Button> - Commented out for future reference */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreview('design2')}
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview Design 2
                </Button>
                {/* Design 3 preview button removed - no longer needed */}
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyPhone">Phone Number</Label>
                <Input
                  id="companyPhone"
                  name="companyPhone"
                  type="tel"
                  value={settings.companyPhone}
                  onChange={handleChange}
                  placeholder="+917696275527"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyEmail">Email Address</Label>
                <Input
                  id="companyEmail"
                  name="companyEmail"
                  type="email"
                  value={settings.companyEmail}
                  onChange={handleChange}
                  placeholder="user@gmail.com"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Terms & Conditions, Account Details, and Advance Payment Note */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Terms & Conditions */}
        <Card>
          <CardHeader>
            <CardTitle>Terms & Conditions</CardTitle>
            <CardDescription>
              Default terms that will appear on all quotes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                id="terms"
                name="terms"
                value={settings.terms}
                onChange={handleChange}
                placeholder="Enter default terms and conditions..."
                className="min-h-[200px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>
              Bank account information that will appear on quotes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                id="bankDetails"
                name="bankDetails"
                value={settings.bankDetails}
                onChange={handleChange}
                placeholder="Enter bank account details...
Example:
Bank Name: XYZ Bank
Account No: 1234567890
IFSC Code: XYZB0001234
Branch: Main Branch"
                className="min-h-[200px]"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advance Payment Note */}
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Advance Payment Note</CardTitle>
          <CardDescription>
            Message displayed above Terms & Conditions on quotes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              id="advancePaymentNote"
              name="advancePaymentNote"
              value={settings.advancePaymentNote}
              onChange={handleChange}
              placeholder="Enter advance payment note..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Preview Modal */}
      {previewDesign && (
        <Card className="max-w-7xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Preview - Design 2 (Card Layout)</CardTitle>
            <Button variant="outline" size="sm" onClick={closePreview}>
              Close Preview
            </Button>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
              <QuotePreview quote={getSampleQuote()} designOverride={previewDesign} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || !hasChanges} size="lg">
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default InvoiceLabel;
