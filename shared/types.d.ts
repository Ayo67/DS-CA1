export type Airline = {
  airlineId: number;
  aircraftId: number; 
  model: string; 
  airlineName: string;
  country: string;
  logo: string;
  slogan: string;
  headQuarters: string;
  website: string;
  established: string;
  popularity: number;
  capacity: number;
  international: boolean;
  tags: string[];
  destination: string;
};

export type AirlineFleetQueryParams = {
  airlineId: number;
  airlineName?: string;
  destination?: string;
};

