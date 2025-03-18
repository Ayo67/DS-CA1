import { marshall } from "@aws-sdk/util-dynamodb";
import { Airline, AirlineFleet } from "./types";

type Entity = Airline | AirlineFleet;
export const generateAirlineItem = (entity: Entity) => {
  return {
    PutRequest: {
      Item: marshall(entity),
    },
  };
};

export const generateBatch = (data: Entity[]) => {
  return data.map((e) => {
    return generateAirlineItem(e);
  });
};
