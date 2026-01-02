'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Button, Card, Input } from '@/app/ui';
import { Erasmus, University } from '@/app/type/types';

interface ErasmusSectionProps {
  userId: number;
}

const ERASMUS_STATUS_OPTIONS = [
  { value: 'futura', label: 'Future Erasmus' },
  { value: 'presente', label: 'Current Erasmus' },
  { value: 'pasada', label: 'Past Erasmus' },
];

export default function ErasmusSection({ userId }: ErasmusSectionProps) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const [erasmusAssignments, setErasmusAssignments] = useState<Erasmus[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    universityId: '',
    status: 'futura',
    year: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Helper function to get university name from the universities array
  const getUniversityName = (universityId: number): string => {
    const university = universities.find(u => String(u.id) === String(universityId));
    return university ? university.name : 'Unknown University';
  };

  const fetchErasmusAssignments = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${apiUrl}/erasmus/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setErasmusAssignments(response.data);
    } catch (err) {
      console.error('Error fetching erasmus assignments:', err);
      setError('Failed to load erasmus assignments');
    }
  }, [apiUrl, userId]);

  const fetchUniversities = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${apiUrl}/university`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUniversities(response.data);
    } catch (err) {
      console.error('Error fetching universities:', err);
    }
  }, [apiUrl]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchErasmusAssignments(), fetchUniversities()]);
      setLoading(false);
    };
    loadData();
  }, [fetchErasmusAssignments, fetchUniversities]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const resetForm = () => {
    setFormData({ universityId: '', status: 'futura', year: '' });
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const payload = {
        userId,
        universityId: parseInt(formData.universityId),
        status: formData.status,
        year: formData.year,
      };

      if (editingId) {
        await axios.put(`${apiUrl}/erasmus/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${apiUrl}/erasmus`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      await fetchErasmusAssignments();
      resetForm();
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Error saving erasmus assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (erasmus: Erasmus) => {
    setFormData({
      universityId: String(erasmus.universityId),
      status: erasmus.status,
      year: erasmus.year,
    });
    setEditingId(erasmus.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this erasmus assignment?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${apiUrl}/erasmus/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchErasmusAssignments();
    } catch (err) {
      console.error('Error deleting erasmus assignment:', err);
      setError('Failed to delete erasmus assignment');
    }
  };

  const getStatusLabel = (status: string) => {
    const option = ERASMUS_STATUS_OPTIONS.find(opt => opt.value === status);
    return option ? option.label : status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'presente':
        return 'bg-green-600';
      case 'futura':
        return 'bg-blue-600';
      case 'pasada':
        return 'bg-gray-600';
      default:
        return 'bg-gray-600';
    }
  };

  if (loading) {
    return (
      <Card title="Erasmus">
        <div className="text-gray-400 text-center py-4">Loading erasmus information...</div>
      </Card>
    );
  }

  return (
    <Card 
      title="Erasmus" 
      headerActions={
        !showForm && (
          <Button 
            variant="primary" 
            size="sm" 
            onClick={() => setShowForm(true)}
          >
            + Add Erasmus
          </Button>
        )
      }
    >
      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-200">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-800 rounded-lg space-y-4">
          <h4 className="text-lg font-medium text-gray-200">
            {editingId ? 'Edit Erasmus' : 'Add New Erasmus'}
          </h4>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              University
            </label>
            <select
              name="universityId"
              value={formData.universityId}
              onChange={handleChange}
              required
              className="block w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              <option value="">Select a university</option>
              {universities.map(uni => (
                <option key={uni.id} value={uni.id}>
                  {uni.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              className="block w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              {ERASMUS_STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Academic Year"
            name="year"
            value={formData.year}
            onChange={handleChange}
            required
            placeholder="e.g., 2024/2025"
          />

          <div className="flex gap-2">
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Saving...' : editingId ? 'Update' : 'Add'}
            </Button>
            <Button type="button" variant="secondary" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {erasmusAssignments.length === 0 ? (
        <div className="text-gray-400 text-center py-4">
          No erasmus assignments yet. Click &quot;Add Erasmus&quot; to add one.
        </div>
      ) : (
        <div className="space-y-3">
          {erasmusAssignments.map(erasmus => (
            <div 
              key={erasmus.id} 
              className="p-4 bg-gray-800 rounded-lg flex justify-between items-center"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-gray-200 font-medium">
                    {getUniversityName(erasmus.universityId)}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs text-white ${getStatusColor(erasmus.status)}`}>
                    {getStatusLabel(erasmus.status)}
                  </span>
                </div>
                <div className="text-sm text-gray-400">
                  Academic Year: {erasmus.year}
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => handleEdit(erasmus)}
                >
                  Edit
                </Button>
                <Button 
                  variant="danger" 
                  size="sm" 
                  onClick={() => handleDelete(erasmus.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}