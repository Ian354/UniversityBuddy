import React from 'react';
import { University } from '@/app/type/types';
import { Card, Badge } from '@/app/ui';

interface UniCardsProps {
    universities: University[];
}

// Individual card component that fetches its own city and country
const UniCard: React.FC<{ university: University }> = ({ university }) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const [country, setCountry] = React.useState<{id: number; name: string;} | null>(null);
    const [city, setCity] = React.useState<{id: number; name: string;} | null>(null);

    React.useEffect(() => {
        const fetchCountry = async () => {
            const response = await fetch(`${apiUrl}/country/${university.countryId}`);
            const data = await response.json();
            setCountry(data);
        };

        const fetchCity = async () => {
            const response = await fetch(`${apiUrl}/city/${university.cityId}`);
            const data = await response.json();
            setCity(data);
        };

        fetchCountry();
        fetchCity();
    }, [university.cityId, university.countryId, apiUrl]);

    return (
        <Card
            key={university.id}
            className="p-4 flex flex-col items-center justify-center text-center hover:bg-gray-800 transition"
        >
            <a href={`/university/${university.id}`} className="w-full h-full">
                <h3 className="text-lg font-semibold text-gray-200">{university.name}</h3>
                <p className="text-gray-400">{city?.name}, {country?.name}</p>
                <Badge
                    className={`mt-2 px-2 py-1 rounded-full text-sm ${university.isPublic ? 'bg-green-900 text-green-300' : 'bg-blue-900 text-blue-300'}`}
                >
                    {university.isPublic ? 'Public' : 'Private'}
                </Badge>
            </a>
        </Card>
    );
};

const UniCards: React.FC<UniCardsProps> = ({ universities }) => {
    console.log("Universities in UniCards:", universities);

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {universities.map((uni) => (
                <UniCard key={uni.id} university={uni} />
            ))}
        </div>
    );
};

export default UniCards;