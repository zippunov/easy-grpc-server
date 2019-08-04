'use strict';

const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const protoLoader = require('@grpc/proto-loader');
const grpc = require('grpc');
const GRPCError = require('./grpc_error');

const googleProtoFilesPath = module.paths
    .filter(p => p.endsWith('node_modules'))
    .map(p => path.join(p, 'google-proto-files'))
    .find(p => {
        try {
            // eslint-disable-next-line no-sync
            fs.statSync(p);
            return true;
        } catch (err) {
            return false;
        }
    });

const defaultHandler = (call, callback) => {
    callback(new GRPCError(grpc.status.UNIMPLEMENTED, 'Not implemented', null));
};

/**
 * Server settings
 *
 * @typedef {Object} ServerSettings
 * @property {string[]} protoPaths
 * @property {string[]} includeDirs
 * @property {string[]} services
 * @property {number} port
 * @property {boolean} secure
 */

/**
 * GRPCServer
 */
class GRPCServer {
    /**
     * @param {ServerSettings} opts
     */
    constructor(opts) {
        /** @private @type {number} */
        this.port = opts.port;
        /** @private @type {string[]} */
        this.protoPaths = opts.protoPaths || [];
        /** @private @type {string[]} */
        this.includeDirs = _.concat([], googleProtoFilesPath, opts.includeDirs || []);
        /** @private @type {string[]} */
        this.services = opts.services || [];
        /** @private @type {object} */
        this.credentials = grpc.ServerCredentials.createInsecure();
        /** @private @type {object} */
        this.handlers = {};
    }

    /**
     * @public
     * @param {string} service
     * @param {string} method
     * @param {Function} handler
     * @returns {void}
     */
    addHandler(service, method, handler) {
        this.handlers[service] = this.handlers[service] || {};
        this.handlers[service][method] = handler;
    }

    /**
     * @private
     * @param {string} service
     * @param {string} method
     * @returns {Function}
     */
    getHandler(service, method) {
        if (this.handlers[service] && this.handlers[service][method]) {
            return this.handlers[service][method];
        }
        return defaultHandler;
    }

    /**
     * @private
     * @param {module:grpc.Server} server
     * @param {module:grpc.GrpcObject} protoDescriptor
     * @returns {void}
     */
    setServices(server, protoDescriptor) {
        this.services.forEach(serviceName => {
            const serviceDefinition = _.get(protoDescriptor, serviceName);
            const implementation = _.keys(serviceDefinition.service).reduce((res, callName) => {
                res[callName] = this.getHandler(serviceName, callName);
                return res;
            }, {});
            server.addService(serviceDefinition.service, implementation);
        });
    }

    /**
     * @public
     * @returns {Promise<void>}
     */
    async start() {
        const packageDefinition = await protoLoader.load(
            this.protoPaths,
            {
                keepCase: true,
                longs: String,
                enums: String,
                defaults: true,
                oneofs: true,
                includeDirs: this.includeDirs
            }
        );
        const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
        const server = new grpc.Server();
        this.setServices(server, protoDescriptor);
        const port = await new Promise((resolve, reject) => {
            server.bindAsync(`0.0.0.0:${this.port}`, this.credentials, (err, res) => {
                return err ? reject(err) : resolve(res);
            });
        });
        server.start();
        return port;
    }
}

module.exports = GRPCServer;
