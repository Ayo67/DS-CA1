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

// asset-input/lambdas/getAllAirlineFleet.ts
var getAllAirlineFleet_exports = {};
__export(getAllAirlineFleet_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(getAllAirlineFleet_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
var ddbDocClient = createDocumentClient();
var handler = async (event, context) => {
  try {
    console.log("[EVENT]", JSON.stringify(event));
    const queryParams = event.queryStringParameters;
    if (!queryParams || !queryParams.airlineId) {
      return {
        statusCode: 400,
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ message: "Missing or invalid query parameters. 'airlineId' is required." })
      };
    }
    const airlineId = parseInt(queryParams.airlineId);
    if (isNaN(airlineId)) {
      return {
        statusCode: 400,
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ message: "'airlineId' must be a valid number." })
      };
    }
    let commandInput = {
      TableName: process.env.TABLE_NAME,
      KeyConditionExpression: "airlineId = :a",
      ExpressionAttributeValues: {
        ":a": airlineId
      }
    };
    if ("aircraftName" in queryParams) {
      commandInput = {
        ...commandInput,
        KeyConditionExpression: "airlineId = :a and begins_with(aircraftName, :n)",
        ExpressionAttributeValues: {
          ":a": airlineId,
          ":n": queryParams.aircraftName
        }
      };
    }
    const commandOutput = await ddbDocClient.send(new import_lib_dynamodb.QueryCommand(commandInput));
    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        data: commandOutput.Items
      })
    };
  } catch (error) {
    console.error("[ERROR]", JSON.stringify(error));
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ message: "Failed to retrieve airline fleet.", error })
    };
  }
};
function createDocumentClient() {
  const ddbClient = new import_client_dynamodb.DynamoDBClient({ region: process.env.REGION });
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
