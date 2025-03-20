import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => { 
  try {
    console.log("Event: ", JSON.stringify(event));
    const airlineId = event.pathParameters?.airlineId;

    if (!airlineId) {
      return {
        statusCode: 400,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Missing airlineId parameter" }),
      };
    }

    // Use QueryCommand to get all items with matching partition key
    const params = {
      TableName: process.env.TABLE_NAME,
      KeyConditionExpression: "airlineId = :airlineId",
      ExpressionAttributeValues: {
        ":airlineId": parseInt(airlineId),  // Make sure to convert to number
      },
    };

    const commandOutput = await ddbDocClient.send(new QueryCommand(params));

    console.log("QueryCommand response: ", commandOutput);
    if (!commandOutput.Items || commandOutput.Items.length === 0) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "No aircraft found for this airline" }),
      };
    }
    
    const body = {
      data: commandOutput.Items,
      count: commandOutput.Count,
    };

    // Return Response
    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
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