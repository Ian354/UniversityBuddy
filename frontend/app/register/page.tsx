'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { University } from '@/app/type/types';
import { Card, Button, Badge } from '@/app/ui';
import axios from 'axios';
import Link from 'next/link';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
    role: 'FUTURE_STUDENT',
    university: '',
    erasmusUniversity: '',
    erasmusYear: '',
    erasmus: false,
    degree: '',
    openToContact: true
  });
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [universities, setUniversities] = useState<University[]>([]);
  const router = useRouter();

    // Fetch universities on component mount
    useEffect(() => {
        const fetchUniversities = async () => {
            try {
                const response = await axios.get(`${apiUrl}/university`);
                setUniversities(response.data);
            } catch (error) {
                console.error('Error fetching universities:', error);
            }
        };

        fetchUniversities();
    }, [apiUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...dataToSend } = formData;

      const response = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Redirect to profile page
        router.push('/user');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center py-8">
      <Card className="max-w-md w-full mx-auto p-8 bg-gray-800 rounded shadow">
      <h1 className="text-3xl font-bold text-gray-100 mb-6 text-center">Register</h1>

      {error && (
        <Badge variant="danger" className="mb-4">
        {error}
        </Badge>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
        <label htmlFor="email" className="block text-gray-300 text-sm font-bold mb-2">
          Email *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-gray-700 text-gray-100 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
          required
        />
        </div>

        <div className="mb-4">
        <label htmlFor="name" className="block text-gray-300 text-sm font-bold mb-2">
          Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-gray-700 text-gray-100 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
          required
        />
        </div>

        <div className="mb-4">
        <label htmlFor="password" className="block text-gray-300 text-sm font-bold mb-2">
          Password *
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-gray-700 text-gray-100 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
          required
        />
        </div>

        <div className="mb-4">
        <label htmlFor="confirmPassword" className="block text-gray-300 text-sm font-bold mb-2">
          Confirm Password *
        </label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-gray-700 text-gray-100 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
          required
        />
        </div>

        <div className="mb-4">
        <label htmlFor="role" className="block text-gray-300 text-sm font-bold mb-2">
          Role
        </label>
        <select
          id="role"
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-gray-700 text-gray-100 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
        >
          <option value="FUTURE_STUDENT">Future Student</option>
          <option value="STUDENT">Student</option>
          <option value="MENTOR">Mentor</option>
          <option value="FORMER_STUDENT">Former Student</option>
          <option value="ADMIN">Administrator</option>
        </select>
        </div>

        {formData.role !== 'FUTURE_STUDENT' && (
        <div className="mb-4">
          <label htmlFor="university" className="block text-gray-300 text-sm font-bold mb-2">
          University *
          </label>
          <select
          id="university"
          name="university"
          value={formData.university}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-gray-700 text-gray-100 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
          required={formData.role !== 'FUTURE_STUDENT'}
          >
          <option value="">Seleccione una universidad</option>
          {universities.map((university) => (
            <option key={university.id} value={university.id}>
            {university.name}
            </option>
          ))}
          </select>
        </div>
        )}

        {formData.role !== 'FUTURE_STUDENT' && (
        <div className="mb-4">
          <label htmlFor="degree" className="block text-gray-300 text-sm font-bold mb-2">
          Degree *
          </label>
          <input
          type="text"
          id="degree"
          name="degree"
          value={formData.degree}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-gray-700 text-gray-100 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
          required={formData.role === 'MENTOR'}
          />
        </div>
        )}

        <div className="mb-4">
        <label className="flex items-center text-gray-300">
          <input
          type="checkbox"
          name="erasmus"
          checked={formData.erasmus}
          onChange={handleChange}
          className="mr-2"
          />
          Erasmus Student
        </label>
        </div>

        {formData.erasmus && (
        <div className="mb-4">
          <label htmlFor="erasmusUniversity" className="block text-gray-300 text-sm font-bold mb-2">
          Erasmus University *
          </label>
          <select
          id="erasmusUniversity"
          name="erasmusUniversity"
          value={formData.erasmusUniversity}
          onChange={handleChange}
          className="w-full px-3 py-2 bg-gray-700 text-gray-100 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
          required={formData.role !== 'FUTURE_STUDENT'}
          >
          <option value="">Seleccione una universidad</option>
          {universities.map((university) => (
            <option key={university.id} value={university.id}>
            {university.name}
            </option>
          ))}
          </select>
        </div>
        )}

        <div className="mb-6">
        <label className="flex items-center text-gray-300">
          <input
          type="checkbox"
          name="openToContact"
          checked={formData.openToContact}
          onChange={handleChange}
          className="mr-2"
          />
          Open to Contact
        </label>
        </div>

        <Button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
        >
        {loading ? 'Registering...' : 'Register'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-400">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-400 hover:text-blue-300">
          Log in here
        </Link>
        </p>
        <Link href="/" className="text-gray-400 hover:text-gray-300 mt-2 block">
        Back to home
        </Link>
      </div>
      </Card>
    </main>
  );
}