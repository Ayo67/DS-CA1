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

// lambdas/updateAircraft.ts
var updateAircraft_exports = {};
__export(updateAircraft_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(updateAircraft_exports);
var import_lib_dynamodb2 = require("@aws-sdk/lib-dynamodb");

// shared/dynamodb-client.ts
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
function createDDbDocClient() {
  const ddbClient = new import_client_dynamodb.DynamoDBClient({ region: "eu-west-1" });
  const marshallOptions = {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true
  };
  const unmarshallOptions = {
    wrapNumbers: false
  };
  const translateConfig = { marshallOptions, unmarshallOptions };
  return import_lib_dynamodb.DynamoDBDocumentClient.from(ddbClient, translateConfig);
}
var ddbDocClient = createDDbDocClient();

// lambdas/updateAircraft.ts
var handler = async (event, context) => {
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
        })
      };
    }
    if (!event.body) {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "Missing request body" })
      };
    }
    const requestBody = JSON.parse(event.body);
    let updateExpression = "SET ";
    let expressionAttributeValues = {};
    let expressionAttributeNames = {};
    for (const [key, value] of Object.entries(requestBody)) {
      if (value !== void 0 && value !== null) {
        const attributeName = `#${key}`;
        const attributeValue = `:${key}`;
        updateExpression += `${attributeName} = ${attributeValue}, `;
        expressionAttributeValues[attributeValue] = value;
        expressionAttributeNames[attributeName] = key;
      }
    }
    updateExpression = updateExpression.slice(0, -2);
    if (Object.keys(expressionAttributeValues).length === 0) {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "No attributes to update" })
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
      ReturnValues: "ALL_NEW"
    };
    const commandOutput = await ddbDocClient.send(new import_lib_dynamodb2.UpdateCommand(params));
    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        message: "Aircraft updated successfully",
        aircraft: commandOutput.Attributes
      })
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        message: "Failed to update aircraft",
        errorMsg: error.message
      })
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
