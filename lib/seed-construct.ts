

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cr from 'aws-cdk-lib/custom-resources';

export class SeedConstructs extends Construct {
    constructor(scope: Construct, id: string, seedFunction: lambda.IFunction) {
        super(scope, id);

        // Create a custom resource provider that invokes the Lambda function
        const provider = new cr.Provider(this, "SeedProvider", {
            onEventHandler: seedFunction, 
        });

    
        new cdk.CustomResource(this, "SeedResource", {
            serviceToken: provider.serviceToken, 
            properties: {
                timestamp: new Date().toISOString(), 
            },
        });
    }
}
