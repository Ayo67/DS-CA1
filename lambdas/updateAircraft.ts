import { APIGatewayProxyHandlerV2 } from "aws-lambda";

import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDocClient } from "../shared/dynamodb-client";


export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    console.log("Event:", JSON.stringify(event));
    
    const airlineId = event.pathParameters?.airlineId;
    const aircraftId = event.pathParameters?.aircraftId;
    
    if (!airlineId || !aircraftId) {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ 
          message: "Missing required path parameters",
          missing: !airlineId ? "airlineId" : "aircraftId" 
        }),
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "Missing request body" }),
      };
    }

    const requestBody = JSON.parse(event.body);

    // Build update expression with attribute names
    let updateExpression = "SET ";
    let expressionAttributeValues: any = {};
    let expressionAttributeNames: any = {};

    // Iterate over the fields in the request body
    for (const [key, value] of Object.entries(requestBody)) {
      // Avoid adding empty or undefined values
      if (value !== undefined && value !== null) {
        // Handle reserved keywords in DynamoDB, use a placeholder
        const attributeName = `#${key}`;
        const attributeValue = `:${key}`;
        
        updateExpression += `${attributeName} = ${attributeValue}, `;
        expressionAttributeValues[attributeValue] = value;
        expressionAttributeNames[attributeName] = key;
      }
    }

    // Remove the trailing comma and space from the update expression
    updateExpression = updateExpression.slice(0, -2);
    
    if (Object.keys(expressionAttributeValues).length === 0) {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "No attributes to update" }),
      };
    }

    const params = {
      TableName: process.env.TABLE_NAME,
      Key: {
        airlineId: parseInt(airlineId),
        aircraftId: parseInt(aircraftId)
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: expressionAttributeNames,
      ReturnValues: "ALL_NEW" as const
    };

    const commandOutput = await ddbDocClient.send(new UpdateCommand(params));

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        message: "Aircraft updated successfully",
        aircraft: commandOutput.Attributes,
      }),
    };
  } catch (error: any) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        message: "Failed to update aircraft",
        errorMsg: error.message,
      }),
    };
  }
};
