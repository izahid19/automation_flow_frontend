import { useState, useEffect } from 'react';
import { manufacturerAPI } from '../services/api';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Factory,
  Loader2,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

const Manufacturers = () => {
  const [manufacturers, setManufacturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, name: '' });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    contactPerson: '',
    category: '',
    ccEmails: [],
    bccEmails: [],
  });
  const [ccInput, setCcInput] = useState('');
  const [bccInput, setBccInput] = useState('');

  useEffect(() => {
    fetchManufacturers();
  }, [search]);

  const fetchManufacturers = async () => {
    try {
      const response = await manufacturerAPI.getAll({ search });
      setManufacturers(response.data.data);
    } catch (error) {
      toast.error('Failed to load manufacturers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await manufacturerAPI.update(editingId, formData);
        toast.success('Manufacturer updated');
      } else {
        await manufacturerAPI.create(formData);
        toast.success('Manufacturer created');
      }
      setShowModal(false);
      resetForm();
      fetchManufacturers();
    } catch (error) {
      toast.error('Failed to save manufacturer');
    }
  };

  const handleEdit = (manufacturer) => {
    setFormData({
      name: manufacturer.name,
      email: manufacturer.email,
      phone: manufacturer.phone || '',
      address: manufacturer.address || '',
      city: manufacturer.city || '',
      state: manufacturer.state || '',
      contactPerson: manufacturer.contactPerson || '',
      category: manufacturer.category || '',
      ccEmails: manufacturer.ccEmails || [],
      bccEmails: manufacturer.bccEmails || [],
    });
    setCcInput('');
    setBccInput('');
    setEditingId(manufacturer._id);
    setShowModal(true);
  };

  const openDeleteConfirm = (m) => {
    setDeleteConfirm({ open: true, id: m._id, name: m.name });
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await manufacturerAPI.delete(deleteConfirm.id);
      toast.success('Manufacturer deleted');
      setDeleteConfirm({ open: false, id: null, name: '' });
      fetchManufacturers();
    } catch (error) {
      toast.error('Failed to delete');
    } finally {
      setDeleteLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      contactPerson: '',
      category: '',
      ccEmails: [],
      bccEmails: [],
    });
    setCcInput('');
    setBccInput('');
    setEditingId(null);
  };

  // Email validation helper
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Add CC email
  const addCcEmail = () => {
    const email = ccInput.trim();
    if (email && isValidEmail(email) && !formData.ccEmails.includes(email)) {
      setFormData({ ...formData, ccEmails: [...formData.ccEmails, email] });
      setCcInput('');
    } else if (email && !isValidEmail(email)) {
      toast.error('Please enter a valid email');
    }
  };

  // Remove CC email
  const removeCcEmail = (emailToRemove) => {
    setFormData({ ...formData, ccEmails: formData.ccEmails.filter(e => e !== emailToRemove) });
  };

  // Add BCC email
  const addBccEmail = () => {
    const email = bccInput.trim();
    if (email && isValidEmail(email) && !formData.bccEmails.includes(email)) {
      setFormData({ ...formData, bccEmails: [...formData.bccEmails, email] });
      setBccInput('');
    } else if (email && !isValidEmail(email)) {
      toast.error('Please enter a valid email');
    }
  };

  // Remove BCC email
  const removeBccEmail = (emailToRemove) => {
    setFormData({ ...formData, bccEmails: formData.bccEmails.filter(e => e !== emailToRemove) });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Manufacturers</h1>
          <p className="text-[var(--text-secondary)]">Manage your manufacturers</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="btn btn-primary"
        >
          <Plus size={20} />
          Add Manufacturer
        </button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search manufacturers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
          </div>
        ) : manufacturers.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Factory className="w-12 h-12 mx-auto text-[var(--text-secondary)] mb-3" />
            <p className="text-[var(--text-secondary)]">No manufacturers found</p>
          </div>
        ) : (
          manufacturers.map((m) => (
            <div key={m._id} className="card card-hover">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--primary)] to-orange-400 flex items-center justify-center text-white font-bold">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">{m.name}</p>
                    <p className="text-sm text-[var(--text-secondary)]">{m.email}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(m)}
                    className="p-2 hover:bg-[var(--surface-hover)] rounded-lg"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => openDeleteConfirm(m)}
                    className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {(m.phone || m.city) && (
                <div className="mt-3 pt-3 border-t border-[var(--border)] text-sm text-[var(--text-secondary)]">
                  {m.phone && <p>📞 {m.phone}</p>}
                  {m.city && <p>📍 {m.city}, {m.state}</p>}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {editingId ? 'Edit Manufacturer' : 'Add Manufacturer'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-[var(--surface-hover)] rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="input"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-2">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              {/* CC Emails Section */}
              <div className="pt-4 border-t border-[var(--border)]">
                <label className="block text-sm font-medium mb-2">CC Emails (for PO)</label>
                <p className="text-xs text-muted-foreground mb-2">These email addresses will be CC'd when sending Purchase Orders</p>
                <div className="flex gap-2 mb-2">
                  <input
                    type="email"
                    value={ccInput}
                    onChange={(e) => setCcInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCcEmail())}
                    placeholder="Enter email and press Enter or click Add"
                    className="input flex-1"
                  />
                  <button type="button" onClick={addCcEmail} className="btn btn-secondary px-4">Add</button>
                </div>
                {formData.ccEmails.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.ccEmails.map((email, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/30">
                        {email}
                        <button type="button" onClick={() => removeCcEmail(email)} className="hover:text-red-400 ml-1">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* BCC Emails Section */}
              <div className="pt-4 border-t border-[var(--border)]">
                <label className="block text-sm font-medium mb-2">BCC Emails (for PO)</label>
                <p className="text-xs text-muted-foreground mb-2">These email addresses will be BCC'd when sending Purchase Orders</p>
                <div className="flex gap-2 mb-2">
                  <input
                    type="email"
                    value={bccInput}
                    onChange={(e) => setBccInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addBccEmail())}
                    placeholder="Enter email and press Enter or click Add"
                    className="input flex-1"
                  />
                  <button type="button" onClick={addBccEmail} className="btn btn-secondary px-4">Add</button>
                </div>
                {formData.bccEmails.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.bccEmails.map((email, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        {email}
                        <button type="button" onClick={() => removeBccEmail(email)} className="hover:text-red-400 ml-1">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: null, name: '' })}
        onConfirm={handleDelete}
        title="Delete Manufacturer?"
        message={`Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`}
        loading={deleteLoading}
      />
    </div>
  );
};

export default Manufacturers;
