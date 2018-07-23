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
    Model = require('./Model'),
    tc = require('type-check').typeCheck;

/**
 * Definition for the Configuration Object of the Client
 * @typedef {Object} ClientConfig
 * @property {?String} [log=null] Specify the types of log messages to display
 * @property {?String} [host=null] Specify the host address to connect to
 * @property {?Number} [port=20518] Specify the port to connect on (default to 20518)
 * @property {?Number} [studioId=1] Specify a default studio id to connect to (defaults to 1)
 * @property {?String} [username='user'] Specify the authentication username (defaults to 'user')
 * @property {?String} [password=''] Specify the authentication password (defaults to '')
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
        if(!tc('Object', config))
            config = {};
        super(config);
        this.__loggedIn = false;
        this.__studioSelected = false;
        this.__username = 'user';
        this.__password = '';
        this.__studioId = 1;
        this.setUsername(config.username);
        this.setPassword(config.password);
        this.setStudioId(config.studioId);
        /** TRACK WHETHER THE CLIENT IS LOGGED IN */
        this.on('loggedIn', (isLoggedIn) => this.__loggedIn = isLoggedIn);
        /** TRACK WHETHER THE CLIENT HAS SELECTED A STUDIO */
        this.on('studioSelected', (selected) => this.__studioSelected = selected);
    }
    setUsername(username){
        if(tc('String', username) && username !== '')
            this.__username = username;
    }
    setPassword(password){
        if(tc('String', password) && password !== '')
            this.__password = password;
    }
    setStudioId(studioId){
        if(tc('Number', studioId) && studioId > 0)
            this.__studioId = studioId
    }
    connectLoginSelect(){
        return new Promise(async resolve => {
            if(!tc('String', this.__host) || this.__host === '')
                return resolve(this.__log.error(`The host address was not initialized before calling 'connectLoginSelect'`));
            var success = await this.connect();
            if(!success)
                return resolve(false);
            var loggedIn = await this.login(this.__username, this.__password);
            if(!loggedIn)
                return resolve(false);
            var studioSelected = await this.selectStudio(this.__studioId);
            if(!studioSelected)
                return resolve(false);
            return resolve(true);
        })
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