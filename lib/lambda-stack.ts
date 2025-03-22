import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { SeedConstructs } from "./seed-construct";

export interface LambdaStackProps extends cdk.StackProps {
    airlinesTable: dynamodb.Table;
    region?: string;
    enableSeed?: boolean;
}

export class LambdaStack extends cdk.Stack {
    public readonly functions: {
        getAirlineByIdFn: lambdanode.NodejsFunction;
        getAllAirlinesFn: lambdanode.NodejsFunction;
        addAirlineFn: lambdanode.NodejsFunction;
        deleteAirlineFn: lambdanode.NodejsFunction;
        deleteAircraftFn: lambdanode.NodejsFunction;
        getAircraftByIdFn: lambdanode.NodejsFunction;
        updateAircraftFn: lambdanode.NodejsFunction;
        airlineTranslationFn: lambdanode.NodejsFunction;
        seedAirlinesFn?: lambdanode.NodejsFunction;
    };

    constructor(scope: Construct, id: string, props: LambdaStackProps) {
        super(scope, id, props);

        // Create Lambda execution role with DynamoDB permissions
        const lambdaRole = new iam.Role(this, "AirlinesLambdaRole", {
            assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
            ]
        });

        // Grant DynamoDB permissions to the role
        props.airlinesTable.grantReadWriteData(lambdaRole);

        // Common Lambda properties
        const commonLambdaProps = {
            runtime: lambda.Runtime.NODEJS_18_X,
            role: lambdaRole,
            timeout: cdk.Duration.seconds(10),
            memorySize: 256,
            environment: {
                AIRLINES_TABLE: props.airlinesTable.tableName,
            },
        };

        // Create Lambda functions
        const getAirlineByIdFn = new lambdanode.NodejsFunction(this, "GetAirlineByIdFn", {
            ...commonLambdaProps,
            entry: "lambdas/getAirlineById.ts",
            handler: "handler",
        });

        const getAllAirlinesFn = new lambdanode.NodejsFunction(this, "GetAllAirlinesFn", {
            ...commonLambdaProps,
            entry: "lambdas/getAllAirlines.ts",
            handler: "handler",
        });

        const addAirlineFn = new lambdanode.NodejsFunction(this, "AddAirlineFn", {
            ...commonLambdaProps,
            entry: "lambdas/addAirline.ts",
            handler: "handler",
        });


        const deleteAirlineFn = new lambdanode.NodejsFunction(this, "DeleteAirlineFn", {
            ...commonLambdaProps,
            entry: "lambdas/deleteAirline.ts",
            handler: "handler",
        });

        const getAircraftByIdFn = new lambdanode.NodejsFunction(this, "GetAircraftByIdFn", {
            ...commonLambdaProps,
            entry: "lambdas/getAircraftById.ts",
            handler: "handler",
        });

        const updateAircraftFn = new lambdanode.NodejsFunction(this, "UpdateAircraftFn", {
            ...commonLambdaProps,
            entry: "lambdas/updateAircraft.ts",
            handler: "handler",
        });

        const deleteAircraftFn = new lambdanode.NodejsFunction(this, "DeleteAircraftFn", {
            ...commonLambdaProps,
            entry: "lambdas/deleteAircraft.ts",
            handler: "handler",
        });

        const airlineTranslationFn = new lambdanode.NodejsFunction(this, "AirlineTranslationFn", {
            ...commonLambdaProps,
            entry: "lambdas/getTranslation.ts",
            handler: "handler",
        });

        const seedAirlinesFn = new lambdanode.NodejsFunction(this, "SeedAirlinesFn", {
            ...commonLambdaProps,
            entry: "lambdas/seedAirline.ts",
            handler: "handler",
        });

        // Set the functions property with the created Lambda functions
        this.functions = {
            getAircraftByIdFn,
            getAllAirlinesFn,
            addAirlineFn,
            deleteAirlineFn,
            deleteAircraftFn,
            getAirlineByIdFn,
            updateAircraftFn,
            airlineTranslationFn,
            seedAirlinesFn,
        };

        // Create seed construct if enabled
        const enableSeed = props.enableSeed || false;
        if (enableSeed) {
            new SeedConstructs(this, "SeedConstructs", seedAirlinesFn );
        }
    }

}