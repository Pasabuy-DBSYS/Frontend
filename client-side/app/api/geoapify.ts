import { Coordinates } from "@/types/interfaces";

export const convertCoordinatesToAddress = async (
  coords: Coordinates,
  key: string
): Promise<string | null> => {
  console.log(`Converting coordinates to address: ${JSON.stringify(coords)}`);
  const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${coords.latitude}&lon=${coords.longitude}&apiKey=${key}`;

  try {
    const res = await fetch(url);

    if (!res.ok) throw new Error("Failed to fetch address");

    const data = await res.json();

    console.log(`DATA REVERSE: ${JSON.stringify(data, null, 2)}`);

    const feature = data.features[0];

    const address = feature.properties.formatted;

    if (!address) throw new Error("No address found for coordinates");

    return address;
  } catch (error) {
    console.error("Error converting coordinates to address:", error);
    return null;
  }
};
