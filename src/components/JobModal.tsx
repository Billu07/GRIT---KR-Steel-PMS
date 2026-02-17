'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Button from './ui/Button';
import { addDays, format, differenceInDays } from 'date-fns';

interface JobModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (jobData: any) => void;
  categoryId: string; // Passed to know context
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  equipmentList: any[]; // List of equipment in this category
}

const JobModal: React.FC<JobModalProps> = ({ isOpen, onClose, onSubmit, equipmentList }) => {
  // Form State
  const [formData, setFormData] = useState({
    jobCode: '',
    jobName: '',
    jobType: '',
    equipmentId: '',
    flag: '',
    dateDone: format(new Date(), 'yyyy-MM-dd'),
    hoursWorked: 0,
    plannedHours: 0,
    frequency: 'weekly',
    criticality: 'medium',
    status: 'active'
  });

  // Calculated State
  const [calculated, setCalculated] = useState({
    dateDue: '',
    remainingHours: 0,
    overdueDays: 0,
  });

  // Frequency Mapping
  const frequencyDays: { [key: string]: number } = {
    weekly: 7,
    monthly: 30,
    '3-monthly': 90,
    yearly: 365,
    '5-yearly': 1825,
  };

  // Auto-calculate effect
  useEffect(() => {
    const daysToAdd = frequencyDays[formData.frequency] || 0;
    const dateDone = new Date(formData.dateDone);
    const dueDate = addDays(dateDone, daysToAdd);
    const dateDueStr = format(dueDate, 'yyyy-MM-dd');

    const today = new Date();
    const overdue = differenceInDays(today, dueDate);
    const overdueDays = overdue > 0 ? overdue : 0;

    const remaining = Math.max(0, formData.plannedHours - formData.hoursWorked);

    setCalculated({
      dateDue: dateDueStr,
      overdueDays: overdueDays,
      remainingHours: remaining,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.dateDone, formData.frequency, formData.plannedHours, formData.hoursWorked]);

  if (!isOpen) return null;


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'hoursWorked' || name === 'plannedHours' ? Number(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      ...calculated
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Create New Job</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Job Code</label>
                <input 
                  type="text" 
                  name="jobCode" 
                  value={formData.jobCode} 
                  onChange={handleChange} 
                  required 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Job Type</label>
                <select 
                  name="jobType" 
                  value={formData.jobType} 
                  onChange={handleChange} 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                >
                  <option value="">Select Type</option>
                  <option value="Inspection">Inspection</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Repair">Repair</option>
                  <option value="Overhaul">Overhaul</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Equipment</label>
                <select 
                  name="equipmentId" 
                  value={formData.equipmentId} 
                  onChange={handleChange} 
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                >
                  <option value="">Select Equipment</option>
                  {equipmentList.map(eq => (
                    <option key={eq.id} value={eq.id}>{eq.name} ({eq.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Flag</label>
                <input 
                  type="text" 
                  name="flag" 
                  value={formData.flag} 
                  onChange={handleChange} 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Date Done</label>
                <input 
                  type="date" 
                  name="dateDone" 
                  value={formData.dateDone} 
                  onChange={handleChange} 
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Planned Hours</label>
                <input 
                  type="number" 
                  name="plannedHours" 
                  value={formData.plannedHours} 
                  onChange={handleChange} 
                  required
                  min="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Hours Worked</label>
                <input 
                  type="number" 
                  name="hoursWorked" 
                  value={formData.hoursWorked} 
                  onChange={handleChange} 
                  min="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Frequency</label>
                <select 
                  name="frequency" 
                  value={formData.frequency} 
                  onChange={handleChange} 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="3-monthly">3-Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="5-yearly">5-Yearly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Criticality</label>
                <select 
                  name="criticality" 
                  value={formData.criticality} 
                  onChange={handleChange} 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          </div>

          {/* Full Width */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
             <div>
                <label className="block text-sm font-medium text-gray-700">Job Name / Description</label>
                <textarea 
                  name="jobName" 
                  value={formData.jobName} 
                  onChange={handleChange} 
                  required
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
              </div>

              {/* Calculated Fields Display */}
              <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-md">
                <div>
                   <span className="block text-xs text-gray-500">Due Date</span>
                   <span className="font-semibold text-gray-800">{calculated.dateDue}</span>
                </div>
                <div>
                   <span className="block text-xs text-gray-500">Remaining Hours</span>
                   <span className="font-semibold text-gray-800">{calculated.remainingHours}</span>
                </div>
                 <div>
                   <span className="block text-xs text-gray-500">Overdue Days</span>
                   <span className={`font-semibold ${calculated.overdueDays > 0 ? 'text-red-600' : 'text-green-600'}`}>
                     {calculated.overdueDays}
                   </span>
                </div>
              </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Create Job
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobModal;
