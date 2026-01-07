import { useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Save, Loader2, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

const InvoiceLabel = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    invoiceLabel: 'QUOTATION',
    companyPhone: '+917696275527',
    companyEmail: 'user@gmail.com',
  });

  useEffect(() => {
    fetchInvoiceLabel();
  }, []);

  const fetchInvoiceLabel = async () => {
    try {
      const response = await settingsAPI.getAll();
      if (response.data.success) {
        setSettings({
          invoiceLabel: response.data.data.invoiceLabel || 'QUOTATION',
          companyPhone: response.data.data.companyPhone || '+917696275527',
          companyEmail: response.data.data.companyEmail || 'user@gmail.com',
        });
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
      [name]: name === 'invoiceLabel' ? value.toUpperCase() : value,
    });
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

      {/* Save Button */}
      <div className="flex justify-end max-w-3xl">
        <Button onClick={handleSave} disabled={saving} size="lg">
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
