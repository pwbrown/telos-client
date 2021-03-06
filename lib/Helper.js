/**
 * Helper methods used by Client and Connection
 * @copyright Philip Brown 2018 
 * @module Helper 
 */

/** DETAILED TYPE DEFINITIONS FOR INTELLISENSE */

/**
 * @typedef {Object} ArgConfig
 * @property {!Number} arg The position of the argument
 * @property {?String} [name="UNKNOWN"] An optional name for the argument. Used for debugging only
 * @property {?String} [type=null] An optional string representing the expected type of the argument (Uses the "type-check" module syntax)
 * @property {?Number} [min=null] An optional minimum value for Number type arguments
 * @property {?Number} [max=null] An optional miximum value for Number type arguments
 * @property {?String} [mod=null] An optional modifer function name for string arguments (ex. "toUpperCase")
 * @property {?Object[]} [opts=null] An optional array of whitelisted values where the argument value must match one
 * @property {?} [default=null] An optional value to use if an error occurs or the value is not in the opts array
 */

/**
 * @typedef {Object} MethodConfig
 * @property {?String} [op=get] The LWCP operation (defaults to "get")
 * @property {?(String|Number|ArgConfig)} [id=null] The LWCP sub object id
 * @property {?(String[]|PropertyConfig[])} [props=null] The props to append to the request
 * @property {?Boolean} [cb=false] Whether the method returns a value or not
 * @property {?Boolean} [studioReq=true] Whether the method requires a selected studio (default to true)
 * @property {?Boolean} [loginRequired=true] Whether the method requires authentication (defaults to true)
 */

/**
 * @typedef {Object} PropertyConfig
 * @property {!String} property The Name of the property to append
 * @property {?(String|ArgConfig)} [value=null] The value of the property
 */

/**
 * DEPENDENCIES
 */
const tc = require('type-check').typeCheck,
    lwcp = require('lwcp');

/**
 * Takes in a parsed LWCP string and returns a condensed string that represents a unique key for that request
 * @param {!Object} config The parsed output of "lwcp.parse"
 */
var uniqueKey = exports.uniqueKey = function(config){
    if(config === null) return null;
    var key = "";
    key += config.obj || "";
    key += config.sub || "";
    key += config.id || "";
    if(config.props){
        for(var propName in config.props){
            key += propName;
        }
    }
    return key;
}

/**
 * Parses through our method model to generate prototype methods on the referenced class
 * @param {!Object} classRef A reference to a class to attach the prototype methods to
 * @param {!Model} model The model on which to build the methods
 */
exports.buildClassMethodsFromModel = function(classRef, model){
    if(tc('Object', model)){
        for(var obj in model){
            for(var method in model[obj]){
                classRef.prototype[method] = buildClientMethod(method, obj, model[obj][method]);
            }
        }
    }
}

/**
 * Class prototype method factory for creating lwcp request methods that send tcp requests and optionally listen for specific responses
 * @param {!String} method The name of the method. Only used for debugging purposes
 * @param {!String} obj The string representation of the LWCP object and optional sub object
 * @param {!MethodConfig} config The remaining configuration to setup the method
 */
function buildClientMethod(method, obj, config){
    return function(){
        /** STORE ARGUMENTS REFERENCE TO THIS CLOSURE */
        var args = arguments;
        /** SEND BACK A PROMISE TO ENABLE USE OF ASYNC AWAIT */
        return new Promise(resolve => {
            /** GET THE OPERATION AND OBJECT */
            var operation = tc('String', config.op) && config.op !== ''? config.op : 'get';
            var object = obj;
            /** PERFORM LOGIN AND STUDIO CHECKS BEFORE PROCEEDING */
            var loginRequired = tc('Boolean', config.loginRequired)? config.loginRequired : true;
            var studioRequired = tc('Boolean', config.studioReq)? config.studioReq : true;
            if(loginRequired && !this.__loggedIn)
                return resolve(this.__log.error(`The method '${method}' requires authentication. Please login first.`));
            if(studioRequired && !this.__studioSelected)
                return resolve(this.__log.error(`The method '${method}' requires a selected studio. Please select a studio first.`));
            /** PARSE THE SUB OBJECT ID IF AVAILABLE */
            var subobjectId = getSubObjectId.call(this, method, args, config.id);
            if(subobjectId === null) //This means that an error occurred
                return resolve(null);
            /** BUILD THE PROPERTIES STRING */
            var props = getProps.call(this, method, args, config.props);
            if(props === null) return resolve(null); 
            /** BUILD THE FULL LWCP REQUEST STRING */
            var request = `${operation} ${object}${subobjectId? '#'+subobjectId.trim():''}${props}`;
            /** SETUP THE EVENT LISTENER IF THE METHOD EXPECTS A VALUE IN RETURN */
            if(config.cb){
                var errorListener = null;
                var errorKey = null;
                /** GENERATE OUR LISTENER KEY */
                if(config.op && config.op === 'login')
                    var key = 'loggedIn';
                else if(config.op === 'select')
                    var key = 'studioSelected';
                else if(config.op === 'select_show')
                    var key = 'showSelected';
                else if(config.op === 'ping')
                    var key = 'pong';
                else
                    var key = uniqueKey(lwcp.parse(request, true));
                if(!key){
                    this.__log.error(`Unable to generate a key for method ${method}`);
                    return resolve(null);
                }
                /** Create our response listener */
                var responseListener = function(data){
                    /** Remove the error listener if available */
                    if(errorListener !== null)
                        this.removeListener(errorKey, errorListener);
                    return resolve(data);
                }.bind(this)
                /** Create an error listener if needed */
                if(operation === 'get' && object === 'studio.line' && tc('String', subobjectId)){
                    var errorKey = object + subobjectId;
                    errorListener = function(){
                        /** Remove the response listener since an error occurred */
                        this.removeListener(key, responseListener);
                        return resolve(null);
                    }.bind(this);
                    this.once(errorKey, errorListener);
                }
                /** Start our response listener */
                this.once(key, responseListener);
                this.write(request);
            }
            /** SIMPLY PERFORM THE REQUEST AND RESOLVE THE PROMISE IF NO RETURN VALUE IS EXPECTED */
            else{
                this.write(request);
                return resolve(true);
            }
        })
    }
}

/**
 * Attempts to retrieve the sub object id
 * @param {!String} method Method name for debugging purposes
 * @param {!Object[]} args The arguments array for the initial method call 
 * @param {?(String|ArgConfig)} [config=null]
 * @returns {!(String|null)} The sub object id
 */
function getSubObjectId(method, args, config){
    if(tc('Undefined', config))
        return '';
    if(tc('String', config) && config !== '')
        return config;
    if(tc('Object', config)){
        var idVal = getPropArgValue.call(this, method, args, config);
        return idVal;
    }
}

/**
 * Builds the properties string of the LWCP request
 * @param {!String} method Method name for debugging purposes 
 * @param {!Object[]} args The arguments array for the initial method call 
 * @param {?(String[]|PropertyConfig[])} props An array of properties to generate strings of
 * @returns {!(String|null)} Properties string or null if an error occurred
 */
function getProps(method, args, props){
    if(!tc('Array', props)) return '';
    var propString = '';
    for(var i = 0; i < props.length; i++){
        var append = null;
        if(tc('String', props[i]) && props[i] !== '')
            append = props[i];
        else if(tc('Object', props[i]) && tc('String', props[i].property) && props[i].property !== ''){
            var name = props[i].property;
            if(tc("Undefined", props[i].value))
                append = name;
            else if(!tc('Object', props[i].value) || props[i].value === null){
                var value = stringifyPropValue(props[i].value);
                append = `${name}=${value}`;
            }else if(tc('Object',props[i].value) && !tc("Number", props[i].value.length)){
                var value = getPropArgValue.call(this, method, args, props[i].value);
                if(!value && props[i].value.optional)
                    continue;
                if(!value)
                    return null;
                if(value)
                    append = `${name}=${value}`;
            }
        }
        if(append)
            propString += `${propString === ''? ' ' : ', '}${append}`;
    }
    return propString;
}

/**
 * Handles validating and retrieving a value from one of the arguments
 * @param {!String} method The method name used for debugging 
 * @param {!Object[]} args The arguments array from the method call
 * @param {!ArgConfig} config The configuration object to retrieve the value from the argument
 */
function getPropArgValue(method, args, config){
    var name = config.name || "UNKNOWN";
    if(!tc('Number', config.arg))
        return this.__log.error(`INVALID MODEL: Expected an 'arg' value for the property '${name}' of the method '${method}'`);
    var pos = Math.floor(config.arg);
    if(pos < 0)
        return this.__log.error(`INVALID MODEL: Invalid 'arg' value for the property '${name}' of the method '${method}'`);
    if(tc('Undefined', args[pos]))
        return checkForDefault.call(this, `Missing ${config.key?'object attribute':'argument'} '${name}' at position ${pos} of the method '${method}'`, config);
    var argValue = args[pos];
    var positionalId = "argument";
    if(tc('String',config.key)){
        if(!tc('Object',argValue))
            return checkForDefault.call(this, `Expected the argument at position ${pos} of the method '${method}' to be an object`);
        positionalId = "object attribute";
        if(tc('Undefined',argValue[config.key]))
            return checkForDefault.call(this, `Missing ${positionalId} '${name}' at position ${pos} of the method '${method}'`, config);
        argValue = argValue[config.key];    
    }
    if(tc('String', config.type) && !tc(config.type, argValue))
        return checkForDefault.call(this, `Invalid ${positionalId} type for '${name}' at position ${pos} of the method '${method}' -> Expected '${config.type.toLowerCase()}' and got '${typeof argValue}'`,config, true);
    if(tc('Number', argValue) && tc('Number', config.min) && argValue < config.min)
        return checkForDefault.call(this, `Invalid ${positionalId} number value for '${name}' at position ${pos} -> The minimum value is ${config.min}`,config, true);
    if(tc('Number', argValue) && tc('Number', config.max) && argValue > config.max)
        return checkForDefault.call(this, `Invalid ${positionalId} number value for '${name}' at position ${pos} -> The maximum value is ${config.max}`,config, true);
    if(tc('String', argValue) && tc('String', config.mod) && tc('Function', argValue[config.mod]))
        argValue = argValue[config.mod]();
    if(tc('Array', config.opts) && config.opts.length > 0 && config.opts.indexOf(argValue) === -1)
        return checkForDefault.call(this, `Invalid ${positionalId} for '${name}' at position ${pos} -> Got '${argValue}' but expected it to be '${config.opts.join(" OR ")}'`, config, true);
    return stringifyPropValue(argValue);
}

/**
 * Checks for a default and logs the error message if not found
 * @param {!String} errorMessage An error message to log if a default was not found
 * @param {!ArgConfig} config 
 */
function checkForDefault(errorMessage, config, ignoreOptional){
    if(!ignoreOptional && tc('Boolean', config.optional) && config.optional)
        return null;
    if(tc("Undefined", config.default))
        return this.__log.error(errorMessage);
    this.__log.warning(`${errorMessage}: USING DEFAULT VALUE '${config.default}'`);
    return stringifyPropValue(config.default);
}

/**
 * Handles converting normal Javascript types into LWCP expected values
 * @param {*} value A value to convert
 */
function stringifyPropValue(value){
    /** STRING VALUES GET WRAPPED IN DOUBLE QUOTES */
    if(tc('String', value))
        return `"${value}"`;
    /** BOOLEANS ARE CONVERTED TO UPPERCASE STRING VERSIONS */
    if(tc('Boolean', value))
        return value? "TRUE" : "FALSE";
    /** NUMBERS ARE CONVERTED TO STRINGS */
    if(tc('Number', value))
        return `${value}`;
    /** NULL VALUES ARE CONVERTED TO THE STRING 'NULL' */
    if(tc('Object', value) && value === null)
        return `NULL`;
    return '';
}