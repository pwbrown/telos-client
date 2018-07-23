/**
 * Prints messages to the console by message type and only if a user allows that type
 * @copyright Philip Brown 2018
 * @module Log
 */

/**
 * DEPENDENCIES
 */
const clc = require('cli-color'),        /** For chaning the color of console messages */
    tc = require('type-check').typeCheck,
    st = require('stack-trace').get;

/**
 * @class
 * @classdesc Used for logging messages to the console based on the level of debugging
 */
class Log{
    /**
     * Sets the default debugging level for logging
     */
    constructor(){
        this.__showError = false;
        this.__showTrace = false;
        this.__showIn = false;
        this.__showOut = false;
        this.__showWarning = false;
    }
    /**
     * Prints error messages and optional stack traces
     * @param {!String} msg The error message
     */
    error(msg){
        if(this.__showError){
            console.log(clc.red("✘        ERROR: ") + msg);
        }
        if(this.__showError && this.__showTrace){
            /** GET THE STACK TRACE FROM RIGHT HERE */
            var trace = st();
            printStackTrace(trace);
        }
        return null;
    }
    /**
     * Prints warning messages to the console
     * @param {!String} msg The warning message 
     */
    warning(msg){
        if(this.__showWarning){
            console.log(clc.yellow("!      WARNING: ") + msg);
        }
    }
    /**
     * Prints input messages
     * @param {!String} data 
     */
    input(data){
        if(this.__showIn){
            console.log(clc.green("⬅        INPUT: ") + data);
        }
    }
    /**
     * Prints output messages
     * @param {!String} data 
     */
    output(data){
        if(this.__showOut){
            console.log(clc.green("➡       OUTPUT: ") + data);
        }
    }
    /**
     * Overrides the default watchers
     * @param {String} watchers The debugging watchers
     */
    setWatchers(watchers){
        if(tc('String', watchers) && watchers !== ''){
            watchers = watchers.split(":");
            watchers = watchers.map((item) => {
                item = item.trim();
                if(item === '')
                    return null;
                else
                    return item.toLowerCase();
            }).filter((item) => {
                return item !== null;
            })
            if(watchers.indexOf('error') !== -1 || watchers.indexOf('errors') !== -1 || watchers.indexOf('err') !== -1)
                this.__showError = true;
            if(watchers.indexOf('trace') !== -1 || watchers.indexOf('stack') !== -1 || watchers.indexOf('stack trace') !== -1|| watchers.indexOf('stacktrace') !== -1)
                this.__showTrace = true;
            if(watchers.indexOf('input') !== -1 || watchers.indexOf('in') !== -1 || watchers.indexOf('request') !== -1 || watchers.indexOf('req') !== -1)
                this.__showIn = true;
            if(watchers.indexOf('output') !== -1 || watchers.indexOf('out') !== -1|| watchers.indexOf('response') !== -1|| watchers.indexOf('res') !== -1)
                this.__showOut = true;
            if(watchers.indexOf('warning') !== -1 || watchers.indexOf('warnings') !== -1 || watchers.indexOf('warn') !== -1)
                this.__showWarning = true;
        }
    }
}

/**
 * Prints out the stack trace except for the first item
 * @param {!Object[]} trace An array of stack trace objects
 */
function printStackTrace(trace){
    if(tc('Array', trace) && trace.length > 0){
        trace.splice(0,1); //Remove the first since it's just the Log method
        for(var i = 0; i < Math.min(trace.length, 8); i++){
            if(i === 0)
                console.log(clc.magenta("!  STACK TRACE: ") + trace[i].toString());
            else
                console.log(`                ${trace[i].toString()}`);
        }
    }
}

/** EXPORT THE LOG CLASS */
module.exports = Log;