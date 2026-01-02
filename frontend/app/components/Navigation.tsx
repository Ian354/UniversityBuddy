'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { Badge, Button } from '@/app/ui';

export default function Navigation() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [userRole, setUserRole] = useState('');
    const router = useRouter();

    useEffect(() => {
        // Check if user is authenticated
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');

        if (token && user) {
            setIsAuthenticated(true);
            try {
                const userData = JSON.parse(user);
                setUserEmail(userData.email);
                setUserRole(userData.role);
            } catch (e) {
                // If parsing fails, clear invalid data
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }

    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setUserEmail('');
        setUserRole('');
        router.push('/');
    };

    return (
        <nav className="bg-gray-800 shadow p-4 mb-8 flex justify-between items-center">
            <div className="flex gap-6 text-lg font-medium">
                {isAuthenticated && (
                    <Link href="/" className="text-gray-300 hover:text-white">Home</Link>
                )}
                <Link href="/university" className="text-gray-300 hover:text-white">University finder</Link>
                {isAuthenticated && (
                    <Link href="/mentor" className="text-gray-300 hover:text-white">Mentorships</Link>
                )}
                {isAuthenticated && (
                    <Link href="/user" className="text-gray-300 hover:text-white">User Profile</Link>
                )}
                {isAuthenticated && (
                    <Link href="/erasmus" className="text-gray-300 hover:text-white">Erasmus Help</Link>
                )}
                {isAuthenticated && userRole === 'ADMIN' && (
                    <Link href="/admin" className="text-gray-300 hover:text-white">Admin Dashboard</Link>
                )}
            </div>

            <div className="flex items-center gap-4">
                {isAuthenticated ? (
                    <div className="flex items-center gap-4">
                        <Badge variant="default" className="text-sm">
                            {userEmail}
                        </Badge>
                        <Button
                            onClick={handleLogout}
                            variant="danger"
                            size="sm"
                        >
                            Logout
                        </Button>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <Link 
                            href="/login" 
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                        >
                            Login
                        </Link>
                        <Link 
                            href="/register" 
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                        >
                            Register
                        </Link>
                    </div>
                )}
            </div>
        </nav>
    );
}