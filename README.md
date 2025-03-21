## Serverless REST Assignment - Distributed Systems.

__Name:__ Ayooluwa Oguntuyi (20098135)

__Demo:__ ... link to your YouTube video demonstration ......

### Context.

### Context.

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
+ tags - array<string>  
+ destination - string  

### App API endpoints.

[ Provide a bullet-point list of the app's endpoints (excluding the Auth API) you have successfully implemented. ]
e.g.

## Airlines
### `GET /airlines`- **Description**: Retrieves a list of all airlines. *(Currently commented out in the code)*

### `POST /airlines`- **Description**: Adds a new airline to the database.

## Specific Airline
### `GET /airlines/{airlineId}`- **Description**: Retrieves details of a specific airline using the `airlineId`.

### `DELETE /airlines/{airlineId}`- **Description**: Deletes a specific airline by `airlineId`. *(Currently commented out in the code)*

## Specific Aircraft (Under an Airline)
### `GET /airlines/{airlineId}/{aircraftId}`- **Description**: Retrieves details of a specific aircraft belonging to an airline.

### `DELETE /airlines/{airlineId}/{aircraftId}`- **Description**: Deletes a specific aircraft under a given airline.

### `PUT /airlines/{airlineId}/{aircraftId}`- **Description**: Updates details of a specific aircraft.

## Aircraft Translation
### `GET /airlines/{airlineId}/{aircraftId}/translation`- **Description**: Retrieves translation data for a specific aircraft.

### Features.

#### Translation persistence (if completed)

[ Explain briefly your solution to the translation persistence requirement - no code excerpts required. Show the structure of a table item that includes review translations, e.g.

+ MovieID - number  (Partition key)
+ ActorID - number  (Sort Key)
+ RoleName - string
+ RoleDescription - string
+ AwardsWon - List<string>
+ Translations - ?
]

#### Custom L2 Construct (if completed)

[State briefly the infrastructure provisioned by your custom L2 construct. Show the structure of its input props object and list the public properties it exposes, e.g. taken from the Cognito lab,

Construct Input props object:
~~~
type AuthApiProps = {
 userPoolId: string;
 userPoolClientId: string;
}
~~~
Construct public properties
~~~
export class MyConstruct extends Construct {
 public  PropertyName: type
 etc.
~~~
 ]

#### Multi-Stack app (if completed)

[Explain briefly the stack composition of your app - no code excerpts required.]

#### Lambda Layers (if completed)

[Explain briefly where you used the Layers feature of the AWS Lambda service - no code excerpts required.]


#### API Keys. (if completed)

[Explain briefly how to implement API key authentication to protect API Gateway endpoints. Include code excerpts from your app to support this. ][]

~~~ts
// This is a code excerpt markdown 
let foo : string = 'Foo'
console.log(foo)
~~~

###  Extra (If relevant).

[ State any other aspects of your solution that use CDK/serverless features not covered in the lectures ]

