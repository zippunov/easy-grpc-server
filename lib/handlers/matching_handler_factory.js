'use strict';

const _ = require('lodash');
const grpc = require('grpc');
const GRPCError = require('../grpc_error');
const Joi = require('@hapi/joi');

const matcherSchema = Joi.array().items({
    match: Joi.any(),
    reply: Joi.any()
});

module.exports = matches => {
    const validationErr = matcherSchema.validate(matches).error;
    if (matcherSchema.validate(matches).error) {
        throw validationErr;
    }
    /** @type {object[]} */
    const m = _.clone(matches);
    return (call, callback) => {
        const match = m.filter(el => _.isMatch(call.request, el.match)).shift();
        if (!match) {
            return callback(new GRPCError(grpc.status.UNKNOWN, 'No match to request', call.request), null);
        }
        return callback(null, match.reply);
    };
};
