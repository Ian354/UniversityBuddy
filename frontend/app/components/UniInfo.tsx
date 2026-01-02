"use client";
import React from 'react';
import { University, RatingAggregate } from '@/app/type/types';
import { useEffect, useState } from 'react';
import { Card, Button, Badge, StarRating } from '@/app/ui';
import UniRatingForm from '@/app/components/UniRatingForm';
import ForumSection from '@/app/components/ForumSection'
import axios from 'axios';
import Link from 'next/link';

const UniInfo: React.FC<{ id: string }> = ({ id }) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const [university, setUniversity] = useState<University | null>(null);
    const [country, setCountry] = useState<{ id: number; name: string } | null>(null);
    const [city, setCity] = useState<{ id: number; name: string } | null>(null);
    const [ratings, setRatings] = useState<RatingAggregate | null>(null);
    const [mentors, setMentors] = useState<{ id: number; name: string }[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const universityResponse = await axios.get(`${apiUrl}/university/${id}`);
                setUniversity(universityResponse.data);

                const ratingsResponse = await axios.get(`${apiUrl}/review/university/${id}/averages`);
                setRatings(ratingsResponse.data);

                const countryResponse = await axios.get(`${apiUrl}/country/${universityResponse.data.countryId}`);
                setCountry(countryResponse.data);

                const cityResponse = await axios.get(`${apiUrl}/city/${universityResponse.data.cityId}`);
                setCity(cityResponse.data);

                const mentorsResponse = await axios.get(`${apiUrl}/users/university/${id}?role=MENTOR`);
                const mentors = mentorsResponse.data.map((mentor: { id: number; name: string; }) => ({
                    id: mentor.id,
                    name: mentor.name,
                }));
                setMentors(mentors);

            } catch (error) {
                if (axios.isAxiosError(error) && error.response?.status === 404) {
                    setUniversity(null);
                    setRatings(null);
                } else {
                    console.error("Error fetching data:", error);
                    setUniversity(null);
                    setRatings(null);
                }
            }
        };
        fetchData();
    }, [id, apiUrl]);

    const [showRatingModal, setShowRatingModal] = useState<boolean>(false);

    if (!university) {
        return <div>Error loading university data.</div>;
    }

    return (
        <main className="container mx-auto px-4 py-8">
            <Card className="bg-gray-800 rounded-lg shadow-md p-6">
            {/* Header */}
            <Card className="academic-card p-8 mb-8 bg-gray-700 rounded-lg">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                    <div className="text-5xl">🏛️</div>
                    <div>
                        <h1 className="text-4xl font-bold text-gray-100 mb-2">
                        {university.name}
                        </h1>
                        <div className="flex items-center space-x-4 text-gray-400">
                        <Badge
                            className={`${
                            university.isPublic
                                ? "bg-green-900 text-green-300"
                                : "bg-blue-900 text-blue-300"
                            }`}
                        >
                            {university.isPublic ? "Pública" : "Privada"}
                        </Badge>
                        </div>
                    </div>
                    </div>

                    <div className="flex items-center space-x-1 mb-4">
                    <span className="icon-star h-5 w-5 fill-yellow-400 text-yellow-400" />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 text-center lg:w-1/2">
                    <Card className="p-4 bg-gray-600 rounded-lg">
                        <span className="icon-users h-6 w-6 text-gray-300 mx-auto mb-2" />
                        <div className="flex flex-col items-center">
                            <StarRating rating={ratings?.overallAvg || 0} />
                            <span className="text-gray-400 mt-2">General Rating</span>
                        </div>
                    </Card>
                    <Button
                        className="btn btn-md rounded-full bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 mt-4"
                        onClick={() => setShowRatingModal(true)}
                    >
                        Rate University
                    </Button>
                </div>

                {showRatingModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
                            <UniRatingForm
                                universityId={id}
                                onClose={() => setShowRatingModal(false)}
                            />
                        </div>
                    </div>
                )}
                </div>
            </Card>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="academic-card bg-gray-700 rounded-lg p-6">
                <div className="card-header mb-4 text-center">
                    <h2 className="card-title text-xl font-bold text-gray-100">
                    <span>Basic Information</span>
                    </h2>
                </div>
                <div className="card-content space-y-4">
                    <div className="flex justify-between">
                    <span className="text-gray-400">City:</span>
                    {city ? (
                        <Link href={`/city/${city.id}`} passHref>
                            <Button className="btn btn-md rounded-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2">
                                {city?.name} 🏙️
                            </Button>
                        </Link>
                    ) : (
                        <span className="font-semibold">Info Unavailable</span>
                    )}
                    </div>
                    <div className="flex justify-between">
                    <span className="text-gray-400">Country:</span>
                    {country ? (
                        <Link href={`/country/${country.id}`} passHref>
                            <Button className="btn btn-md rounded-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2">
                                {country?.name} 🌍
                            </Button>
                        </Link>
                    ) : (
                        <span className="font-semibold">Info Unavailable</span>
                    )}
                    </div>
                    <hr className="border-gray-600" />
                    <div className="space-y-2">
                    <h4 className="font-semibold text-gray-100">Mentors</h4>
                    <div className="space-y-2 text-sm">
                        {mentors.map((mentor) => (
                        <div key={mentor.id} className="flex justify-between items-center">
                            <span>{mentor.name}</span>
                            <Link href={`/mentor/profile/${mentor.id}`} passHref>
                            <Button className="btn btn-md rounded-full bg-blue-600 hover:bg-blue-500 text-white px-6 py-2">
                                View Profile
                            </Button>
                            </Link>
                        </div>
                        ))}
                    </div>
                    </div>
                </div>
                </Card>

                <Card className="academic-card bg-gray-700 rounded-lg p-6">
                <div className="card-header mb-4 text-center">
                    <h2 className="card-title text-xl font-bold text-gray-100">
                    <span>Ratings</span>
                    </h2>
                </div>
                <div className="card-content space-y-4">
                    {ratings ? (
                    <>
                        <div className="flex justify-between items-center">
                        <span className="text-gray-400">Overall Rating:</span>
                        <StarRating rating={ratings.overallAvg || 0} />
                        </div>
                        <div className="flex justify-between items-center">
                        <span className="text-gray-400">Facilities:</span>
                        <StarRating rating={ratings.installationsAvg || 0} />
                        </div>
                        <div className="flex justify-between items-center">
                        <span className="text-gray-400">University Life:</span>
                        <StarRating rating={ratings.uniLifeAvg || 0} />
                        </div>
                        <div className="flex justify-between items-center">
                        <span className="text-gray-400">Accommodation:</span>
                        <StarRating rating={ratings.accommodationAvg || 0} />
                        </div>
                        <div className="flex justify-between items-center">
                        <span className="text-gray-400">Academic Level:</span>
                        <StarRating rating={ratings.academicLevelAvg || 0} />
                        </div>
                        <div className="flex justify-between items-center">
                        <span className="text-gray-400">Activities:</span>
                        <StarRating rating={ratings.activitiesAvg || 0} />
                        </div>
                    </>
                    ) : (
                    <div className="text-gray-400">No ratings available.</div>
                    )}
                </div>
                </Card>
            </div>
                {/* Forum Section */}
                <div className="mt-6">
                    <ForumSection universityId={id} />
                </div>
            </Card>
        </main>
        
    );
};

export default UniInfo;