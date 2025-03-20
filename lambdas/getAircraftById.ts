import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    console.log("Event:", JSON.stringify(event));
    const airlineId = event.pathParameters?.airlineId;
    const aircraftId = event.pathParameters?.aircraftId;

    if (!airlineId || !aircraftId) {
      return {
        statusCode: 400,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ 
          message: "Missing required path parameters",
          missing: !airlineId ? "airlineId" : "aircraftId" 
        }),
      };
    }

    // Use GetCommand instead of QueryCommand since we have the exact primary key
    const params = {
      TableName: process.env.TABLE_NAME,
      Key: {
        airlineId: parseInt(airlineId),
        aircraftId: parseInt(aircraftId)
      }
    };

    const commandOutput = await ddbDocClient.send(new GetCommand(params));

    if (!commandOutput.Item) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ message: "Aircraft not found" }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        message: "Successfully retrieved aircraft",
        aircraft: commandOutput.Item,
      }),
    };
  } catch (error: any) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        message: "Failed to retrieve aircraft",
        errorMsg: error.message,
        errorStack: error.stack,
      }),
    };
  }
};

function createDDbDocClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
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