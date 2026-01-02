import React from "react";

export default async function UniSearch({ queryParams = {} }) {
    
  return (
    <div className="bg-gray-700 p-4 rounded mt-4 text-gray-300">
        <form
            onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const name = formData.get("name")?.toString().trim();
                const country = formData.get("country")?.toString().trim();
                const city = formData.get("city")?.toString().trim();

                const queryParams: Record<string, string> = {};
                if (name) queryParams.name = name;
                if (country) queryParams.country = country;
                if (city) queryParams.city = city;

                console.log("Query Params:", queryParams);
                // You can pass queryParams to your UniCards component or handle it as needed
            }}
        >
            <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                    University Name
                </label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    className="mt-1 block w-full p-2 bg-gray-800 border border-gray-600 rounded text-gray-100"
                    placeholder="Ej. Universidad Nacional"
                />
            </div>
            <div className="mb-4">
                <label htmlFor="country" className="block text-sm font-medium text-gray-300">
                    Country
                </label>
                <input
                    type="text"
                    id="country"
                    name="country"
                    className="mt-1 block w-full p-2 bg-gray-800 border border-gray-600 rounded text-gray-100"
                    placeholder="Ej. España"
                />
            </div>
            <div className="mb-4">
                <label htmlFor="city" className="block text-sm font-medium text-gray-300">
                    City
                </label>
                <input
                    type="text"
                    id="city"
                    name="city"
                    className="mt-1 block w-full p-2 bg-gray-800 border border-gray-600 rounded text-gray-100"
                    placeholder="Ej. Madrid"
                />
            </div>
            <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
                Search
            </button>
        </form>
    </div>
  );
}
