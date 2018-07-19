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
 * @property {?Object[]} [opts=null] An optional array of whitelisted values that the argument must be
 * @property {?} [default=null] An optional value to use if an error occurs or the values is not in the opts array
 */

/**
 * @typedef {Object} MethodConfig
 * @property {?String} [op=get] The LWCP operation (defaults to "get")
 * @property {?(String|Number|ArgConfig)} [id=null] The LWCP sub object id
 * @property {?(String[]|PropertyConfig[])} [props=null] The props to append to the request
 * @property {?Boolean} [cb=false] Whether the method returns a value or not
 * @property {?Boolean} [studioReq=true] Whether the method requires a selected studio (default to true)
 * @property {?Boolean} [loginRequired=false] Whether the method requires authentication (defaults to true)
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
 * 
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
            /** BUILD THE PROPERTIES STRING */
            var props = getProps.call(this, method, args, config.props);
            if(props === null) return resolve(null); 
            /** BUILD THE FULL LWCP REQUEST STRING */
            var request = `${operation} ${object}${subobjectId? '#'+subobjectId.trim():''}${props}`;
            /** SETUP THE EVENT LISTENER IF THE METHOD EXPECTS A VALUE IN RETURN */
            if(config.cb){
                if(config.op && config.op === 'login')
                    var key = 'loggedIn';
                else
                    var key = uniqueKey(lwcp.parse(request, true));
                this.once(key, (data) => {
                    return resolve(data);
                })
                this.write(request);
            }
            /** SIMPLY PERFORM THE REQUEST AND RESOLVE THE PROMISE IF NO RETURN VALUE IS EXPECTED */
            else{
                this.write(request);
                return resolve();
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
        return null;
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
        return this.__log.error(`Missing argument '${name}' at position ${pos} of the method '${method}'`);
    var argValue = args[pos];
    if(tc('String', config.type) && !tc(config.type, argValue))
        return checkForDefault.call(this, `Invalid argument type for '${name}' at position ${pos} of the method '${method}' -> Expected '${config.type.toLowerCase()}' and got '${typeof argValue}'`,config);
    if(tc('Number', argValue) && tc('Number', config.min) && argValue < config.min)
        return checkForDefault.call(this, `Invalid argument number value for '${name}' at position ${pos} -> The minimum value is ${config.min}`,config);
    if(tc('Number', argValue) && tc('Number', config.max) && argValue > config.max)
        return checkForDefault.call(this, `Invalid argument number value for '${name}' at position ${pos} -> The maximum value is ${config.max}`,config);
    if(tc('String', argValue) && tc('String', config.mod) && tc('Function', argValue[config.mod]))
        argValue = argValue[config.mod];
    return stringifyPropValue(argValue);
}

/**
 * Checks for a default and logs the error message if not found
 * @param {!String} errorMessage An error message to log if a default was not found
 * @param {!ArgConfig} config 
 */
function checkForDefault(errorMessage, config){
    if(tc("Undefined", config.default))
        return this.__log.error(errorMessage);
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