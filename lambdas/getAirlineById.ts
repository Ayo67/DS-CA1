import { APIGatewayProxyHandlerV2 } from "aws-lambda";

import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDocClient } from "../shared/dynamodb-client";


export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    console.log("Event: ", JSON.stringify(event));

    const airlineId = event.pathParameters?.airlineId;
    const queryParams = event.queryStringParameters || {};
    const { international, capacity } = queryParams;

    let params: any;

    if (capacity) {
      // Querying via CapacityIndex (GSI)
      params = {
        TableName: process.env.TABLE_NAME,
        IndexName: "CapacityIndex",  // Using a GSI named "CapacityIndex"
        KeyConditionExpression: "#capacity = :capacity and airlineId = :airlineId", // Adding airlineId for GSI query
        ExpressionAttributeNames: {
          "#capacity": "capacity", // Alias for the reserved word "capacity"
        },
        ExpressionAttributeValues: {
          ":capacity": parseInt(capacity),
          ":airlineId": airlineId ? parseInt(airlineId) : undefined, // Ensure airlineId is defined before parsing
        },
      };
    } else if (airlineId) {
      // Querying via primary key (Main Table)
      params = {
        TableName: process.env.TABLE_NAME,
        KeyConditionExpression: "airlineId = :airlineId", // Ensuring airlineId is included for primary key query
        ExpressionAttributeValues: {
          ":airlineId": airlineId ? parseInt(airlineId) : undefined,
        },
      };
    } else {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ Message: "Missing required parameters: airlineId or capacity" }),
      };
    }

    // Apply optional filters
    let filterExpressions: string[] = [];
    if (international) {
      filterExpressions.push("international = :international");
      params.ExpressionAttributeValues[":international"] = international;
    }

    if (filterExpressions.length > 0) {
      params.FilterExpression = filterExpressions.join(" AND ");
    }

    // Execute the query
    const commandOutput = await ddbDocClient.send(new QueryCommand(params));
    console.log("QueryCommand response: ", commandOutput);

    if (!commandOutput.Items || commandOutput.Items.length === 0) {
      return {
        statusCode: 404,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ Message: "No results match the given filters" }),
      };
    }

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        data: commandOutput.Items,
        count: commandOutput.Count,
      }),
    };

  } catch (error: any) {
    console.log(JSON.stringify(error));
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error }),
    };
  }
};
