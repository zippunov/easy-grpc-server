# easy-grpc-server 

This is quick and easy way to bootstrap and/or mock gRPC service with NodeJs having only services
definitions given as a set of protobug files.

## Installation

You can install easy-grpc-server via a package manager:
```shell script
$ npm install easy-grpc-server --save
```

## Usage

  ### Proto files
  
  Before start initialising server you have to define one or more import directories where roots of protobuf
  files tree resides. 

  Your protobuf sources may contain imports of the messages defined in the other protobuf files.

  There is no need to define import directory for the Google Proto API files. They will be imported automatically. 

  ### Init server
  
  Basic example how to start gRPC server. No service method handlers were defined here.
  Every call will return `Unimplementd` gRPC error.
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
- `protoPaths` is a list of proto files which contains service defenitions you want to implement. You have to supply
  relative path to one of the directories defined in the `includeDirs`
- `services` is a list of service definitions you want server to implement. Full name including pakages must be specified.
  For example `xcorp.protobuf.parking.ParkingService`
- `port` is port number server will be bound to
- `secure` is a boolean flag specifying if we want to run secured communication or opentext http/2.0 calls.
 Currently only insecure option is supported.
 
 #### `start(): Promise<number>`
 
 Async function that starts server and returns port server was bound to.
 
 #### `addHandler(service: string, method: string, handler: (call: object, callback: Function) => void)`
 
 This method assings handled to the given service object (for example `xcorp.protobuf.parking.ParkingService`)
 and chosen method (for example `addCar`).
 Handler must be a function that accepts two parameters
 - `call` - gRPC call context
 - `callback` - classic JS callback `(error, result)` function. Error supplie to callback must be of `GRPCError` type
 ```javascript 1.8

const {GRPCServer, GRPCError, status} = require('easy-grpc-server');

const err = new GRPCError(status.INVALID_ARGUMENT, 'Car plate number is invalid', carPlate)
```

