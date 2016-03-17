/**
 * File: retryTransaction.js
 * Type: Helper Module
 * Retries transactions that are blocked.
 */

// Based on https://github.com/mickhansen/retry-as-promised/blob/master/index.js
// This will probably be included in sequelize soon and can be removed once it is.
var Sequelize = require('sequelize');

function defineRetryTransaction(sequelize) {
  /**
   * Will create a transaction and try it until success, up to a specified max tries.
   * Retries only if a concurrency issue occurs (postgres error codes 40001 and 40P01).
   * Defaults to 3 total tries, transaction isolation level REPEATABLE READ.
   * 
   * @param  {Function} callback [Function that returns a promise]
   * @return {Promise}           [encapsulates callback with transaction]
   */
  return async(function* tryTransaction(callback, options) {
    options = options || {};
    options.maxTries = options.maxTries || 3;
    options.isolationLevel = options.isolationLevel || 'REPEATABLE READ';

    for (var currentTry = 0; currentTry < options.maxTries; currentTry++ ) {
      try {
        return yield sequelize.transaction({ isolationLevel: options.isolationLevel }, callback);
      }
      catch (e) {
        // only retry if transaction failed due to concurrent access
        if (!(e instanceof Sequelize.DatabaseError) ||
            (e.original.code !== '40001' &&
             e.original.code !== '40P01'))
          throw e;

        Log.warn('Transaction failed due to concurrent access. (' + e.message + ') Retrying...');
      }
    }
    throw new CustomError.TransactionRetryLimit(options.maxTries);
  });
}

module.exports = defineRetryTransaction;
