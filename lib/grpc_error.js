'use strict';

const grpc = require('grpc');

/**
 * GRPCError
 */
class GRPCError
    extends Error {
    /**
     * @param {number} status grpc.status.*
     * @param {string} message
     * @param {*} details
     */
    constructor(status, message, details) {
        super(message);
        /** @public */
        this.code = status || grpc.status.UNKNOWN;
        /** @public */
        this.details = details ? JSON.stringify(details) : '';
    }
}

module.exports = GRPCError;
