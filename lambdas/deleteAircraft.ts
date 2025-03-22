import { APIGatewayProxyHandlerV2 } from "aws-lambda";

import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDocClient } from "../shared/dynamodb-client";


export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    console.log("[EVENT]", JSON.stringify(event));

    // Extract path parameters
    const airlineId = event.pathParameters?.airlineId;
    const aircraftId = event.pathParameters?.aircraftId;

    // Validate path parameters
    if (!airlineId || !aircraftId) {
      return {
        statusCode: 400,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ message: "Missing airlineId or aircraftId in path" }),
      };
    }

    const airlineIdNum = Number(airlineId);
    const aircraftIdNum = Number(aircraftId);

    if (isNaN(airlineIdNum) || isNaN(aircraftIdNum)) {
      return {
        statusCode: 400,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ message: "airlineId and aircraftId must be numbers" }),
      };
    }

    // Execute the DeleteCommand
    await ddbDocClient.send(
      new DeleteCommand({
        TableName: process.env.TABLE_NAME,
        Key: {
          airlineId: airlineIdNum,
          aircraftId: aircraftIdNum,
        },
      })
    );

    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ message: "Aircraft deleted successfully" }),
    };
  } catch (error: any) {
    console.error("[ERROR]", JSON.stringify(error));
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ message: "Failed to delete aircraft", error: error.message }),
    };
  }
};
