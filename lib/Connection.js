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
                this.emit('pong');
            /** HANDLE USER-INITIATED REQUEST RESPONSES */
            else if(data.op === 'indi'){
                var key = helper.uniqueKey(data);
                this.emit(key, data.props || {});
            }
            /** HANDLE THE LOGIN RESPONSE */
            else if(data.op === 'ack' && data.obj === 'cc'){
                this.emit('loggedIn', (data.props && tc('Boolean', data.props.logged))? data.props.logged : false);
            }
            /** HANDLE EVENTS AND UPDATES */
            else if(data.op === 'event' || data.op === 'update'){
                if(data.obj === 'studio' && data.sub === null)
                    this.emit('studio', data.props);
                else if(data.obj === 'studio' && data.sub !== null && data.sub === 'line' && data.id !== null)
                    this.emit('line', {line: data.id, data: data.props});
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
}

/** EXPORT THE CONNECTION CLASS */
module.exports = Connection;