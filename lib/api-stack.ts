import * as cdk from "aws-cdk-lib";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as apig from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";

export interface ApiStackProps extends cdk.StackProps {
    lambdaFunctions: {
        getAirlineByIdFn: lambdanode.NodejsFunction;
        getAllAirlinesFn: lambdanode.NodejsFunction;
        addAirlineFn: lambdanode.NodejsFunction;
        deleteAirlineFn: lambdanode.NodejsFunction;
        deleteAircraftFn: lambdanode.NodejsFunction;
        getAircraftByIdFn: lambdanode.NodejsFunction;
        updateAircraftFn: lambdanode.NodejsFunction;
        airlineTranslationFn: lambdanode.NodejsFunction;
    };
    apiKeyName?: string;
    stageName?: string;
}

export class ApiStack extends cdk.Stack {
    public readonly api: apig.RestApi;
    public readonly apiKey: apig.ApiKey;

    constructor(scope: Construct, id: string, props: ApiStackProps) {
        super(scope, id, props);

        this.api = new apig.RestApi(this, "AirlinesApi", {
            description: "Airlines API",
            deployOptions: {
                stageName: props.stageName || process.env.STAGE || "dev",
            },
            defaultCorsPreflightOptions: {
                allowHeaders: ["Content-Type", "X-Amz-Date", "-api-key"],
                allowMethods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
                allowCredentials: true,
                allowOrigins: ["*"],
            },
        });

        this.apiKey = new apig.ApiKey(this, "AirlinesApiKey", {
            apiKeyName: props.apiKeyName || "airlines-api-key2",
            description: "API Key for Airlines API(Multi-Stacks)",
            enabled: true,
        });


        const usagePlan = new apig.UsagePlan(this, "AirlinesUsagePlan", {
            name: "AirlinesUsagePlan",
        });

        usagePlan.addApiStage({
            stage: this.api.deploymentStage,
        });

        usagePlan.addApiKey(this.apiKey);

        const airlinesResource = this.api.root.addResource("airlines");
        airlinesResource.addMethod("GET", new apig.LambdaIntegration(props.lambdaFunctions.getAllAirlinesFn, { proxy: true }));

        // Create global /airlines/aircraft endpoint
        const aircraft = airlinesResource.addResource("aircraft");
        aircraft.addMethod("GET", new apig.LambdaIntegration(props.lambdaFunctions.getAircraftByIdFn, { proxy: true }));
        aircraft.addMethod(
            "DELETE",
            new apig.LambdaIntegration(props.lambdaFunctions.deleteAircraftFn, {
              proxy: true
            }),
            { apiKeyRequired: true } 
          );
          
        aircraft.addMethod(
            "PUT",
            new apig.LambdaIntegration(props.lambdaFunctions.updateAircraftFn, {
              proxy: true,
              passthroughBehavior: apig.PassthroughBehavior.WHEN_NO_TEMPLATES
            }),
            { apiKeyRequired: true } 
          );
        
        // Create airline/{airlineId} endpoint
        const airline = airlinesResource.addResource("{airlineId}");
        airline.addMethod("GET", new apig.LambdaIntegration(props.lambdaFunctions.getAirlineByIdFn, { proxy: true }));
        
        // Add airline/{airlineId}/aircraft endpoint
        const airlineAircraft = airline.addResource("aircraft");
        
        // Add airline/{airlineId}/aircraft/{aircraftId} endpoint
        const aircraftIdResource = airlineAircraft.addResource("{aircraftId}");
        aircraftIdResource.addMethod("GET", new apig.LambdaIntegration(props.lambdaFunctions.getAircraftByIdFn, { proxy: true }));
        aircraftIdResource.addMethod("PUT", new apig.LambdaIntegration(props.lambdaFunctions.updateAircraftFn, { proxy: true, passthroughBehavior: apig.PassthroughBehavior.WHEN_NO_TEMPLATES }), { apiKeyRequired: true });
        aircraftIdResource.addMethod("DELETE", new apig.LambdaIntegration(props.lambdaFunctions.deleteAircraftFn, { proxy: true }), { apiKeyRequired: true });

        airlinesResource.addMethod("POST", new apig.LambdaIntegration(props.lambdaFunctions.addAirlineFn, { proxy: true, 
            requestParameters: { "integration.request.header.Content-Type": "'application/json'" },
            passthroughBehavior: apig.PassthroughBehavior.WHEN_NO_TEMPLATES,
         }),
         {apiKeyRequired: true});   

        airline.addMethod("DELETE", new apig.LambdaIntegration(props.lambdaFunctions.deleteAirlineFn, { proxy: true }) );

        const airlineTranslation = airlinesResource.addResource("translation");
        airlineTranslation.addMethod("GET", new apig.LambdaIntegration(props.lambdaFunctions.airlineTranslationFn, { proxy: true }));   
    }
}
