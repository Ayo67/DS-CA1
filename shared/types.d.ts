export type Airline = {
  id: number;
  name: string;
  country: string;
  logo: string;
  slogan: string;
  head_quarters: string;
  website: string;
  established: string;
  popularity: number;
};

export type AirlineFleet = {
  airlineId: number; 
  aircraftName: string; 
  capacity: number;
  range: string; 

}; 


