'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input, Badge } from '@/app/ui';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:4000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        router.push('/user');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 flex items-center justify-center">
      <Card className="max-w-md w-full mx-auto p-8 bg-gray-800 rounded shadow">
      <h1 className="text-3xl font-bold text-gray-100 mb-6 text-center">Log In</h1>

      {error && (
        <Badge variant="danger" className="mb-4">
        {error}
        </Badge>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
        <label htmlFor="email" className="block text-gray-300 text-sm font-bold mb-2">
          Email
        </label>
        <Input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full"
          required
        />
        </div>

        <div className="mb-6">
        <label htmlFor="password" className="block text-gray-300 text-sm font-bold mb-2">
          Password
        </label>
        <Input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full"
          required
        />
        </div>

        <Button
        type="submit"
        disabled={loading}
        className="w-full"
        >
        {loading ? 'Logging in...' : 'Log In'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-400">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-blue-400 hover:text-blue-300">
          Register here
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