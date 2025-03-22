import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { TranslateClient, TranslateTextCommand } from "@aws-sdk/client-translate";
import * as iam from 'aws-cdk-lib/aws-iam';


const ddbDocClient = createDDbDocClient();
const translateClient = new TranslateClient({ region: process.env.REGION });

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    console.log("Event:", JSON.stringify(event));
    const airlineId = event.pathParameters?.airlineId;
    const aircraftId = event.pathParameters?.aircraftId;
    const targetLanguage = event.queryStringParameters?.language;

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

    if (!targetLanguage ) {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "Invalid language code" }),
      };
    }

    const params = {
      TableName: process.env.TABLE_NAME,
        Key: {
            airlineId: Number(airlineId),
            aircraftId: Number(aircraftId),
        },
    };
    const getResult = await ddbDocClient.send(new GetCommand(params));

    if (!getResult.Item) {
      return {
        statusCode: 404,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "Aircraft not found" }),
      };
    }

    const aircraft = getResult.Item;

    if(aircraft.translations && aircraft.translations[targetLanguage]) {

        //         // Create a response object with all aircraft data plus the translation
        // const response = {
        //     ...aircraft,  // Spread all original aircraft properties
        //     translatedDescription: aircraft.translations[targetLanguage]
        // };

      return {
        statusCode: 200,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(aircraft.translations[targetLanguage]),
      };
    }

    const translationParams = {
        Text: aircraft.description,
        SourceLanguageCode: "en", 
        TargetLanguageCode: targetLanguage,
    };

    const translationResult = await translateClient.send(new TranslateTextCommand(translationParams));
    const translatedText = translationResult.TranslatedText;

    const translations = aircraft.translations || {};
    translations[targetLanguage] = translatedText;

    const updateParams = {
        TableName: process.env.TABLE_NAME,   
          Key: {
              airlineId: Number(airlineId),
              aircraftId: Number(aircraftId),
          },
          UpdateExpression: "SET translations = :translations",
          ExpressionAttributeValues: {    
              ":translations": translations,
          },
          ReturnValues: "ALL_NEW" as const,
      };

    const updateResult = await ddbDocClient.send(new UpdateCommand(updateParams));

    // const response = {
    //     ...aircraft,  // Spread all original aircraft properties
    //     translatedDescription: translatedText
    //   };

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(updateResult.Attributes?.translations?.[targetLanguage] ?? null),
    };
  } catch (error: any) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "Failed to get translation", error: error.message }),
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