import pandas as pd
import requests

# Load cleaned CSV
uniData = pd.read_csv("uniList.csv")
cityData = pd.read_csv("cityList.csv")
countryData = pd.read_csv("countryList.csv")

url = "http://localhost:4000/university"

# create countries mapping
for index, row in countryData.iterrows():
    data = {
        "name": row["Country"],
        "code": row["CountryCode"]
    }
    response = requests.post("http://localhost:4000/country", json=data)

    if response.status_code == 201:
        print(f"Inserted {data['name']} ✅")
    else:
        print(f"❌ Failed {data['name']}: {response.status_code}, {response.text}")

countries = requests.get("http://localhost:4000/country").json()
country_name_to_id = {country["name"]: country["id"] for country in countries}

# create cities mapping
for index, row in cityData.iterrows():
    country_id = country_name_to_id.get(row["Country"])
    data = {
        "name": row["City"],
        "countryId": country_id,
        "latitude": row["Latitude"],
        "longitude": row["Longitude"]
    }
    response = requests.post("http://localhost:4000/city", json=data)

    if response.status_code == 201:
        print(f"Inserted {data['name']} ✅")
    else:
        print(f"❌ Failed {data['name']}: {response.status_code}, {response.text}")

cities = requests.get("http://localhost:4000/city").json()
city_name_to_id = {city["name"]: city["id"] for city in cities}

for index, row in uniData.iterrows():
    data = {
        "name": row["name"],
        "countryId": country_name_to_id.get(row["country"], ""),
        "cityId": city_name_to_id.get(row.get("city", ""), ""),       # empty if missing
        "isPublic": bool(row.get("public", False))  # default to False if missing
    }

    response = requests.post(url, json=data)

    if response.status_code == 201:
        print(f"Inserted {data['name']} ✅")
    else:
        print(f"❌ Failed {data['name']}: {response.status_code}, {response.text}")
