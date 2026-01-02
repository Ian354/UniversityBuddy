'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from "@/app/components/Navigation";
import { Card, Button, Input, Badge } from '@/app/ui';
import { Country, City } from '@/app/type/types';

export default function AddUniversityPage() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const [user, setUser] = useState<{ id: number; role: string; name: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [countries, setCountries] = useState<Country[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [filteredCities, setFilteredCities] = useState<City[]>([]);
    const router = useRouter();

    // University form state
    const [universityName, setUniversityName] = useState('');
    const [selectedCountryId, setSelectedCountryId] = useState<number | ''>('');
    const [selectedCityId, setSelectedCityId] = useState<number | ''>('');
    const [isPublic, setIsPublic] = useState<boolean>(true);
    
    // New country form state
    const [showNewCountryForm, setShowNewCountryForm] = useState(false);
    const [newCountryName, setNewCountryName] = useState('');
    const [newCountryCode, setNewCountryCode] = useState('');
    
    // New city form state
    const [showNewCityForm, setShowNewCityForm] = useState(false);
    const [newCityName, setNewCityName] = useState('');
    const [newCityLatitude, setNewCityLatitude] = useState('');
    const [newCityLongitude, setNewCityLongitude] = useState('');
    const [newCityNorthSouth, setNewCityNorthSouth] = useState<'N' | 'S' | ''>('');
    const [newCityEastWest, setNewCityEastWest] = useState<'E' | 'W' | ''>('');

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchCountries = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`${apiUrl}/country`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setCountries(data);
            }
        } catch (err) {
            console.error('Error fetching countries:', err);
        }
    }, [apiUrl]);

    const fetchCities = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`${apiUrl}/city`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setCities(data);
            }
        } catch (err) {
            console.error('Error fetching cities:', err);
        }
    }, [apiUrl]);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const userData = JSON.parse(storedUser);
            setUser(userData);

            if (userData.role !== 'ADMIN') {
                router.push('/');
                return;
            }
        } else {
            router.push('/login');
            return;
        }
        setLoading(false);
    }, [router]);

    useEffect(() => {
        if (user?.role === 'ADMIN') {
            fetchCountries();
            fetchCities();
        }
    }, [user, fetchCountries, fetchCities]);

    useEffect(() => {
        if (selectedCountryId) {
            const filtered = cities.filter(city => city.countryId === selectedCountryId);
            setFilteredCities(filtered);
            // Reset city selection when country changes
            setSelectedCityId('');
        } else {
            setFilteredCities([]);
        }
    }, [selectedCountryId, cities]);

    const handleCreateCountry = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`${apiUrl}/country`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: newCountryName,
                    code: newCountryCode.toUpperCase()
                })
            });

            if (response.ok) {
                const newCountry = await response.json();
                setCountries([...countries, newCountry]);
                setSelectedCountryId(newCountry.id);
                setNewCountryName('');
                setNewCountryCode('');
                setShowNewCountryForm(false);
                setSuccess('Country created successfully!');
                setTimeout(() => setSuccess(''), 3000);
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to create country');
            }
        } catch (err) {
            console.error('Error creating country:', err);
            setError('Network error. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreateCity = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        if (!selectedCountryId) {
            setError('Please select a country first');
            setSubmitting(false);
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`${apiUrl}/city`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: newCityName,
                    countryId: selectedCountryId,
                    latitude: newCityLatitude ? parseFloat(newCityLatitude) : null,
                    longitude: newCityLongitude ? parseFloat(newCityLongitude) : null,
                    northSouth: newCityNorthSouth || null,
                    eastWest: newCityEastWest || null
                })
            });

            if (response.ok) {
                const newCity = await response.json();
                setCities([...cities, newCity]);
                setSelectedCityId(newCity.id);
                setNewCityName('');
                setNewCityLatitude('');
                setNewCityLongitude('');
                setNewCityNorthSouth('');
                setNewCityEastWest('');
                setShowNewCityForm(false);
                setSuccess('City created successfully!');
                setTimeout(() => setSuccess(''), 3000);
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to create city');
            }
        } catch (err) {
            console.error('Error creating city:', err);
            setError('Network error. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreateUniversity = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        if (!selectedCountryId || !selectedCityId) {
            setError('Please select both country and city');
            setSubmitting(false);
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`${apiUrl}/university`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: universityName,
                    countryId: selectedCountryId,
                    cityId: selectedCityId,
                    isPublic: isPublic
                })
            });

            if (response.ok) {
                setSuccess('University created successfully!');
                // Reset form
                setUniversityName('');
                setSelectedCountryId('');
                setSelectedCityId('');
                setIsPublic(true);
                setTimeout(() => {
                    setSuccess('');
                }, 3000);
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to create university');
            }
        } catch (err) {
            console.error('Error creating university:', err);
            setError('Network error. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-gray-900">
                <Navigation />
                <section className="max-w-7xl mx-auto mt-8 p-8">
                    <div className="text-gray-400 text-center py-8">Loading...</div>
                </section>
            </main>
        );
    }

    if (!user || user.role !== 'ADMIN') {
        return (
            <main className="min-h-screen bg-gray-900">
                <Navigation />
                <section className="max-w-7xl mx-auto mt-8 p-8">
                    <Card className="bg-gray-700 rounded-lg p-6">
                        <div className="text-gray-400 text-center py-8">
                            Only administrators can access this page.
                        </div>
                    </Card>
                </section>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-900">
            <Navigation />
            <section className="max-w-4xl mx-auto mt-8 p-4 md:p-8">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-100 mb-2">Add New University</h1>
                        <p className="text-gray-400">
                            Create a new university entry in the system
                        </p>
                    </div>
                    <Button 
                        variant="secondary" 
                        onClick={() => router.push('/admin')}
                    >
                        ← Back to Dashboard
                    </Button>
                </div>

                {success && (
                    <Badge variant="success" className="mb-4 w-full py-3 text-center block">
                        {success}
                    </Badge>
                )}

                {error && (
                    <Badge variant="danger" className="mb-4 w-full py-3 text-center block">
                        {error}
                    </Badge>
                )}

                <Card title="University Details">
                    <form onSubmit={handleCreateUniversity}>
                        <div className="space-y-6">
                            {/* University Name */}
                            <div>
                                <Input
                                    label="University Name *"
                                    type="text"
                                    value={universityName}
                                    onChange={(e) => setUniversityName(e.target.value)}
                                    placeholder="e.g., Universidad Complutense de Madrid"
                                    required
                                />
                            </div>

                            {/* Country Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Country *
                                </label>
                                <div className="flex gap-2">
                                    <select
                                        value={selectedCountryId}
                                        onChange={(e) => setSelectedCountryId(e.target.value ? Number(e.target.value) : '')}
                                        required
                                        className="flex-1 p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select a country...</option>
                                        {countries.map(country => (
                                            <option key={country.id} value={country.id}>
                                                {country.name} ({country.code})
                                            </option>
                                        ))}
                                    </select>
                                    <Button
                                        type="button"
                                        variant="success"
                                        onClick={() => setShowNewCountryForm(!showNewCountryForm)}
                                    >
                                        {showNewCountryForm ? 'Cancel' : '+ New Country'}
                                    </Button>
                                </div>
                            </div>

                            {/* New Country Form */}
                            {showNewCountryForm && (
                                <Card className="bg-gray-600 border border-gray-500">
                                    <h3 className="text-lg font-semibold text-gray-100 mb-4">Add New Country</h3>
                                    <form onSubmit={handleCreateCountry} className="space-y-4">
                                        <Input
                                            label="Country Name *"
                                            type="text"
                                            value={newCountryName}
                                            onChange={(e) => setNewCountryName(e.target.value)}
                                            placeholder="e.g., Spain"
                                            required
                                        />
                                        <Input
                                            label="Country Code (ISO 2) *"
                                            type="text"
                                            value={newCountryCode}
                                            onChange={(e) => setNewCountryCode(e.target.value.toUpperCase())}
                                            placeholder="e.g., ES"
                                            maxLength={2}
                                            required
                                        />
                                        <Button 
                                            type="submit" 
                                            variant="success" 
                                            disabled={submitting}
                                            className="w-full"
                                        >
                                            {submitting ? 'Creating...' : 'Create Country'}
                                        </Button>
                                    </form>
                                </Card>
                            )}

                            {/* City Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    City *
                                </label>
                                <div className="flex gap-2">
                                    <select
                                        value={selectedCityId}
                                        onChange={(e) => setSelectedCityId(e.target.value ? Number(e.target.value) : '')}
                                        required
                                        disabled={!selectedCountryId}
                                        className="flex-1 p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <option value="">
                                            {selectedCountryId ? 'Select a city...' : 'Select a country first'}
                                        </option>
                                        {filteredCities.map(city => (
                                            <option key={city.id} value={city.id}>
                                                {city.name}
                                            </option>
                                        ))}
                                    </select>
                                    <Button
                                        type="button"
                                        variant="success"
                                        onClick={() => setShowNewCityForm(!showNewCityForm)}
                                        disabled={!selectedCountryId}
                                    >
                                        {showNewCityForm ? 'Cancel' : '+ New City'}
                                    </Button>
                                </div>
                                {!selectedCountryId && (
                                    <p className="text-sm text-yellow-400 mt-1">
                                        Please select a country first to enable city selection
                                    </p>
                                )}
                            </div>

                            {/* New City Form */}
                            {showNewCityForm && selectedCountryId && (
                                <Card className="bg-gray-600 border border-gray-500">
                                    <h3 className="text-lg font-semibold text-gray-100 mb-4">Add New City</h3>
                                    <form onSubmit={handleCreateCity} className="space-y-4">
                                        <Input
                                            label="City Name *"
                                            type="text"
                                            value={newCityName}
                                            onChange={(e) => setNewCityName(e.target.value)}
                                            placeholder="e.g., Madrid"
                                            required
                                        />
                                        <div className="grid grid-cols-2 gap-4">
                                            <Input
                                                label="Latitude (optional)"
                                                type="number"
                                                step="any"
                                                value={newCityLatitude}
                                                onChange={(e) => setNewCityLatitude(e.target.value)}
                                                placeholder="e.g., 40.4168"
                                            />
                                            <Input
                                                label="Longitude (optional)"
                                                type="number"
                                                step="any"
                                                value={newCityLongitude}
                                                onChange={(e) => setNewCityLongitude(e.target.value)}
                                                placeholder="e.g., -3.7038"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                                    North/South (optional)
                                                </label>
                                                <select
                                                    value={newCityNorthSouth}
                                                    onChange={(e) => setNewCityNorthSouth(e.target.value as 'N' | 'S' | '')}
                                                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="">Select...</option>
                                                    <option value="N">North (N)</option>
                                                    <option value="S">South (S)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                                    East/West (optional)
                                                </label>
                                                <select
                                                    value={newCityEastWest}
                                                    onChange={(e) => setNewCityEastWest(e.target.value as 'E' | 'W' | '')}
                                                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="">Select...</option>
                                                    <option value="E">East (E)</option>
                                                    <option value="W">West (W)</option>
                                                </select>
                                            </div>
                                        </div>
                                        <Button 
                                            type="submit" 
                                            variant="success" 
                                            disabled={submitting}
                                            className="w-full"
                                        >
                                            {submitting ? 'Creating...' : 'Create City'}
                                        </Button>
                                    </form>
                                </Card>
                            )}

                            {/* University Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    University Type *
                                </label>
                                <div className="flex gap-4">
                                    <label className="flex items-center text-gray-300 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="universityType"
                                            checked={isPublic === true}
                                            onChange={() => setIsPublic(true)}
                                            className="mr-2"
                                        />
                                        Public
                                    </label>
                                    <label className="flex items-center text-gray-300 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="universityType"
                                            checked={isPublic === false}
                                            onChange={() => setIsPublic(false)}
                                            className="mr-2"
                                        />
                                        Private
                                    </label>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-4 border-t border-gray-600">
                                <Button 
                                    type="submit" 
                                    variant="primary" 
                                    disabled={submitting || !universityName || !selectedCountryId || !selectedCityId}
                                    className="w-full text-lg py-3"
                                >
                                    {submitting ? 'Creating University...' : 'Create University'}
                                </Button>
                            </div>
                        </div>
                    </form>
                </Card>
            </section>
        </main>
    );
}