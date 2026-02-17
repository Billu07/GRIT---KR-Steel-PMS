'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Button from './ui/Button';

interface EquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (data: any) => void;
  categoryId: number | null; // Nullable if called from Registry
}

const EquipmentModal: React.FC<EquipmentModalProps> = ({ isOpen, onClose, onSubmit, categoryId }) => {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    location: '',
    description: '',
    status: 'active',
    selectedCategoryId: categoryId ? categoryId.toString() : '',
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && !categoryId) {
      // Fetch categories only if we need to select one
      fetch('/api/categories')
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) setCategories(data);
        })
        .catch(console.error);
    }
  }, [isOpen, categoryId]);

  // Update internal state if prop changes
  useEffect(() => {
    if (categoryId) {
        setFormData(prev => ({ ...prev, selectedCategoryId: categoryId.toString() }));
    }
  }, [categoryId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.selectedCategoryId) {
        alert("Please select a category");
        return;
    }
    
    onSubmit({ 
        ...formData, 
        categoryId: parseInt(formData.selectedCategoryId) 
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-sm shadow-lg w-full max-w-md p-6 border-t-4 border-[#0052CC]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[#1A3A52] uppercase tracking-wide">Add New Equipment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Category Dropdown (Only if not pre-selected) */}
          {!categoryId && (
             <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Category</label>
                <select 
                  name="selectedCategoryId" 
                  value={formData.selectedCategoryId} 
                  onChange={handleChange} 
                  required
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-sm focus:ring-1 focus:ring-[#0052CC] focus:border-[#0052CC] outline-none text-sm"
                >
                  <option value="">-- Select Category --</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
             </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Equipment Code</label>
            <input 
              type="text" 
              name="code" 
              value={formData.code} 
              onChange={handleChange} 
              required 
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-sm focus:ring-1 focus:ring-[#0052CC] focus:border-[#0052CC] outline-none text-sm"
              placeholder="e.g. EQ-001"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Name</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              required 
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-sm focus:ring-1 focus:ring-[#0052CC] focus:border-[#0052CC] outline-none text-sm"
              placeholder="e.g. Overhead Crane"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Location</label>
            <input 
              type="text" 
              name="location" 
              value={formData.location} 
              onChange={handleChange} 
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-sm focus:ring-1 focus:ring-[#0052CC] focus:border-[#0052CC] outline-none text-sm"
              placeholder="e.g. Bay A"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Description</label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              rows={3}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-sm focus:ring-1 focus:ring-[#0052CC] focus:border-[#0052CC] outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Status</label>
            <select 
              name="status" 
              value={formData.status} 
              onChange={handleChange} 
              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-sm focus:ring-1 focus:ring-[#0052CC] focus:border-[#0052CC] outline-none text-sm"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Retired</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={onClose} className="rounded-sm">Cancel</Button>
            <Button type="submit" className="rounded-sm bg-[#0052CC] hover:bg-[#003d99]">Create Equipment</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EquipmentModal;
