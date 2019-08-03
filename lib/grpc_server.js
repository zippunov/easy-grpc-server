'use strict';

const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const protoLoader = require('@grpc/proto-loader');
const grpc = require('grpc');
const GrpcError = require('./grps_error');

const getGoogleProtoFilesRoot = () => {
    const baseModulePath = module.paths
        .filter(p => p.endsWith('node_modules'))
        .find(p => {
            try {
                // eslint-disable-next-line no-sync
                fs.statSync(p);
                return true;
            } catch (err) {
                return false;
            }
        });
    return path.join(baseModulePath, 'google-proto-files');
};

const googleProtoFilesPath = getGoogleProtoFilesRoot();

const defaultHandler = (call, callback) => {
    callback(new GrpcError(grpc.status.UNIMPLEMENTED, 'Not implemented', null));
};

/**
 * @param {object} serviceDefinition
 * @returns {Object<String, Function>}
 */
function buildDefaultImplementation(serviceDefinition) {
    return _.keys(serviceDefinition.service).reduce((res, callName) => {
        res[callName] = defaultHandler;
        return res;
    }, {});
}

/**
 * Server props
 *
 * @typedef {Object} ServerSettings
 * @property {string[]} protoPaths
 * @property {string[]} includeDirs
 * @property {string[]} services
 * @property {number} port
 * @property {boolean} secure
 * @property {Object} logger
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
        this.logger = opts.logger || console;
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
     * @param {module:grpc.Server} server
     * @param {module:grpc.GrpcObject} protoDescriptor
     * @returns {void}
     */
    setServices(server, protoDescriptor) {
        this.services.forEach(serviceName => {
            const serviceDefinition = _.get(protoDescriptor, serviceName);
            const implementation = buildDefaultImplementation(serviceDefinition);
            const customHandlers = this.handlers[serviceName];
            _.keys(customHandlers).forEach(method => {
                implementation[method] = customHandlers[method];
            });
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
        this.logger.info(`Starting gRPC server on port ${port}`);
        server.start();
    }
}

module.exports = GRPCServer;
