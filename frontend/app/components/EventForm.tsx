'use client';

import { useState, useEffect } from 'react';
import { Button, Input, Card } from '@/app/ui';
import { MentorshipGroup } from '@/app/type/types';
import axios from 'axios';

interface EventFormProps {
  mentorId: number;
  onSuccess?: () => void;
}

export default function EventForm({ mentorId, onSuccess }: EventFormProps) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mentorshipGroups, setMentorshipGroups] = useState<MentorshipGroup[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start: '',
    end: '',
    location: '',
    capacity: '',
    visibility: 'PUBLIC',
    groupId: ''
  });

  useEffect(() => {
    const fetchMentorshipGroups = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await axios.get(`${apiUrl}/mentorshipGroup/mentor/${mentorId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMentorshipGroups(response.data);
      } catch (err) {
        console.error('Error fetching mentorship groups:', err);
      }
    };

    fetchMentorshipGroups();
  }, [apiUrl, mentorId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axios.post(`${apiUrl}/event`, {
        ...formData,
        start: new Date(formData.start).toISOString(),
        end: new Date(formData.end).toISOString(),
        capacity: parseInt(formData.capacity),
        mentorId,
        visibility: formData.visibility,
        groupId: formData.groupId ? parseInt(formData.groupId) : null
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        start: '',
        end: '',
        location: '',
        capacity: '',
        visibility: 'PUBLIC',
        groupId: ''
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Error while creating event.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <Card title="Create New Event">
      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          placeholder="E.g. Group Mentoring Session"
        />

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="block w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            rows={3}
            placeholder="Describes the event..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Visibility
          </label>
          <select
            name="visibility"
            value={formData.visibility}
            onChange={handleChange}
            className="block w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          >
            <option value="PUBLIC">Public (Entire university)</option>
            <option value="PRIVATE">Private (Only my students)</option>
          </select>
        </div>

        {mentorshipGroups.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Mentorship Group (optional)
            </label>
            <select
              name="groupId"
              value={formData.groupId}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              <option value="">No specific group</option>
              {mentorshipGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-400">
              Assign this event to a specific mentorship group
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Start Date & Time"
            name="start"
            type="datetime-local"
            value={formData.start}
            onChange={handleChange}
            required
          />

          <Input
            label="End Date & Time"
            name="end"
            type="datetime-local"
            value={formData.end}
            onChange={handleChange}
            required
          />
        </div>

        <Input
          label="Location"
          name="location"
          value={formData.location}
          onChange={handleChange}
          required
          placeholder="E.g. Room 101, Building A"
        />

        <Input
          label="Capacity"
          name="capacity"
          type="number"
          value={formData.capacity}
          onChange={handleChange}
          required
          min="1"
          placeholder="Maximum number of attendees"
        />

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Creating...' : 'Create Event'}
        </Button>
      </form>
    </Card>
  );
}

export { EventForm };