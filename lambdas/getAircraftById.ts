import { APIGatewayProxyHandlerV2 } from "aws-lambda";

import { GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDocClient } from "../shared/dynamodb-client";


export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    console.log("Event:", JSON.stringify(event));
    const airlineId = event.pathParameters?.airlineId;
    const aircraftId = event.pathParameters?.aircraftId;

    if (!airlineId) {
      return {
        statusCode: 400,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ 
          message: "Missing required path parameter",
          missing: "airlineId" 
        }),
      };
    }

    const airlineIdNum = parseInt(airlineId);

    // If aircraftId is provided, get a specific aircraft
    if (aircraftId) {
      const aircraftIdNum = parseInt(aircraftId);
      
      // Use GetCommand since we have the exact primary key
      const params = {
        TableName: process.env.TABLE_NAME,
        Key: {
          airlineId: airlineIdNum,
          aircraftId: aircraftIdNum
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
    } 
    // If only airlineId is provided, get all aircraft for that airline
    else {
      const queryParams = {
        TableName: process.env.TABLE_NAME,
        KeyConditionExpression: "airlineId = :airlineId",
        ExpressionAttributeValues: {
          ":airlineId": airlineIdNum
        }
      };

      const queryOutput = await ddbDocClient.send(new QueryCommand(queryParams));

      if (!queryOutput.Items || queryOutput.Items.length === 0) {
        return {
          statusCode: 404,
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ message: "No aircraft found for this airline" }),
        };
      }

      return {
        statusCode: 200,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: "Successfully retrieved all aircraft for airline",
          count: queryOutput.Items.length,
          aircraft: queryOutput.Items,
        }),
      };
    }
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
