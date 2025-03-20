// getAircraftWithTranslation.ts
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { TranslateClient, TranslateTextCommand } from "@aws-sdk/client-translate";

const ddbDocClient = createDDbDocClient();
const translateClient = new TranslateClient({ region: process.env.REGION });

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    console.log("Event:", JSON.stringify(event));
    const airlineId = event.pathParameters?.airlineId;
    const aircraftId = event.pathParameters?.aircraftId;
    const targetLanguage = event.queryStringParameters?.language || "en";

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

    // First get the aircraft
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
  } catch (error: any) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        message: "Failed to retrieve aircraft with translation",
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