import { marshall } from "@aws-sdk/util-dynamodb";
import { Airline } from "./types";

type Entity = Airline;
export const generateItem = (entity: Entity) => {
  return {
    PutRequest: {
      Item: marshall(entity),
    },
  };
};

export const generateBatch = (data: Entity[]) => {
  return data.map((e) => {
    return generateItem(e);
  });
};
