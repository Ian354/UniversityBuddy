"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from "next/navigation";
import Navigation from "@/app/components/Navigation";
import CityForumSection from "@/app/components/CityForumSection";
import { City, Country } from '@/app/type/types';
import { Card, Button } from '@/app/ui';
import axios from 'axios';
import Link from 'next/dist/client/link';

export default function CityPage() {
    const { id } = useParams() as { id: string | undefined };
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const [country, setCountry] = useState<Country | null>(null);
    const [cities, setCities] = useState<City[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCountry = async () => {
            if (!id) return;

            try {
                setLoading(true);
                const response = await axios.get(`${apiUrl}/country/${id}`);
                setCountry(response.data);
            } catch (error) {
                console.error('Error fetching country:', error);
                setCountry(null);
            } finally {
                setLoading(false);
            }
        };

        const fetchCities = async () => {
            if (!id) return;

            try {
                setLoading(true);
                const response = await axios.get(`${apiUrl}/country/${id}/cities`);
                setCities(response.data);
            } catch (error) {
                console.error('Error fetching cities:', error);
                setCities([]);
            } finally {
                setLoading(false);
            }
        };

        fetchCountry();
        fetchCities();
    }, [id, apiUrl]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 text-gray-200">
                <Navigation />
                <div className="container mx-auto px-4 py-8">
                    <Card className="bg-gray-800 rounded-lg shadow-md p-6">
                        <div className="text-gray-400 text-center py-8">Loading city information...</div>
                    </Card>
                </div>
            </div>
        );
    }

    if (!country) {
        return (
            <div className="min-h-screen bg-gray-900 text-gray-200">
                <Navigation />
                <div className="container mx-auto px-4 py-8">
                    <Card className="bg-gray-800 rounded-lg shadow-md p-6">
                        <div className="text-gray-400 text-center py-8">Country not found</div>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200">
            <Navigation />
            <main className="container mx-auto px-4 py-8">
                <Card className="bg-gray-800 rounded-lg shadow-md p-6">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Left Column */}
                        <div className="flex-1">
                            {/* Header */}
                            <Card className="academic-card p-8 mb-8 bg-gray-700 rounded-lg">
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="text-5xl">🏙️</div>
                                            <div>
                                                <h1 className="text-4xl font-bold text-gray-100 mb-2">
                                                    {country.name}
                                                </h1>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Cities List */}
                            <div className="mb-8">
                                <h2 className="text-2xl font-semibold text-gray-100 mb-4">Cities</h2>
                                {cities.length === 0 ? (
                                    <div className="text-gray-400">No cities available for this country.</div>
                                ) : (
                                    <ul className="space-y-4">
                                        {cities.map((city) => (
                                            <li key={city.id} className="bg-gray-700 rounded-lg p-4 flex justify-between items-center">
                                                <span className="text-gray-200">{city.name}</span>
                                                <Link href={`/city/${city.id}`} passHref>
                                                    <Button className="btn btn-md rounded-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2">
                                                        See details
                                                    </Button>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="w-full lg:w-1/3">
                            <div className="bg-gray-700 rounded-lg p-6">
                                <h2 className="text-2xl font-semibold text-gray-100 mb-4">Forum</h2>
                                <CityForumSection cityId={parseInt(id || '0')} />
                            </div>
                        </div>
                    </div>
                </Card>
            </main>
        </div>
    );
}