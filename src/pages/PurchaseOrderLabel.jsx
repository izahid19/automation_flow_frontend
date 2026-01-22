import { useEffect, useMemo, useState } from 'react';
import { settingsAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Save, Loader2, Tag, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import PurchaseOrderPreview from '../components/PurchaseOrderPreview';

const PurchaseOrderLabel = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [settings, setSettings] = useState({
    purchaseOrderLabel: 'PURCHASE ORDER',
    purchaseOrderPhone: '+917696275527',
    purchaseOrderEmail: 'user@gmail.com',
    purchaseOrderTerms: 'Payment due within 30 days. All prices in INR.',
  });
  const [originalSettings, setOriginalSettings] = useState(settings);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.getAll();
      if (response.data.success) {
        const data = response.data.data || {};
        const fetchedSettings = {
          purchaseOrderLabel: data.purchaseOrderLabel || 'PURCHASE ORDER',
          purchaseOrderPhone: data.purchaseOrderPhone || '+917696275527',
          purchaseOrderEmail: data.purchaseOrderEmail || 'user@gmail.com',
          purchaseOrderTerms: data.purchaseOrderTerms || 'Payment due within 30 days. All prices in INR.',
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings({
      ...settings,
      [name]: name === 'purchaseOrderLabel' ? value.toUpperCase() : value,
    });
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  const sampleItems = useMemo(() => ([
    {
      brandName: 'Nertox',
      formulationType: 'Tablet',
      packing: '10x15',
      quantity: 100,
      mrp: 50,
      rate: 20,
      specification: 'just normal',
    },
  ]), []);

  const totals = useMemo(() => {
    const subtotal = sampleItems.reduce((sum, item) => sum + (item.quantity || 0) * (item.rate || 0), 0);
    return { subtotal, total: subtotal };
  }, [sampleItems]);

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
          <h1 className="text-2xl font-bold">Purchase Order Label & Contact</h1>
          <p className="text-muted-foreground">Customize the document heading and company contact information</p>
        </div>
      </div>

      {/* Settings Card */}
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Document & Contact Settings</CardTitle>
          <CardDescription>
            These details will appear on all generated purchase orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="purchaseOrderLabel">Document Heading</Label>
              <Input
                id="purchaseOrderLabel"
                name="purchaseOrderLabel"
                value={settings.purchaseOrderLabel}
                onChange={handleChange}
                placeholder="PURCHASE ORDER"
                className="text-lg font-bold"
                maxLength={50}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchaseOrderPhone">Company Phone</Label>
                <Input
                  id="purchaseOrderPhone"
                  name="purchaseOrderPhone"
                  value={settings.purchaseOrderPhone}
                  onChange={handleChange}
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchaseOrderEmail">Company Email</Label>
                <Input
                  id="purchaseOrderEmail"
                  name="purchaseOrderEmail"
                  value={settings.purchaseOrderEmail}
                  onChange={handleChange}
                  placeholder="email@company.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchaseOrderTerms">Terms & Conditions</Label>
              <Textarea
                id="purchaseOrderTerms"
                name="purchaseOrderTerms"
                value={settings.purchaseOrderTerms}
                onChange={handleChange}
                placeholder="Enter default terms and conditions..."
                rows={4}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setPreviewOpen(true)}
                className="gap-2"
              >
                <Eye className="w-4 h-4" />
                Preview
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {previewOpen && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Preview</CardTitle>
            <Button variant="ghost" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
          </CardHeader>
          <CardContent>
            <PurchaseOrderPreview
              formData={{ quoteNumber: 'CR-2026-0001', notes: '', hidePurchaseRate: false }}
              items={sampleItems}
              manufacturer={{ name: 'Sample Manufacturer', email: 'manufacturer@example.com', address: 'Sample Address' }}
              totals={totals}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PurchaseOrderLabel;

