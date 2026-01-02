'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from "../components/Navigation";
import { Card, Button } from '@/app/ui';
import { University, City, Country } from '@/app/type/types';

interface ErasmusContact {
  id: number;
  userId: number;
  universityId: number;
  status: string;
  year: string;
  academicYear?: string;
  duration?: string;
  shareInfo: boolean;
  user: {
    id: number;
    name: string;
    email: string;
    degree?: string;
    universityId?: number;
    university?: {
      id: number;
      name: string;
      cityId: number;
      countryId: number;
      city?: {
        id: number;
        name: string;
      };
      country?: {
        id: number;
        name: string;
        code: string;
      };
    };
  };
  university: {
    id: number;
    name: string;
  };
}

export default function ErasmusHelpPage() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [contacts, setContacts] = useState<ErasmusContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  
  // Filter states
  const [selectedUniversityId, setSelectedUniversityId] = useState<string>('');
  const [selectedCityId, setSelectedCityId] = useState<string>('');
  const [selectedCountryId, setSelectedCountryId] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [filterByCity, setFilterByCity] = useState(false);
  const [filterByCountry, setFilterByCountry] = useState(false);
  const [filterByYear, setFilterByYear] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = localStorage.getItem('token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

        if (!token) {
          router.push('/login');
          return;
        }

        // Fetch current user profile
        const userResponse = await fetch(`${apiUrl}/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (userResponse.ok) {
          const data = await userResponse.json();
          
          // Pre-select city/country based on user's university (their "home" location)
          // These values will be used when the user enables the respective filters
          if (data.user.university?.cityId) {
            setSelectedCityId(data.user.university.cityId.toString());
          }
          if (data.user.university?.countryId) {
            setSelectedCountryId(data.user.university.countryId.toString());
          }
        } else if (userResponse.status === 401 || userResponse.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/login');
          return;
        }

        // Fetch universities
        const universitiesResponse = await fetch(`${apiUrl}/university`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (universitiesResponse.ok) {
          const universitiesData = await universitiesResponse.json();
          setUniversities(universitiesData);
        }

        // Fetch cities
        const citiesResponse = await fetch(`${apiUrl}/city`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (citiesResponse.ok) {
          const citiesData = await citiesResponse.json();
          setCities(citiesData);
        }

        // Fetch countries
        const countriesResponse = await fetch(`${apiUrl}/country`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (countriesResponse.ok) {
          const countriesData = await countriesResponse.json();
          setCountries(countriesData);
        }

      } catch (err) {
        console.error('Error loading data:', err);
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [router]);

  const handleSearch = async () => {
    if (!selectedUniversityId) {
      setError('Please select an Erasmus university to search');
      return;
    }

    setSearching(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      
      // Build query params
      let queryParams = `universityId=${selectedUniversityId}`;
      
      if (filterByCity && selectedCityId) {
        queryParams += `&cityId=${selectedCityId}`;
      }
      
      if (filterByCountry && selectedCountryId) {
        queryParams += `&countryId=${selectedCountryId}`;
      }

      if (filterByYear && selectedYear) {
        queryParams += `&year=${encodeURIComponent(selectedYear)}`;
      }

      const response = await fetch(`${apiUrl}/erasmus/contacts?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setContacts(data);
      } else {
        setError('Failed to fetch contacts');
      }
    } catch (err) {
      console.error('Error searching contacts:', err);
      setError('Network error. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-900">
        <Navigation />
        <section className="max-w-6xl mx-auto mt-8 p-8 bg-gray-800 rounded shadow">
          <div className="text-center text-gray-300">Loading...</div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900">
      <Navigation />
      <section className="max-w-6xl mx-auto mt-8 p-4 md:p-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-100 mb-2">Erasmus Help</h2>
          <p className="text-gray-400">
            Find students who went to or are going to the same Erasmus university, and are from your city or country
          </p>
        </div>

        {error && (
          <div className="bg-red-600 text-white p-3 rounded mb-4">
            {error}
          </div>
        )}

        <Card title="Search Filters">
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 font-medium mb-2">
                Erasmus University <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedUniversityId}
                onChange={(e) => setSelectedUniversityId(e.target.value)}
                className="w-full p-2 bg-gray-700 text-gray-200 border border-gray-600 rounded"
              >
                <option value="">Select a university...</option>
                {universities.map((uni) => (
                  <option key={uni.id} value={uni.id}>
                    {uni.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="filterByCity"
                checked={filterByCity}
                onChange={(e) => setFilterByCity(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="filterByCity" className="text-gray-300">
                Filter by home city
              </label>
            </div>

            {filterByCity && (
              <div>
                <label className="block text-gray-300 font-medium mb-2">
                  Home City
                </label>
                <select
                  value={selectedCityId}
                  onChange={(e) => setSelectedCityId(e.target.value)}
                  className="w-full p-2 bg-gray-700 text-gray-200 border border-gray-600 rounded"
                >
                  <option value="">Select a city...</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="filterByCountry"
                checked={filterByCountry}
                onChange={(e) => setFilterByCountry(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="filterByCountry" className="text-gray-300">
                Filter by home country
              </label>
            </div>

            {filterByCountry && (
              <div>
                <label className="block text-gray-300 font-medium mb-2">
                  Home Country
                </label>
                <select
                  value={selectedCountryId}
                  onChange={(e) => setSelectedCountryId(e.target.value)}
                  className="w-full p-2 bg-gray-700 text-gray-200 border border-gray-600 rounded"
                >
                  <option value="">Select a country...</option>
                  {countries.map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="filterByYear"
                checked={filterByYear}
                onChange={(e) => setFilterByYear(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="filterByYear" className="text-gray-300">
                Filter by erasmus year
              </label>
            </div>

            {filterByYear && (
              <div>
                <label className="block text-gray-300 font-medium mb-2">
                  Erasmus Year
                </label>
                <input
                  type="text"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  placeholder="e.g., 2024/2025"
                  className="w-full p-2 bg-gray-700 text-gray-200 border border-gray-600 rounded"
                />
              </div>
            )}

            <Button
              onClick={handleSearch}
              variant="primary"
              size="md"
              disabled={searching || !selectedUniversityId}
            >
              {searching ? 'Searching...' : 'Search Contacts'}
            </Button>
          </div>
        </Card>

        {contacts.length > 0 && (
          <Card title={`Found ${contacts.length} Contact${contacts.length !== 1 ? 's' : ''}`} className="mt-6">
            <div className="space-y-4">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="p-4 bg-gray-700 rounded border border-gray-600"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-100">
                        {contact.user.name}
                      </h3>
                      <p className="text-gray-400 text-sm">{contact.user.email}</p>
                    </div>
                    <span className={`px-3 py-1 rounded text-sm ${
                      contact.status === 'approved' || contact.status === 'ACTIVE'
                        ? 'bg-green-600 text-white'
                        : 'bg-yellow-600 text-white'
                    }`}>
                      {contact.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-300 text-sm">
                    {contact.user.degree && (
                      <div>
                        <span className="font-medium text-gray-400">Degree:</span>{' '}
                        {contact.user.degree}
                      </div>
                    )}
                    
                    {contact.academicYear && (
                      <div>
                        <span className="font-medium text-gray-400">Academic Year:</span>{' '}
                        {contact.academicYear}
                      </div>
                    )}
                    
                    {contact.duration && (
                      <div>
                        <span className="font-medium text-gray-400">Duration:</span>{' '}
                        {contact.duration.replace('_', ' ')}
                      </div>
                    )}
                    
                    {contact.user.university?.city && (
                      <div>
                        <span className="font-medium text-gray-400">From:</span>{' '}
                        {contact.user.university.city.name}
                        {contact.user.university?.country && `, ${contact.user.university.country.name}`}
                      </div>
                    )}

                    {contact.user.university?.name && (
                      <div>
                        <span className="font-medium text-gray-400">Home University:</span>{' '}
                        {contact.user.university.name}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {contacts.length === 0 && selectedUniversityId && !searching && (
          <div className="mt-6 p-6 bg-gray-800 rounded text-center text-gray-400">
            No contacts found matching your criteria. Try adjusting your filters.
          </div>
        )}
      </section>
    </main>
  );
}