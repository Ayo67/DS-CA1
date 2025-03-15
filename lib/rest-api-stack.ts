import * as cdk from "aws-cdk-lib";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as custom from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import { generateBatch } from "../shared/util";
import { airlines } from "../seed/airlines";


export class RestAPIStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

     // Tables 
     const airlinesTable = new dynamodb.Table(this, "AirlinesTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "id", type: dynamodb.AttributeType.NUMBER },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "Airlines",
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

    new custom.AwsCustomResource(this, "airlinesddbInitData", {
      onCreate: {
        service: "DynamoDB",
        action: "batchWriteItem",
        parameters: {
          RequestItems: {
            [airlinesTable.tableName]: generateBatch(airlines),
          },
        },
        physicalResourceId: custom.PhysicalResourceId.of("airlinesddbInitData"),
      },
      policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
        resources: [airlinesTable.tableArn],
      }),
    });

    // Permissions 
    airlinesTable.grantReadData(getAirlineByIdFn);
    airlinesTable.grantReadData(getAllAirlinesFn);
  }
}
    