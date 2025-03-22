import { CloudFormationCustomResourceEvent, CloudFormationCustomResourceResponse } from "aws-lambda";

import { BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDocClient } from "../shared/dynamodb-client";
import { airlines } from "../seed/airlines";

// Define CloudFormationStatus type
type CloudFormationStatus = "SUCCESS" | "FAILED";



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
    if (!tableName) {
      throw new Error("TABLE_NAME environment variable is not set");
    }

    // Prepare items for batch write
    const batchItems: Array<{ PutRequest: { Item: any } }> = [];

    for (const airline of airlines) {
      batchItems.push({
        PutRequest: {
          Item: airline,
        },
      });
    }

    // Split items into chunks of 25 (DynamoDB BatchWrite limit)
    const batchChunks: Array<typeof batchItems> = [];
    for (let i = 0; i < batchItems.length; i += 25) {
      batchChunks.push(batchItems.slice(i, i + 25));
    }

    console.log(`Seeding ${batchItems.length} airline records to ${tableName}`);

    // Process each chunk with BatchWriteCommand
    for (const chunk of batchChunks) {
      const params = {
        RequestItems: {
          [tableName]: chunk
        }
      };
      
      await ddbDocClient.send(new BatchWriteCommand(params));
      console.log(`Seeded ${chunk.length} items to DynamoDB`);
    }

    console.log("Seeding completed successfully");
    await sendResponse(event, "SUCCESS", { Message: "Resource creation successful" });
    
  } catch (error) {
    console.error("Error during seeding:", error);
    await sendResponse(event, "FAILED", { Message: `Operation failed: ${error}` });
  }
};
