import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

/**
 * Creates and returns a DynamoDB Document Client
 */
export function createDDbDocClient() {
  const ddbClient = new DynamoDBClient({ region: "eu-west-1" });
  const marshallOptions = {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  };
  const unmarshallOptions = {
    wrapNumbers: false,
  };
  const translateConfig = { marshallOptions, unmarshallOptions };
  return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}

// Create a singleton instance of the DynamoDB Document Client
export const ddbDocClient = createDDbDocClient();
