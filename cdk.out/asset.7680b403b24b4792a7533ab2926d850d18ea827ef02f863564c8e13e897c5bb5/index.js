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

// lambdas/getAllMovies.ts
var getAllMovies_exports = {};
__export(getAllMovies_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(getAllMovies_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
var ddbDocClient = new import_client_dynamodb.DynamoDBClient({ region: process.env.REGION });
var handler = async (event, context) => {
  try {
    console.log("Event: ", event);
    const commandOutput = await ddbDocClient.send(
      new import_lib_dynamodb.ScanCommand({
        TableName: process.env.TABLE_NAME
      })
    );
    if (!commandOutput.Items) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ Message: "Invalid movie Id" })
      };
    }
    const body = {
      data: commandOutput.Items
    };
    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(body)
    };
  } catch (error) {
    console.log(JSON.stringify(error));
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ error })
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
