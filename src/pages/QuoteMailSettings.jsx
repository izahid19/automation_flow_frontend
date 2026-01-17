import { useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Save, Loader2, Mail, Trash2, Plus, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const QuoteMailSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [settings, setSettings] = useState({
    subject: `Quotation {quoteNumber} from {companyName}`,
    cc: [],
    template: '',
    companyName: '',
  });
  const [ccInput, setCcInput] = useState('');
  const [deleteCcConfirm, setDeleteCcConfirm] = useState({ open: false, email: '' });

  // Sample data for preview
  const sampleQuote = {
    quoteNumber: 'CR-2024-0001',
    clientName: 'Sample Client Company',
    totalAmount: 54330.00,
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    pdfUrl: '#',
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getQuoteMailSettings();
      if (response.data.success) {
        const data = response.data.data;
        // If template is empty, use default template
        setSettings({
          ...data,
          template: data.template || defaultTemplate,
        });
      }
    } catch (error) {
      toast.error('Failed to load quote mail settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Ensure all fields are sent including companyName
      const settingsToSave = {
        subject: settings.subject,
        cc: settings.cc,
        template: settings.template || defaultTemplate,
        companyName: settings.companyName,
      };
      await settingsAPI.updateQuoteMailSettings(settingsToSave);
      toast.success('Quote mail settings saved successfully');
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
          setCcInput(''); // Clear input after adding
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

  const formatPreviewContent = (template, quote) => {
    const companyName = settings.companyName || 'Your Company';
    return template
      .replace(/{clientName}/g, quote.clientName)
      .replace(/{quoteNumber}/g, quote.quoteNumber)
      .replace(/{totalAmount}/g, quote.totalAmount?.toFixed(2) || '0.00')
      .replace(/{validUntil}/g, new Date(quote.validUntil).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }))
      .replace(/{pdfUrl}/g, quote.pdfUrl || '#')
      .replace(/{companyName}/g, companyName);
  };

  const formatPreviewSubject = (subject, quote) => {
    const companyName = settings.companyName || 'Your Company';
    return subject
      .replace(/{quoteNumber}/g, quote.quoteNumber)
      .replace(/{companyName}/g, companyName)
      .replace(/{clientName}/g, quote.clientName)
      .replace(/{totalAmount}/g, quote.totalAmount?.toFixed(2) || '0.00');
  };

  const defaultTemplate = `<h2>Dear {clientName},</h2>
<p>Please find attached the approved quotation/invoice for your reference.</p>
<p><strong>Quote Number:</strong> {quoteNumber}</p>
<p><strong>Total Amount:</strong> ₹{totalAmount}</p>
<p><strong>Valid Until:</strong> {validUntil}</p>
<p>You can view the PDF <a href="{pdfUrl}">here</a>.</p>
<br>
<p>Best regards,<br>{companyName}</p>`;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Quote Mail Settings</h1>
        <p className="text-muted-foreground">Configure email settings for quote notifications</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Name */}
          <Card>
            <CardHeader>
              <CardTitle>Company Name</CardTitle>
              <CardDescription>
                Set the company name that will be used in quote emails
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

          {/* Email Subject */}
          <Card>
            <CardHeader>
              <CardTitle>Email Subject</CardTitle>
              <CardDescription>
                Configure the email subject line. Use placeholders: {'{quoteNumber}'}, {'{companyName}'}, {'{clientName}'}, {'{totalAmount}'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject Template</Label>
                <Input
                  id="subject"
                  value={settings.subject}
                  onChange={(e) => setSettings({ ...settings, subject: e.target.value })}
                  placeholder="Quotation {quoteNumber} from {companyName}"
                />
                <p className="text-xs text-muted-foreground">
                  Available placeholders: {'{quoteNumber}'}, {'{companyName}'}, {'{clientName}'}, {'{totalAmount}'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* CC Recipients */}
          <Card>
            <CardHeader>
              <CardTitle>CC Recipients</CardTitle>
              <CardDescription>
                Add email addresses that should receive a copy of all quote emails
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

          {/* Email Template */}
          <Card>
            <CardHeader>
              <CardTitle>Email Template</CardTitle>
              <CardDescription>
                Configure the email body template. Use placeholders: {'{clientName}'}, {'{quoteNumber}'}, {'{totalAmount}'}, {'{validUntil}'}, {'{pdfUrl}'}, {'{companyName}'}
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
                    // If user clears the template, save empty string so backend uses default
                    setSettings({ ...settings, template: newValue === defaultTemplate ? '' : newValue });
                  }}
                  placeholder={defaultTemplate}
                  rows={12}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Available placeholders: {'{clientName}'}, {'{quoteNumber}'}, {'{totalAmount}'}, {'{validUntil}'}, {'{pdfUrl}'}, {'{companyName}'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} size="lg">
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

        {/* Preview Panel */}
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
                    {formatPreviewSubject(settings.subject, sampleQuote)}
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
                    className="mt-1 p-4 bg-muted rounded border max-h-96 overflow-y-auto"
                    dangerouslySetInnerHTML={{
                      __html: formatPreviewContent(settings.template || defaultTemplate, sampleQuote),
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete CC Confirmation Dialog */}
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

export default QuoteMailSettings;
