/**
 * Client methods to interact with the server.
 * Extends both the Connection class and the EventEmitter Class
 * @copyright Philip Brown 2018
 * @module Client
 */

/**
 * DEPENDENCIES
 */
const Connection = require('./Connection'),
    Helper = require('./Helper'),
    Model = require('./Model');

/**
 * Definition for the Configuration Object of the Client
 * @typedef {Object} ClientConfig
 * @property {?String} [log=null] Optional string to specify the types of log messages to display
 */

/**
 * @class
 * @classdesc Derives from the Connection class and exposes methods to interact with the Telos Server
 * @augments Connection
 */
class Client extends Connection{
    /**
     * Sets up the client
     * @param {?ClientConfig} [config=null] 
     */
    constructor(config){
        super(config);
        this.__loggedIn = false;
        this.__studioSelected = false;
        /** TRACK WHETHER THE CLIENT IS LOGGED IN */
        this.on('loggedIn', (isLoggedIn) => this.__loggedIn = isLoggedIn);
        /** TRACK WHETHER THE CLIENT HAS SELECTED A STUDIO */
        this.on('studioSelected', (selected) => this.__studioSelected = selected);
    }
}

/**
 * The Client class has all of its methods built on the fly
 * from the model defined in ./Model.js
 * Refer to documentation or the ./Model.js file for a list of available methods
 */
Helper.buildClassMethodsFromModel(Client, Model);

/** EXPORT THE CLIENT CLASS */
module.exports = Client;