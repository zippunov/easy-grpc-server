'use strict';

const _ = require('lodash');
const path = require('path');
const easyGRPC = require('../index');
const matcherFactory = easyGRPC.handlers.matchingHandler;
const protoDir = path.join(__dirname, 'proto');


(async () => {
    const server = new easyGRPC.GRPCServer({
        protoPaths: [
            'xcorp/protobuf/parking/parking_service.proto'
        ],
        includeDirs: [
            protoDir
        ],
        services: [
            'xcorp.protobuf.parking.ParkingService'
        ],
        port: 50051,
        secure: false,
        logger: console
    });
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
    server.addHandler(
        'xcorp.protobuf.parking.ParkingService',
        'CurrentCapacity',
        (call, callback) => {
            const totalSlots = 100;
            const reservedSlots = _.random(0, 20);
            const takenSlots = _.random(0, totalSlots - reservedSlots);
            const availableSlots = totalSlots - reservedSlots - takenSlots;
            return callback(null, {
                totalSlots,
                reservedSlots,
                takenSlots,
                availableSlots
            });
        }
    );
    try {
        const port = await server.start();
        console.log(`gRPC server listening port ${port}`);
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
        process.exit(1);
    }
})();
