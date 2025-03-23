## Serverless REST Assignment - Distributed Systems.

__Name:__ Ayooluwa Oguntuyi (20098135)

__Demo:__ ... link to your YouTube video demonstration ......

### Context.
Context: Airline and Airline Fleet Management

Table item attributes:
+ airlineId - number (Partition key) 
+ aircraftId - number (Sort key)  
+ model - string  
+ airlineName - string  
+ country - string  
+ logo - string  
+ slogan - string  
+ headQuarters - string  
+ website - string  
+ established - string  
+ popularity - number 
+ capacity - number  
+ international - boolean  
+ description - string  
+ destination - string  

### App API endpoints.

## Airlines
- **`GET /airlines`** - Retrieves a list of all airlines. *(Currently commented out in the code)*
- **`POST /airlines`** - Adds a new airline to the database.

## Specific Airline
- **`GET /airlines/{airlineId}`** - Retrieves details of a specific airline using the `airlineId`.
- **`DELETE /airlines/{airlineId}`** - Deletes a specific airline by `airlineId`. *(Currently commented out in the code)*

## Specific Aircraft (Under an Airline)
- **`GET /airlines/{airlineId}/{aircraftId}`** - Retrieves details of a specific aircraft belonging to an airline.
- **`DELETE /airlines/{airlineId}/{aircraftId}`** - Deletes a specific aircraft under a given airline.
- **`PUT /airlines/{airlineId}/{aircraftId}`** - Updates details of a specific aircraft.

## Aircraft Translation
- **`GET /airlines/{airlineId}/{aircraftId}/translation`** - Retrieves translation data for a specific aircraft.


### Features.

#### Translation persistence
The translation persistence in the  Lambda function is handled by storing the translated text in the translations attribute of the aircraft record in DynamoDB. If a translation for the target language exists, it's returned from the database. If not, the text is then translated using AWS Translate, and the result is added to the translations field. The record is then updated in DynamoDB to store the new translation.

+ airlineId - number  (Partition key)
+ airlineId - number  (Sort Key)
+ model - string
+ airlineName - string
+ Translations - {
    fr:
    es:
}

#### Custom L2 Construct
The custom L2 construct provisions infrastructure for the DynamoDB table to store airline and aircraft data, an API Gateway for RESTful endpoints, and Lambda functions for CRUD operations on airlines and aircraft as well as managing translations using AWS Translate. IAM permissions are granted to ensure the Lambda functions can interact with DynamoDB and AWS Translate, and an optional seed function is provided to populate the database. The input props (AirlineAPIProps) allow customization of the DynamoDB table name, API Gateway stage, API key, and database seeding. 

Construct Input props object:
~~~
type AirlineAPIProps = {
    tableName?: string;
    stageName?: string;
    apiKeyName?: string;
    enableSeed?: boolean;  
};
~~~
Construct public properties
~~~
export class AirlinesApiConstruct extends Construct {
    public readonly api: apigateway.RestApi;
    public readonly table: dynamodb.Table;
    public readonly apiKey: apigateway.ApiKey;
    public readonly getAirlineByIdFn: lambdanode.NodejsFunction;
    public readonly getAllAirlinesFn: lambdanode.NodejsFunction;
    public readonly addAirlineFn: lambdanode.NodejsFunction;
    public readonly deleteAirlineFn: lambdanode.NodejsFunction;
    public readonly deleteAircraftFn: lambdanode.NodejsFunction;
    public readonly getAircraftByIdFn: lambdanode.NodejsFunction;
    public readonly updateAircraftFn: lambdanode.NodejsFunction;
    public readonly airlineTranslationFn: lambdanode.NodejsFunction;
    public readonly seedAirlinesFn?: lambdanode.NodejsFunction;
}
~~~

#### Multi-Stack app 

The app follows a three-tier microservices architecture using AWS CDK, with separate stacks for each concern: a DatabaseStack creating a DynamoDB table for airline data persistence, a LambdaStack containing serverless functions that connect to the database, and an ApiStack configuring API Gateway to these functions as secure REST endpoints with API key authentication.While also offering an alternative single-stack deployment option through a consolidated construct for other scenarios.


#### API Keys

In the CDK app, this is implemented by first creating an API key with new apigateway.ApiKey() and specifying a name via the apiKeyName property. Next, a usage plan is created with new apigateway.UsagePlan() and associated with the API stage. The API key is then linked to this usage plan using usagePlan.addApiKey(apiKey). Finally, each API route that needs protection is configured with the apiKeyRequired: true parameter when defining methods. When deployed, clients must include this key in the x-api-key header of their requests.


