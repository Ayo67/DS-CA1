import { CloudFormationCustomResourceEvent, CloudFormationCustomResourceResponse } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import { airlines } from "../seed/airlines";

// Define CloudFormationStatus type
type CloudFormationStatus = "SUCCESS" | "FAILED";


const ddbDocClient = createDDbDocClient();

// Function to send response back to CloudFormation
async function sendResponse(event: CloudFormationCustomResourceEvent, status: CloudFormationStatus, data: any) {
  const responseBody: CloudFormationCustomResourceResponse = {
    Status: status,
    Reason: "See the details in CloudWatch Log Stream",
    PhysicalResourceId: event.LogicalResourceId,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    Data: data,
  };

  console.log("Response Body:\n", JSON.stringify(responseBody));

  const https = require("https");
  const url = require("url");
  
  const parsedUrl = url.parse(event.ResponseURL);
  const options = {
    hostname: parsedUrl.hostname,
    port: 443,
    path: parsedUrl.path,
    method: "PUT",
    headers: {
      "content-type": "",
      "content-length": JSON.stringify(responseBody).length,
    },
  };

  return new Promise((resolve, reject) => {
    const request = https.request(options, (response: any) => {
      console.log(`Status code: ${response.statusCode}`);
      resolve(null);
    });

    request.on("error", (error: any) => {
      console.log(`Send response failed: ${error}`);
      reject(error);
    });

    request.write(JSON.stringify(responseBody));
    request.end();
  });
}

export const handler = async (event: CloudFormationCustomResourceEvent): Promise<any> => {
  try {
    console.log("Received event", JSON.stringify(event));

    if (event.RequestType === "Delete") {
      await sendResponse(event, "SUCCESS", { Message: "Resource deletion successful" });
      return;
    }

    const tableName = process.env.TABLE_NAME;
    const batchItems: Array<{ PutRequest: { Item: any } }> = [];

    for (const airline of airlines) {
      batchItems.push({
        PutRequest: {
          Item: airline,
        },
      });
    }

    await sendResponse(event, "SUCCESS", { Message: "Resource creation successful" });
    
  } catch (error) {
    console.error("Error", error);
    await sendResponse(event, "FAILED", { Message: "Operation failed" });
  }

};

  // Function to create DynamoDB Document Client
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
