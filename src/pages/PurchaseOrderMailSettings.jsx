import { useEffect, useState } from 'react';
import { settingsAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Save, Loader2, Mail, Trash2, Plus, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const PurchaseOrderMailSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    subject: 'Purchase Order {poNumber} from {companyName}',
    cc: [],
    template: '',
    companyName: '',
  });
  const [originalSettings, setOriginalSettings] = useState(null);
  const [ccInput, setCcInput] = useState('');
  const [deleteCcConfirm, setDeleteCcConfirm] = useState({ open: false, email: '' });

  const samplePO = {
    poNumber: 'PO-2026-0001',
    quoteNumber: 'CR-2026-0001',
    manufacturerName: 'Sample Manufacturer',
    totalAmount: 8500.0,
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getPurchaseOrderMailSettings();
      if (response.data.success) {
        const data = response.data.data;
        const nextSettings = {
          ...data,
          template: data.template || defaultTemplate,
        };
        setSettings(nextSettings);
        setOriginalSettings(nextSettings);
      }
    } catch (error) {
      toast.error('Failed to load purchase order mail settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const settingsToSave = {
        subject: settings.subject,
        cc: settings.cc,
        template: settings.template || defaultTemplate,
        companyName: settings.companyName,
      };
      await settingsAPI.updatePurchaseOrderMailSettings(settingsToSave);
      setOriginalSettings({
        ...settings,
        template: settings.template || defaultTemplate,
      });
      toast.success('Purchase order mail settings saved successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCc = () => {
    const email = ccInput.trim();
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(email)) {
        if (!settings.cc.includes(email)) {
          setSettings({
            ...settings,
            cc: [...settings.cc, email],
          });
          setCcInput('');
        } else {
          toast.error('Email already exists in CC list');
        }
      } else {
        toast.error('Please enter a valid email address');
      }
    } else {
      toast.error('Please enter an email address');
    }
  };

  const handleRemoveCc = (email) => {
    setDeleteCcConfirm({ open: true, email });
  };

  const confirmRemoveCc = () => {
    setSettings({
      ...settings,
      cc: settings.cc.filter(e => e !== deleteCcConfirm.email),
    });
    setDeleteCcConfirm({ open: false, email: '' });
    toast.success('CC recipient removed');
  };

  const formatPreviewContent = (template, po) => {
    const companyName = settings.companyName || 'Your Company';
    return template
      .replace(/{manufacturerName}/g, po.manufacturerName)
      .replace(/{poNumber}/g, po.poNumber)
      .replace(/{quoteNumber}/g, po.quoteNumber)
      .replace(/{totalAmount}/g, po.totalAmount?.toFixed(2) || '0.00')
      .replace(/{companyName}/g, companyName);
  };

  const formatPreviewSubject = (subject, po) => {
    const companyName = settings.companyName || 'Your Company';
    return subject
      .replace(/{poNumber}/g, po.poNumber)
      .replace(/{companyName}/g, companyName)
      .replace(/{manufacturerName}/g, po.manufacturerName)
      .replace(/{quoteNumber}/g, po.quoteNumber)
      .replace(/{totalAmount}/g, po.totalAmount?.toFixed(2) || '0.00');
  };

  const defaultTemplate = `<div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; color: #333;">
  <p style="font-size: 16px; margin-bottom: 20px;"><strong>Dear {manufacturerName},</strong></p>
  
  <p style="font-size: 14px; line-height: 1.6; margin-bottom: 15px;">
    Please find the attached <strong>Purchase Order</strong> for your reference.
  </p>
  
  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <tr>
      <td style="padding: 8px; font-weight: bold;">PO Number:</td>
      <td style="padding: 8px;">{poNumber}</td>
    </tr>
    <tr>
      <td style="padding: 8px; font-weight: bold;">Total Amount:</td>
      <td style="padding: 8px;">₹{totalAmount}</td>
    </tr>
  </table>

  <p style="font-size: 14px; line-height: 1.6; margin-bottom: 5px;">
    Best regards,<br>
    <strong style="color: #f97316; font-size: 15px;">{companyName}</strong>
  </p>
</div>`;

  const hasChanges = !!originalSettings && JSON.stringify(settings) !== JSON.stringify(originalSettings);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">PO Mail Settings</h1>
        <p className="text-muted-foreground">Configure email settings for purchase order notifications</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Name</CardTitle>
              <CardDescription>
                Set the company name that will be used in PO emails
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  placeholder="Your Company Name"
                />
                <p className="text-xs text-muted-foreground">
                  This name will replace {'{companyName}'} placeholder in subject and template
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Subject</CardTitle>
              <CardDescription>
                Configure subject. Placeholders: {'{poNumber}'}, {'{companyName}'}, {'{manufacturerName}'}, {'{quoteNumber}'}, {'{totalAmount}'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject Template</Label>
                <Input
                  id="subject"
                  value={settings.subject}
                  onChange={(e) => setSettings({ ...settings, subject: e.target.value })}
                  placeholder="Purchase Order {poNumber} from {companyName}"
                />
                <p className="text-xs text-muted-foreground">
                  Available placeholders: {'{poNumber}'}, {'{companyName}'}, {'{manufacturerName}'}, {'{quoteNumber}'}, {'{totalAmount}'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>CC Recipients</CardTitle>
              <CardDescription>
                Add email addresses that should receive a copy of all PO emails
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter email address"
                    value={ccInput}
                    onChange={(e) => setCcInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCc();
                      }
                    }}
                  />
                  <Button onClick={handleAddCc} variant="outline">
                    <Plus size={16} className="mr-2" />
                    Add
                  </Button>
                </div>
                {settings.cc.length > 0 && (
                  <div className="space-y-2">
                    {settings.cc.map((email, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted rounded-md"
                      >
                        <span className="text-sm">{email}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveCc(email)}
                          className="h-6 w-6 text-destructive hover:text-destructive"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Template</CardTitle>
              <CardDescription>
                Use placeholders: {'{manufacturerName}'}, {'{poNumber}'}, {'{quoteNumber}'}, {'{totalAmount}'}, {'{companyName}'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="template">Email Body Template</Label>
                <Textarea
                  id="template"
                  value={settings.template && settings.template.trim() !== '' ? settings.template : defaultTemplate}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setSettings({ ...settings, template: newValue === defaultTemplate ? '' : newValue });
                  }}
                  placeholder={defaultTemplate}
                  rows={12}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Available placeholders: {'{manufacturerName}'}, {'{poNumber}'}, {'{quoteNumber}'}, {'{totalAmount}'}, {'{companyName}'}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving || !hasChanges} size="lg">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} className="mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye size={18} />
                Email Preview
              </CardTitle>
              <CardDescription>
                Preview how the email will look
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Subject:</Label>
                  <p className="text-sm font-medium mt-1 p-2 bg-muted rounded">
                    {formatPreviewSubject(settings.subject, samplePO)}
                  </p>
                </div>
                {settings.cc.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">CC:</Label>
                    <p className="text-sm mt-1 p-2 bg-muted rounded">
                      {settings.cc.join(', ')}
                    </p>
                  </div>
                )}
                <div>
                  <Label className="text-xs text-muted-foreground">Body:</Label>
                  <div
                    className="mt-1 p-4 bg-white rounded border max-h-96 overflow-y-auto"
                    dangerouslySetInnerHTML={{
                      __html: formatPreviewContent(settings.template || defaultTemplate, samplePO),
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteCcConfirm.open}
        onClose={() => setDeleteCcConfirm({ open: false, email: '' })}
        onConfirm={confirmRemoveCc}
        title="Remove CC Recipient?"
        message={`Are you sure you want to remove "${deleteCcConfirm.email}" from the CC list?`}
        confirmText="Remove"
        variant="destructive"
      />
    </div>
  );
};

export default PurchaseOrderMailSettings;

