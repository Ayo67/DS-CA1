import { Airline, AirlineFleet } from '../shared/types';

export const airlines: Airline[] = [
  {
    id: 1,
    name: 'Delta Airlines',
    country: 'United States',
    logo: '/logos/delta.png',
    slogan: 'Keep Climbing',
    head_quarters: 'Atlanta, Georgia, USA',
    website: 'https://www.delta.com',
    established: '1929',
    popularity: 9.5,
  },
  {
    id: 2,
    name: 'Emirates',
    country: 'United Arab Emirates',
    logo: '/logos/emirates.png',
    slogan: 'Fly Better',
    head_quarters: 'Dubai, UAE',
    website: 'https://www.emirates.com',
    established: '1985',
    popularity: 9.8,
  },
  {
    id: 3,
    name: 'Qatar Airways',
    country: 'Qatar',
    logo: '/logos/qatar.png',
    slogan: 'Going Places Together',
    head_quarters: 'Doha, Qatar',
    website: 'https://www.qatarairways.com',
    established: '1993',
    popularity: 9.7,
  },
  {
    id: 4,
    name: 'Singapore Airlines',
    country: 'Singapore',
    logo: '/logos/singapore.png',
    slogan: 'A Great Way to Fly',
    head_quarters: 'Singapore',
    website: 'https://www.singaporeair.com',
    established: '1947',
    popularity: 9.6,
  },
];

export const airlineFleets: AirlineFleet[] = [
  {
    airlineId: 1,
    aircraftName: 'Boeing 737',
    capacity: 160,
    range: '3,850 miles',
  },
  {
    airlineId: 1,
    aircraftName: 'Airbus A350',
    capacity: 300,
    range: '8,100 miles',
  },
  {
    airlineId: 2,
    aircraftName: 'Boeing 777',
    capacity: 396,
    range: '7,370 miles',
  },
  {
    airlineId: 3,
    aircraftName: 'Airbus A380',
    capacity: 853,
    range: '8,000 miles',
  },
  {
    airlineId: 4,
    aircraftName: 'Boeing 787',
    capacity: 242,
    range: '7,635 miles',
  },
];