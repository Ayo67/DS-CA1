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
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ Message: "Missing airlineId parameter" }),
      };
    }

    // (optional filters)
    const queryParams = event.queryStringParameters || {};
    const { destination, capacity } = queryParams;

    const params: any = {
      TableName: process.env.TABLE_NAME,
      IndexName: "CapacityIndex",
      ExpressionAttributeValues: {
        ":airlineId": parseInt(airlineId),
      },
    };

    // Handle capacity parameter in KeyConditionExpression
    if (capacity) {
      params.KeyConditionExpression = "airlineId = :airlineId AND capacity >= :capacity";
      params.ExpressionAttributeValues[":capacity"] = parseInt(capacity);
    } else {
      // If no capacity provided, just query by partition key
      params.KeyConditionExpression = "airlineId = :airlineId";
    }

    // Add any additional filter expressions
    let filterExpressions: string[] = [];
    
    if (destination) {
      filterExpressions.push("destination = :destination");
      params.ExpressionAttributeValues[":destination"] = destination;
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