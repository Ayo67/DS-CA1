import * as cdk from "aws-cdk-lib";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as custom from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import { generateBatch } from "../shared/util";
import { airlines } from "../seed/airlines";
import * as apig from "aws-cdk-lib/aws-apigateway";


export class RestAPIStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Tables 
    const airlinesTable = new dynamodb.Table(this, "AirlinesTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "airlineId", type: dynamodb.AttributeType.NUMBER },
      sortKey: { name: "aircraftId", type: dynamodb.AttributeType.NUMBER },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "Airlines",
    });

    airlinesTable.addGlobalSecondaryIndex({
      indexName: "CapacityIndex",
      partitionKey: { name: "airlineId", type: dynamodb.AttributeType.NUMBER },  
      sortKey: { name: "capacity", type: dynamodb.AttributeType.NUMBER },
    });


    // Functions 
    const getAirlineByIdFn = new lambdanode.NodejsFunction(
      this,
      "GetAirlineByIdFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: `${__dirname}/../lambdas/getAirlineById.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: airlinesTable.tableName,
          REGION: 'eu-west-1',
        },
      }
    );

    const getAllAirlinesFn = new lambdanode.NodejsFunction(
      this,
      "GetAllAirlinesFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: `${__dirname}/../lambdas/getAllAirlines.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: airlinesTable.tableName,
          REGION: 'eu-west-1',
        },
      }
    );

    const addAirlineFn = new lambdanode.NodejsFunction(this, "AddAirlineFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: `${__dirname}/../lambdas/addAirline.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: airlinesTable.tableName,
        REGION: "eu-west-1",
      },
    });

    const deleteAirlineFn = new lambdanode.NodejsFunction(this, "DeleteAirlineFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: `${__dirname}/../lambdas/deleteAirline.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: airlinesTable.tableName,
        REGION: "eu-west-1",
      },
    });
    
    const deleteAircraftFn = new lambdanode.NodejsFunction(this, "DeleteAircraftFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: `${__dirname}/../lambdas/deleteAircraft.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: airlinesTable.tableName,
        REGION: "eu-west-1",
      },
    });

    const getAircraftByIdFn = new lambdanode.NodejsFunction(this, "GetAircraftByIdFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: `${__dirname}/../lambdas/getAircraftById.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: airlinesTable.tableName,
        REGION: "eu-west-1",
      },
    });

    const updateAircraftFn = new lambdanode.NodejsFunction(this, "UpdateAircraftFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: `${__dirname}/../lambdas/updateAircraft.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: airlinesTable.tableName,
        REGION: "eu-west-1",
      },
    });

    const getAirlineTranslationFn = new lambdanode.NodejsFunction(this, "GetAirlineTranslationFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: `${__dirname}/../lambdas/getTranslation.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: airlinesTable.tableName,
        REGION: "eu-west-1",
      },
    });


    new custom.AwsCustomResource(this, "airlinesDbInitData", {
      onCreate: {
        service: "DynamoDB",
        action: "batchWriteItem",
        parameters: {
          RequestItems: {
            [airlinesTable.tableName]: generateBatch(airlines),
          },
        },
        physicalResourceId: custom.PhysicalResourceId.of("airlinesDbInitData"),
      },
      policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
        resources: [airlinesTable.tableArn],
      }),
    });


    // Permissions 
    airlinesTable.grantReadData(getAirlineByIdFn);
    airlinesTable.grantReadData(getAllAirlinesFn);
    airlinesTable.grantReadWriteData(addAirlineFn);
    airlinesTable.grantReadWriteData(deleteAirlineFn);
    airlinesTable.grantReadWriteData(deleteAircraftFn);
    airlinesTable.grantReadData(getAircraftByIdFn);
    airlinesTable.grantReadWriteData(updateAircraftFn);
    airlinesTable.grantReadData(getAirlineTranslationFn);
    airlinesTable.grantReadWriteData(getAirlineTranslationFn);

    // REST API 
    const api = new apig.RestApi(this, "RestAPI", {
      description: "Airlines API",
      deployOptions: {
        stageName: "dev",
      },
      defaultCorsPreflightOptions: {
        allowHeaders: ["Content-Type", "X-Amz-Date"],
        allowMethods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
        allowCredentials: true,
        allowOrigins: ["*"],
      },
    });

            // Create API key and usage plan
      const apiKey = new apig.ApiKey(this, "AirlinesApiKey", {
        apiKeyName: "airlines-api-key",
        description: "API Key for Airlines API",
        enabled: true,
      });

      const usagePlan = new apig.UsagePlan(this, "AirlinesUsagePlan", {
        name: "AirlinesUsagePlan",
        apiStages: [
          {
            api: api,
            stage: api.deploymentStage,
          },
        ],
      });

      usagePlan.addApiKey(apiKey);

                // Airlines endpoint
      const airlinesEndpoint = api.root.addResource("airlines");
      // airlinesEndpoint.addMethod(
      //   "GET",
      //   new apig.LambdaIntegration(getAllAirlinesFn, { proxy: true })
      // );

      // Detail airline endpoint
      const specificAirlineEndpoint = airlinesEndpoint.addResource("{airlineId}");
      specificAirlineEndpoint.addMethod(
        "GET",
        new apig.LambdaIntegration(getAirlineByIdFn, { proxy: true })
      );

      // Add airline endpoint
      airlinesEndpoint.addMethod(
        "POST",
        new apig.LambdaIntegration(addAirlineFn, { proxy: true }),
        {
          apiKeyRequired: true, // Require API key
        }
      );

      // // Delete airline endpoint
      // specificAirlineEndpoint.addMethod(
      //   "DELETE", 
      //   new apig.LambdaIntegration(deleteAirlineFn, { proxy: true })
      // );

      // Create specific aircraft endpoint directly under airline
      const specificAircraftEndpoint = specificAirlineEndpoint.addResource("{aircraftId}");

      // Get specific aircraft for the airline
      specificAircraftEndpoint.addMethod(
        "GET",
        new apig.LambdaIntegration(getAircraftByIdFn, { proxy: true })
      );

      // Delete aircraft endpoint 
      specificAircraftEndpoint.addMethod(
        "DELETE",
        new apig.LambdaIntegration(deleteAircraftFn, { proxy: true })
      );

      // Update specific aircraft endpoint 
      specificAircraftEndpoint.addMethod(
        "PUT",
        new apig.LambdaIntegration(updateAircraftFn, { proxy: true }),
        {
          apiKeyRequired: true, // Require API key
        }
      );

      // Get aircraft with translation
      const translationEndpoint = specificAircraftEndpoint.addResource("translation");
      translationEndpoint.addMethod(
        "GET",
        new apig.LambdaIntegration(getAirlineTranslationFn, { proxy: true })
      );

  }
}
