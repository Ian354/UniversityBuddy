"use client";
import React, { useState} from "react";
import Navigation from "../components/Navigation";
import UniCards from "../components/UniCards";

import { University, Country, City } from "@/app/type/types";
import { Button, Input, Card, StarRating } from "@/app/ui";

export default function UniversitySearch() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const [universities, setUniversities] = useState<University[]>([]);
    const [countries, setCountries] = useState<Country[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [loading, setLoading] = useState(false);
    const [showRatingFilters, setShowRatingFilters] = useState(false);
    const [searchParams, setSearchParams] = useState({
        name: "",
        cityId: "",
        countryId: "",
        minOverall: "",
        maxOverall: "",
        minInstallations: "",
        maxInstallations: "",
        minUniLife: "",
        maxUniLife: "",
        minAccommodation: "",
        maxAccommodation: "",
        minAcademicLevel: "",
        maxAcademicLevel: "",
        minActivities: "",
        maxActivities: "",
    });

    const fetchUniversities = async () => {
        setLoading(true);
        const query = new URLSearchParams(
            Object.entries(searchParams).filter(([_, value]) => value)
        ).toString();
        console.log(`${apiUrl}/university/search?${query}`); // Debug log
        const response = await fetch(`${apiUrl}/university/search?${query}`);
        const data = await response.json();
        setUniversities(data);
        setLoading(false);
    };

    const fetchCountries = async () => {
        const response = await fetch(`${apiUrl}/country`);
        const data = await response.json();
        setCountries(data);
    };

    const fetchCities = async () => {
        const response = await fetch(`${apiUrl}/city`);
        const data = await response.json();
        setCities(data);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setSearchParams((prev) => ({ ...prev, [name]: value }));
    };

    const handleSearch = () => {
        fetchUniversities();
    };

    React.useEffect(() => {
        fetchCountries();
        fetchCities();
    }, []);

    return (
        <main className="min-h-screen bg-gray-900 text-gray-100">
            <Navigation />
                <section className="max-w-3xl mx-auto mt-8 p-8">
                <Card title="National University Search">
                    <p className="text-gray-400 mb-6">
                        Filter universities by name, city, country, and ratings.
                    </p>
                    <div className="space-y-4 mb-6">
                        <Input
                            type="text"
                            name="name"
                            placeholder="Name"
                            value={searchParams.name}
                            onChange={handleInputChange}
                        />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <select
                            name="cityId"
                            value={searchParams.cityId}
                            onChange={handleInputChange}
                            className="bg-gray-800 text-gray-300 rounded-md p-2"
                        >
                            <option value="">Select a city</option>
                            {cities.map((city) => (
                                <option key={city.id} value={city.id}>
                                    {city.name}
                                </option>
                            ))}
                        </select>
                        <select
                            name="countryId"
                            value={searchParams.countryId}
                            onChange={handleInputChange}
                            className="bg-gray-800 text-gray-300 rounded-md p-2"
                        >
                            <option value="">Select a country</option>
                            {countries.map((country) => (
                                <option key={country.id} value={country.id}>
                                    {country.name}
                                </option>
                            ))}
                        </select>
                    </div>
                        {/* Rating Filters Section */}
                        <div className="border-t border-gray-600 pt-4 mt-4">
                            <button
                                type="button"
                                onClick={() => setShowRatingFilters(!showRatingFilters)}
                                className="flex items-center justify-between w-full text-left text-gray-300 hover:text-gray-100 transition-colors"
                                aria-expanded={showRatingFilters}
                                aria-label="Toggle rating filters"
                            >
                                <span className="font-medium">Rating Filters</span>
                                <span className="text-xl" aria-hidden="true">{showRatingFilters ? '▲' : '▼'}</span>
                            </button>

                            {showRatingFilters && (
                                <div className="mt-4 space-y-4">
                                    {/* Overall Rating */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Overall Rating
                                        </label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Input
                                                type="number"
                                                name="minOverall"
                                                placeholder="Minimum (0-5)"
                                                min="0"
                                                max="5"
                                                step="0.1"
                                                value={searchParams.minOverall}
                                                onChange={handleInputChange}
                                            />
                                            <Input
                                                type="number"
                                                name="maxOverall"
                                                placeholder="Maximum (0-5)"
                                                min="0"
                                                max="5"
                                                step="0.1"
                                                value={searchParams.maxOverall}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>

                                    {/* Installations Rating */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Installations
                                        </label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Input
                                                type="number"
                                                name="minInstallations"
                                                placeholder="Minimum (0-5)"
                                                min="0"
                                                max="5"
                                                step="0.1"
                                                value={searchParams.minInstallations}
                                                onChange={handleInputChange}
                                            />
                                            <Input
                                                type="number"
                                                name="maxInstallations"
                                                placeholder="Maximum (0-5)"
                                                min="0"
                                                max="5"
                                                step="0.1"
                                                value={searchParams.maxInstallations}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>

                                    {/* University Life Rating */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            University Life
                                        </label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Input
                                                type="number"
                                                name="minUniLife"
                                                placeholder="Minimum (0-5)"
                                                min="0"
                                                max="5"
                                                step="0.1"
                                                value={searchParams.minUniLife}
                                                onChange={handleInputChange}
                                            />
                                            <Input
                                                type="number"
                                                name="maxUniLife"
                                                placeholder="Maximum (0-5)"
                                                min="0"
                                                max="5"
                                                step="0.1"
                                                value={searchParams.maxUniLife}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>

                                    {/* Accommodation Rating */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Accommodation
                                        </label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Input
                                                type="number"
                                                name="minAccommodation"
                                                placeholder="Minimum (0-5)"
                                                min="0"
                                                max="5"
                                                step="0.1"
                                                value={searchParams.minAccommodation}
                                                onChange={handleInputChange}
                                            />
                                            <Input
                                                type="number"
                                                name="maxAccommodation"
                                                placeholder="Maximum (0-5)"
                                                min="0"
                                                max="5"
                                                step="0.1"
                                                value={searchParams.maxAccommodation}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>

                                    {/* Academic Level Rating */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Academic Level
                                        </label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Input
                                                type="number"
                                                name="minAcademicLevel"
                                                placeholder="Minimum (0-5)"
                                                min="0"
                                                max="5"
                                                step="0.1"
                                                value={searchParams.minAcademicLevel}
                                                onChange={handleInputChange}
                                            />
                                            <Input
                                                type="number"
                                                name="maxAcademicLevel"
                                                placeholder="Maximum (0-5)"
                                                min="0"
                                                max="5"
                                                step="0.1"
                                                value={searchParams.maxAcademicLevel}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>

                                    {/* Activities Rating */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Activities
                                        </label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Input
                                                type="number"
                                                name="minActivities"
                                                placeholder="Minimum (0-5)"
                                                min="0"
                                                max="5"
                                                step="0.1"
                                                value={searchParams.minActivities}
                                                onChange={handleInputChange}
                                            />
                                            <Input
                                                type="number"
                                                name="maxActivities"
                                                placeholder="Maximum (0-5)"
                                                min="0"
                                                max="5"
                                                step="0.1"
                                                value={searchParams.maxActivities}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-center mt-6">
                            <Button
                                onClick={handleSearch}
                                variant="primary"
                                disabled={loading}
                            >
                                {loading ? 'Searching...' : 'Search'}
                            </Button>
                        </div>
                    </div>
                </Card>
            </section>
            <section className="max-w-3xl mx-auto mt-8 p-8">
                <Card>
                    {universities.length === 0 && loading ? (
                        <p className="text-gray-400 text-center">No universities found.</p>
                    ) : (
                        universities.length > 0 && (
                            <UniCards universities={universities} />
                        )
                    )}
                </Card>
            </section>
        </main>
    );
}