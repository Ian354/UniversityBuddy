"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from "next/navigation";
import Navigation from "@/app/components/Navigation";
import CityForumSection from "@/app/components/CityForumSection";
import { City, University } from '@/app/type/types';
import { Card, Button } from '@/app/ui';
import axios from 'axios';

export default function CityPage() {
    const { id } = useParams() as { id: string | undefined };
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const [city, setCity] = useState<City | null>(null);
    const [universities, setUniversities] = useState<University[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCity = async () => {
            if (!id) return;

            try {
                setLoading(true);
                const response = await axios.get(`${apiUrl}/city/${id}`);
                setCity(response.data);
            } catch (error) {
                console.error('Error fetching city:', error);
                setCity(null);
            } finally {
                setLoading(false);
            }
        };

        const fetchUniversities = async () => {
            if (!id) return;

            try {
                setLoading(true);
                const response = await axios.get(`${apiUrl}/city/${id}/universities`);
                setUniversities(response.data);
            } catch (error) {
                console.error('Error fetching universities:', error);
                setUniversities([]);
            } finally {
                setLoading(false);
            }
        };
        fetchUniversities();
        fetchCity();
    }, [id, apiUrl]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 text-gray-200">
                <Navigation />
                <div className="container mx-auto px-4 py-8">
                    <Card className="bg-gray-800 rounded-lg shadow-md p-6">
                        <div className="text-gray-400 text-center py-8">Loading university information...</div>
                    </Card>
                </div>
            </div>
        );
    }

    if (!city) {
        return (
            <div className="min-h-screen bg-gray-900 text-gray-200">
                <Navigation />
                <div className="container mx-auto px-4 py-8">
                    <Card className="bg-gray-800 rounded-lg shadow-md p-6">
                        <div className="text-gray-400 text-center py-8">City not found</div>
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
                    {/* Header */}
                    <Card className="academic-card p-8 mb-8 bg-gray-700 rounded-lg">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="text-5xl">🏙️</div>
                                    <div>
                                        <h1 className="text-4xl font-bold text-gray-100 mb-2">
                                            {city.name}
                                        </h1>
                                        <div className="flex items-center space-x-4 text-gray-400">
                                            <span className="text-xl">{city.country?.name}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

                        {/* Map */}
                        <Card className="academic-card bg-gray-700 rounded-lg p-6">
                            <div className="card-header mb-4 text-center">
                                <h2 className="card-title text-xl font-bold text-gray-100">
                                    <span>Location</span>
                                </h2>
                            </div>
                            <div className="card-content">
                                {city.latitude && city.longitude ? (
                                    <div className="space-y-4">
                                        <div className="aspect-video bg-gray-600 rounded-lg overflow-hidden">
                                            <iframe
                                                width="100%"
                                                height="100%"
                                                frameBorder="0"
                                                style={{ border: 0 }}
                                                src={`https://www.openstreetmap.org/export/embed.html?bbox=${city.longitude - 0.1},${city.latitude - 0.1},${city.longitude + 0.1},${city.latitude + 0.1}&layer=mapnik&marker=${city.latitude},${city.longitude}`}
                                                allowFullScreen
                                            />
                                        </div>
                                        <div className="text-center">
                                            <a
                                                href={`https://www.openstreetmap.org/?mlat=${city.latitude}&mlon=${city.longitude}#map=12/${city.latitude}/${city.longitude}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-400 hover:text-blue-300"
                                            >
                                                Ver mapa más grande
                                            </a>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-gray-400 text-center py-8">
                                        <p className="mb-4">Coordinates not available</p>
                                        <a
                                            href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(city.name + ', ' + city.country)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-block"
                                        >
                                            <Button className="btn btn-sm rounded-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2">
                                                Search on OpenStreetMap
                                            </Button>
                                        </a>
                                    </div>
                                )}
                            </div>
                        </Card>
                        <CityForumSection cityId={parseInt(id || '0')} />
                    </div>

                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                        <Card className="academic-card bg-gray-700 rounded-lg p-6 col-span-full">
                            <div className="card-header mb-4 text-center">
                                <h2 className="card-title text-xl font-bold text-gray-100">Universities in {city.name}</h2>
                            </div>
                            <div className="card-content">
                                {universities.length === 0 ? (
                                    <div className="text-gray-400 text-center py-8">
                                        <p className="mb-4">No universities found</p>
                                    </div>
                                ) : (
                                    <ul className="space-y-4">
                                        {universities.map((university) => (
                                            <li key={university.id} className="bg-gray-600 rounded-lg p-4">
                                                <h3 className="text-lg font-semibold text-gray-100">{university.name}</h3>
                                                <div className="mt-2">
                                                    <a
                                                        href={`/university/${university.id}`}
                                                        className="text-blue-400 hover:text-blue-300"
                                                    >
                                                        <Button className="btn btn-sm rounded-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2">
                                                            View University
                                                        </Button>
                                                    </a>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </Card>
                    </div>
                </Card>
            </main>
        </div>
    );
}