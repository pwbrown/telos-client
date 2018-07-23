/**
 * Required logic to establish a TCP connection with a Telos VX Prime Server
 * @copyright Philip Brown 2018
 * @module Connection
 */

/**
 * DEPENDENCIES
 */
const net = require('net'),                  /**  Built-in: For creating a TCP client */
    rl = require('readline'),                /**  Built-in: For reading an incoming stream one line at a time */
    EventEmitter = require('events'),        /**  Built-in: For dispatching and listening for events */
    Log = require('./Log'),                  /**     Local: For sending messages to the console */
    lwcp = require('lwcp'),                  /** 3rd-Party: For parsing LWCP (Livewire control protocol) strings into useable objects */
    tc = require('type-check').typeCheck,    /** 3rd-Party: For perform cleaner type checking */
    helper = require('./Helper');            /**     Local: Methods to help with common tasks */

/**
 * @class
 * @classdesc Handles client TCP socket layer connections and parses incoming lwcp data
 * @augments EventEmitter
 */
class Connection extends EventEmitter{
    /**
     * Sets up our connection by creating a log, a socket, and a readline interface
     * @param {?Object} config
     * @param {?String} config.log A "colon"(:) seperated string of values representing log statements to print 
     */
    constructor(config){
        super();
        /** CONNECTION DETAILS */
        this.__host = null;
        this.__port = 20518;      //Default port
        if(tc('String', config.host) && config.host !== '')
            this.__host = config.host;
        if(tc('Number', config.port) && config.port > 0)
            this.__port = config.port;
        /** CREATE A LOG INSTANCE */
        this.__log = new Log();
        /** CONFIGURE OUR LOG TO PRINT SPECIFIC MESSAGE TYPES */
        if(tc('Object', config) && tc('String', config.log) && config.log !== '')
            this.__log.setWatchers(config.log);
        /** CREATE THE SOCKET AND SET ITS ENCODING TYPE */
        this.socket = new net.Socket();
        this.socket.setEncoding('utf8');
        //Redirect socket messages to our own event emitter
        this.socket.on('connect', (e) => this.emit('socketConnect', e));
        this.socket.on('error', (e) => this.emit('socketError', e));
        //Create our readline interface and start listening on the socket
        this.rl = rl.createInterface({
            input: this.socket,
            terminal: true
        })
        this.rl.on('line', this.onLine.bind(this));
    }
    /**
     * Method for setting the host address or changing an existing address
     * @param {!String} host The host address of the Telos VX Prime Server 
     */
    setHost(host){
        if(tc('String', host) && host !== '')
            this.__host = host;
    }
    /**
     * Method for setting the host port or changing the existing port
     * @param {!Number} port The port of the Telos VX Prime Server (defaults to 20518) 
     */
    setPort(port){
        if(tc('Number', port) && port > 0)
            this.__port = Math.floor(port);
    }
    /**
     * Method for connecting to the server.
     * Uses the stored host and port. (The host must be initialiazed first)
     * Will timeout after 5 seconds if it fails to connect
     * @async
     * @returns {Promise<boolean>} Connected Successfully
     */
    connect(){
        return new Promise(resolve => {
            /** CHECK THE HOST */
            if(this.__host === null){
                this.__log.error("The host address has not been set");
            }
            /** SET A ONE-TIME LISTENER FOR OUR SOCKET CONNECTION */
            this.once('socketConnect', () => {
                /** REMOVE THE TIMEOUT ON SUCCESS */
                this.resetTimeout();
                return resolve(true);
            })
            /** ATTEMPT TO CONNECT */
            this.socket.connect(this.__port, this.__host);
            /** SET A TIMEOUT OF 5 SECONDS TO FIRE ON FAILURE */
            this.resetTimeout();
            this.timeout = setTimeout(() => {
                this.socket.destroy();
                this.removeAllListeners('socketConnect');
                this.__log.error("Failed to connect to the server");
                return resolve(false);
            }, 5000);
        })
    }
    /**
     * Sends a string over the socket connection
     * @param {!String} msg The string value to send over the socket connection 
     */
    write(msg){
        if(tc('String', msg) && msg !== ''){
            this.socket.write(msg + "\n");
            this.__log.output(msg);
        }
    }
    /**
     * Receives an incoming line message from the socket connection.
     * Automatically parses the connection and handles emitting appropriate events.
     * @param {!String} data Unparsed string from the socket
     */
    onLine(data){
        if(tc('String', data) && data !== ''){
            /** LOG THE RAW UNPARSED DATA */
            this.__log.input(data);
            /** PARSE THE DATA INTO A READABLE OBJECT */
            data = lwcp.parse(data, true);
            if(!data) return;
            /** HANDLE PING RETURNS */
            if(data.op === 'pong')
                this.emit('pong', true);
            /** HANDLE USER-INITIATED REQUEST RESPONSES */
            else if(data.op === 'indi'){
                var key = helper.uniqueKey(data);
                var returnData = data.props || {};
                if(data.sub && data.id) returnData[data.sub] = data.id;
                this.emit(key, returnData);
            }
            /** HANDLE THE LOGIN RESPONSE */
            else if(data.op === 'ack'){
                this.handleAck(data);
            }
            /** HANDLE EVENTS AND UPDATES */
            else if(data.op === 'event' || data.op === 'update'){
                /** STUDIO EVENTS */
                if(data.obj === 'studio' && data.sub === null){
                    /** HANDLE INSTANT MESSAGE */
                    if(tc('Object', data.props) && tc('String', data.props.from) && tc('String', data.props.message)){
                        this.emit('im', data.props);
                        return;
                    }
                    if(tc('Object', data.props) && tc('Number', data.props.studioId))
                        this.emit('studioSelected', data.props.studioId > 0);
                    if(tc('Object', data.props) && tc('Number', data.props.showId))
                        this.emit('showSelected', data.props.showId > 0);
                    this.emit('studio', data.props);
                }
                /** LINE EVENTS */
                else if(data.obj === 'studio' && data.sub !== null && data.sub === 'line' && data.id !== null)
                    this.emit('line', {line: data.id, data: data.props});
                /** BOOK EVENTS */
                else if(data.obj === 'studio' && data.sub !== null && data.sub === 'book')
                    this.emit('book', {book: data.id, data: data.props});
            }
        }
    }
    /**
     * Removes and resets the timeout associated with socket connection
     */
    resetTimeout(){
        if(this.timeout){
            clearTimeout(this.timeout);
            this.timeout = null;
        }
    }
    /**
     * Handles common ack responses
     * @param {!Object} data 
     */
    handleAck(data){
        /** Login Acknowlegement */
        if(data.obj === 'cc' && tc('Object', data.props) && tc('Boolean', data.props.logged))
            this.emit('loggedIn', data.props.logged);
        /** Studio Selection Error */
        else if(data.obj === 'studio' && checkErrorMessage(data, 'Studio with id does not exist')){
            this.__log.error('TELOS ERROR MESSAGE -> ' + data.props.$msg);
            this.emit('studioSelected', false);
        }
        /** Show Selection Error */
        else if(data.obj === 'studio' && checkErrorMessage(data, 'Show does not exist')){
            this.__log.error('TELOS ERROR MESSAGE -> ' + data.props.$msg);
            this.emit('showSelected', false);
        }
        /** Studio Line Id Error */
        else if(data.obj === 'studio' && data.sub === 'line' && tc('String', data.id) && checkErrorMessage(data, 'Nonexisting line')){
            this.__log.error('TELOS ERROR MESSAGE -> ' + data.props.$msg);
            this.emit(`${data.obj}.${data.sub}${data.id}`);
        }
    }
}

function checkErrorMessage(data, matchString){
    var toMatch = new RegExp(matchString, 'i');
    if(tc('Object', data.props) && tc('String', data.props.$status) && data.props.$status.match(/err/i) && tc('String', data.props.$msg) && data.props.$msg.match(toMatch))
        return true;
    return false;
}

/** EXPORT THE CONNECTION CLASS */
module.exports = Connection;