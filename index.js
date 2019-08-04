'use strict';

const GRPCServer = require('./lib/grpc_server');
const GRPCError = require('./lib/grpc_error');
const grpc = require('grpc');
const matchingHandler = require('./lib/handlers/matching_handler_factory');

module.exports = {
    GRPCServer,
    GRPCError,
    status: grpc.status,
    handlers: {
        matchingHandler
    }
};
