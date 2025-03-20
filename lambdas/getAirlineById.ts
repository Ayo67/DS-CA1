import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event) => { 
  try {
    console.log("Event: ", JSON.stringify(event));
    
    // Get path parameter
    const airlineId = event.pathParameters?.airlineId;
    if (!airlineId) {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ Message: "Missing airlineId parameter" }),
      };
    }

    // Get query string parameters (optional filters)
    const queryParams = event.queryStringParameters || {};
    const { destination, capacity } = queryParams;

    // Defininition of  base QueryCommand parameters
    const params: any = {
      TableName: process.env.TABLE_NAME,
      KeyConditionExpression: "airlineId = :airlineId",
      ExpressionAttributeValues: { ":airlineId": parseInt(airlineId) },
    };

    let filterExpressions: string[] = [];
    
    if (destination) {
      filterExpressions.push("destination = :destination");
      params.ExpressionAttributeValues[":destination"] = destination;
    }
    if (capacity) {
      filterExpressions.push("capacity >= :capacity");
      params.ExpressionAttributeValues[":capacity"] = parseInt(capacity);
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