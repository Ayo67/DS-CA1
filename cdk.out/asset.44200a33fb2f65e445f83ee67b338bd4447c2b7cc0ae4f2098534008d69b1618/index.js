"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// lambdas/getTranslation.ts
var getTranslation_exports = {};
__export(getTranslation_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(getTranslation_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
var import_client_translate = require("@aws-sdk/client-translate");
var ddbDocClient = createDDbDocClient();
var translateClient = new import_client_translate.TranslateClient({ region: process.env.REGION });
var handler = async (event, context) => {
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
        })
      };
    }
    if (!targetLanguage) {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "Invalid language code" })
      };
    }
    const params = {
      TableName: process.env.TABLE_NAME,
      Key: {
        airlineId: Number(airlineId),
        aircraftId: Number(aircraftId)
      }
    };
    const getResult = await ddbDocClient.send(new import_lib_dynamodb.GetCommand(params));
    if (!getResult.Item) {
      return {
        statusCode: 404,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "Aircraft not found" })
      };
    }
    const aircraft = getResult.Item;
    if (aircraft.translations && aircraft.translations[targetLanguage]) {
      return {
        statusCode: 200,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(aircraft.translations[targetLanguage])
      };
    }
    const translationParams = {
      Text: aircraft.description,
      SourceLanguageCode: "auto",
      TargetLanguageCode: targetLanguage
    };
    const translationResult = await translateClient.send(new import_client_translate.TranslateTextCommand(translationParams));
    const translatedText = translationResult.TranslatedText;
    const translations = aircraft.translations || {};
    translations[targetLanguage] = translatedText;
    const updateParams = {
      TableName: process.env.TABLE_NAME,
      Key: {
        airlineId: Number(airlineId),
        aircraftId
      },
      UpdateExpression: "SET translations = :translations",
      ExpressionAttributeValues: {
        ":translations": translations
      },
      ReturnValues: "ALL_NEW"
    };
    const updateResult = await ddbDocClient.send(new import_lib_dynamodb.UpdateCommand(updateParams));
    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(updateResult.Attributes?.translations?.[targetLanguage] ?? null)
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "Failed to get translation", error: error.message })
    };
  }
};
function createDDbDocClient() {
  const ddbClient = new import_client_dynamodb.DynamoDBClient({ region: process.env.REGION });
  const marshallOptions = {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true
  };
  const unmarshallOptions = { wrapNumbers: false };
  const translateConfig = { marshallOptions, unmarshallOptions };
  return import_lib_dynamodb.DynamoDBDocumentClient.from(ddbClient, translateConfig);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
