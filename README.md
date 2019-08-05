# easy-grpc-server 

This is a quick and easy way to bootstrap and/or mock gRPC service with NodeJs having only services
definitions, given as a set of protobuf files.

## Installation

You can install easy-grpc-server via a package manager:
```shell script
$ npm install easy-grpc-server --save
```

## Usage

  ### Proto files
  
  Before start initializing server you have to define one or more import directories where roots of protobuf
   files tree resides. 
  
   Your protobuf sources may contain imports of the messages defined in the other protobuf files.
  
   There is no need to define an import directory for the Google Proto API files. They will be imported automatically. 

  ### Quick start
  
  The basic example of how to start gRPC server. No service method handlers were defined here.
  Every call will return `Unimplemented` gRPC error.
  ```javascript 1.7
const {GRPCServer, GRPCError} = require('easy-grpc-server');

( async () => {
    const server = new GRPCServer({
            protoPaths: [
                'xcorp/protobuf/parking/parking_service.proto'
            ],
            includeDirs: [
                '/Users/myuser/work/xcorp/parking-proto/src/main/proto'
            ],
            services: [
                'xcorp.protobuf.parking.ParkingService'
            ],
            port: 50051,
            secure: false,
            logger: console
    });
    try {
        await server.start();
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
        process.exit(1);
    }
})();

```
  
  
 
 ### GRPCServer API (in pseudo TS types notation)
 
 #### `constructor(settings: ServerSettings)`
 Constructs GRPCServer instance. 
 #### Server settings
  In order to properly init server you have to work out first the correct set of the 
  server settings.
  Server settings supplied to server constructor as follows:
  ```javascript 1.8
/**
 * Server settings
 *
 * @typedef {Object} ServerSettings
 * @property {string[]} protoPaths
 * @property {string[]} includeDirs
 * @property {string[]} services
 * @property {number} port
 * @property {boolean} secure
 * @property {Object} logger
 */
```
- `includeDirs` is a list of directories where your proto files packages tree resides
- `protoPaths` is a list of proto files which contains service definitions you want to implement. You have to supply
  relative path to one of the directories defined in the `includeDirs`
- `services` is a list of service definitions you want the server to implement. Full name including packages must be specified.
  For example `xcorp.protobuf.parking.ParkingService`
- `port` is port number server will be bound to
- `secure` is a boolean flag specifying if we want to run secured communication or opentext http/2.0 calls.
  Currently, the only an insecure option is supported.
 
 #### `start(): Promise<number>`
 
 An async function that starts the server and returns port server was bound to.
 
 #### `addHandler(service: string, method: string, handler: (call: object, callback: Function) => void)`
 
 This method assigns handled to the given service object (for example `xcorp.protobuf.parking.ParkingService`)
 and chosen method (for example `addCar`).
 The handler must be a function that accepts two parameters
 - `call` - gRPC call context
 - `callback` - classic JS callback `(error, result)` function. Error supplie to callback must be of `GRPCError` type
     ```javascript 1.8
    
    const {GRPCServer, GRPCError, status} = require('easy-grpc-server');
    
    const err = new GRPCError(status.INVALID_ARGUMENT, 'Car plate number is invalid', carPlate)
    ```
    For good explanation how to write handlers and use callbacks please check the article
    [gRPC Basics - Node.js](https://grpc.io/docs/tutorials/basic/node/).

 ### Mocking
 Initially, this project was made for quick mocking of the third party gRPC services for the 
  local development. Some mock related helper functions will be added to the project over time.
  At the moment there is one helper Handler Factory - `Matching Handler Factory`
 
 #### Matching Handler
 The idea behind Matching Handler that you define a list of matching patterns for the request and 
  the typical response for the corresponded pattern.
  The matching pattern has a structure `{match: object, reply: object}`.
```javascript 1.8
    const easyGRPC = require('easy-grpc-server');
    const matchingHandlerFactory = easyGRPC.handlers.matchingHandler;
    
    server.addHandler(
            'xcorp.protobuf.parking.ParkingService',
            'CurrentBilling',
            matcherFactory(
                [
                    {
                        match: {
                            plate: 'ABC1234'
                        },
                        reply: {
                            plate: 'ABC1234',
                            billing: {
                                startTime: 1564981295210,
                                plan: 'WORKDAY',
                                billedTime: 360000,
                                sum: 200,
                                vat: 36
                            }
                        }
                    }
                ]
            )
        );
```


