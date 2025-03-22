import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DeleteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDocClient } from "../shared/dynamodb-client";

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    console.log("[EVENT]", JSON.stringify(event));
    
    const airlineId = event.pathParameters?.airlineId;
    
    if (!airlineId) {
      return {
        statusCode: 400,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ message: "Missing airline ID in path" }),
      };
    }

    const airlineIdNum = Number(airlineId);
    if (isNaN(airlineIdNum)) {
      return {
        statusCode: 400,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ message: "Airline ID must be a number" }),
      };
    }

    // First query to find all items with this airlineId
    
    // Query all items with the given airlineId
    const queryParams = {
      TableName: process.env.TABLE_NAME,
      KeyConditionExpression: "airlineId = :airlineId",
      ExpressionAttributeValues: {
        ":airlineId": airlineIdNum
      }
    };
    
    const queryResult = await ddbDocClient.send(new QueryCommand(queryParams));
    
    // If no items found
    if (!queryResult.Items || queryResult.Items.length === 0) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ message: "Airline not found" }),
      };
    }
    
    // Delete each item found
    for (const item of queryResult.Items) {
      await ddbDocClient.send(
        new DeleteCommand({
          TableName: process.env.TABLE_NAME,
          Key: { 
            airlineId: airlineIdNum,
            aircraftId: item.aircraftId,
          },
        })
      );
    }

    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ message: "Airline deleted successfully" }),
    };
  } catch (error: any) {
    console.log(JSON.stringify(error));
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ error }),
    };
  }
};
