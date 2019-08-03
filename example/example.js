'use strict';

const _ = require('lodash');
const GrpsServer = require('../lib/grpc_server');
const matcherFactory = require('../lib/handlers/matching_handler_factory');

(async () => {
    const server = new GrpsServer({
        protoPaths: [
            'camversity/protobuf/discovery/discovery_service.proto'
        ],
        includeDirs: [
            '/Users/zipp/work/cmv-proto/src/main/proto'
        ],
        services: [
            'camversity.protobuf.discovery.DiscoveryService'
        ],
        port: 50051,
        secure: false,
        logger: console
    });
    server.addHandler(
        'camversity.protobuf.discovery.DiscoveryService',
        'GetAllModelTags',
        matcherFactory(
            [
                {
                    match: {},
                    reply: {
                        tags: [
                            {id: 'aaa', name: 'bbb', usageCount: 3},
                            {id: 'ccc', name: 'ddd', usageCount: 8}
                        ]
                    }
                }
            ]
        )
    );
    server.addHandler(
        'camversity.protobuf.discovery.DiscoveryService',
        'HomepageStreamingStatistics',
        (call, callback) => {
            return callback(null, {liveCams: _.random(0, 100), viewers: _.random(0, 10000)});
        }
    );
    try {
        await server.start();
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
        process.exit(1);
    }
})();
