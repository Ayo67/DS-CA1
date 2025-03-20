import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDDbDocClient();

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

    const { model, capacity, description } = JSON.parse(event.body);
    
    // Build update expression
    let updateExpression = "SET ";
    let expressionAttributeValues: any = {};
    
    if (model) {
      updateExpression += "model = :model, ";
      expressionAttributeValues[":model"] = model;
    }
    
    if (capacity !== undefined) {
      updateExpression += "capacity = :capacity, ";
      expressionAttributeValues[":capacity"] = parseInt(capacity);
    }
    
    if (description !== undefined) {
      updateExpression += "description = :description, ";
      expressionAttributeValues[":description"] = description;
    }
    
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

function createDDbDocClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  const marshallOptions = {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  };
  const unmarshallOptions = { wrapNumbers: false };
  const translateConfig = { marshallOptions, unmarshallOptions };
  return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}