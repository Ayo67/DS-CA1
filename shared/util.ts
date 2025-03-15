import { marshall } from "@aws-sdk/util-dynamodb";
import { Airline } from "./types";

export const generateAirlineItem = (airline: Airline) => {
  return {
    PutRequest: {
      Item: marshall(airline),
    },
  };
};

export const generateBatch = (data: Airline[]) => {
  return data.map((e) => {
    return generateAirlineItem(e);
  });
};
