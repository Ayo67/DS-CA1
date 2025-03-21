import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { TranslateClient, TranslateTextCommand } from "@aws-sdk/client-translate";

const ddbDocClient = createDDbDocClient();
const translateClient = new TranslateClient({ region: process.env.REGION });

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    console.log("Event:", JSON.stringify(event));
    const airlineId = event.pathParameters?.airlineId;
    const aircraftId = event.pathParameters?.aircraftId;
    const targetLanguage = event.queryStringParameters?.language || "en";

    // Check if the required path parameters exist
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

    // Determine operation type based on HTTP method
    const httpMethod = event.requestContext.http.method;
    
    if (httpMethod === "GET") {
      // Retrieve aircraft with optional translation
      return await getAircraftWithTranslation(airlineId, aircraftId, targetLanguage);
    } else if (httpMethod === "POST" || httpMethod === "PUT") {
      // Store or update aircraft data
      const requestBody = event.body ? JSON.parse(event.body) : null;
      
      if (!requestBody) {
        return {
          statusCode: 400,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ message: "Missing request body" }),
        };
      }
      
      return await storeAircraft(airlineId, aircraftId, requestBody);
    } else {
      return {
        statusCode: 405,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "Method not allowed" }),
      };
    }
  } catch (error: any) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        message: "Operation failed",
        errorMsg: error.message,
      }),
    };
  }
};

async function getAircraftWithTranslation(airlineId: string, aircraftId: string, targetLanguage: string) {
  // Get the aircraft
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
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "Aircraft not found" }),
    };
  }

  const aircraft = commandOutput.Item;
  
  // Translate description if it exists
  if (aircraft.description && targetLanguage !== "en") {
    const translateParams = {
      Text: aircraft.description,
      SourceLanguageCode: "en",
      TargetLanguageCode: targetLanguage
    };
    
    const translationOutput = await translateClient.send(
      new TranslateTextCommand(translateParams)
    );
    
    aircraft.translatedDescription = translationOutput.TranslatedText;
    aircraft.translationLanguage = targetLanguage;
  }

  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      message: "Successfully retrieved aircraft",
      aircraft: aircraft,
    }),
  };
}

async function storeAircraft(airlineId: string, aircraftId: string, aircraftData: any) {
  // Ensure the data has the correct IDs
  aircraftData.airlineId = parseInt(airlineId);
  aircraftData.aircraftId = parseInt(aircraftId);
  
  // Add timestamp for auditing
  aircraftData.lastUpdated = new Date().toISOString();
  
  const params = {
    TableName: process.env.TABLE_NAME,
    Item: aircraftData,
    // Optional: Add a condition to prevent overwriting an existing item if creating new
    // ConditionExpression: "attribute_not_exists(airlineId) AND attribute_not_exists(aircraftId)"
  };

  await ddbDocClient.send(new PutCommand(params));
  
  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      message: "Successfully stored aircraft data",
      aircraft: aircraftData,
    }),
  };
}

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