[![CircleCI](https://circleci.com/gh/pwbrown/telos-client.svg?style=svg)](https://circleci.com/gh/pwbrown/telos-client)

# telos-client
An interactive TCP client abstraction for the Telos VX Prime phone server.

# Table Of Contents
* [Overview](#overview)
* ['telos-client' vs. 'vx-client'](#telos-client-vs.-vx-client)
* [Note on Promises](#note-on-promises)
* [Disclaimer on Active Development](#disclaimer)
* [Installation](#installation)
* [Basic Usage](#basic-usage)
* [Configuring the Client](#configuring-the-client)
    * [Using options](#via-options)
    * [Using methods](#via-methods)
* [Console Logging](#console-logging)
    * [Enabling Message Types](#enabling-console-message-types)
* [Events](#events)
    * ['studio'](#studio)
    * ['line'](#line)
    * ['book'](#book)
    * ['im' (Instant Message)](#im)
* [Getting Started](#getting-started)
    * [Connecting](#connecting)
    * [Logging In](#logging-in)
    * [Selecting a Studio](#selecting-a-studio)
    * [Shortcut](#shortcut)
        * [Flow without Shortcut](#flow-without-shortcut)
        * [Shortcut Method](#shortcut-method)
        * [Flow with Shortcut](#flow-with-shortcut)
* [Server Methods](#server-methods)
    * [cc](#cc----general-server-methods)
        * [getServer](#GET:-getServer)
        * [studioList](#GET:-studioList)
        * [date](#GET:-date)
        * [ping](#ACTION:-ping)
        * [setMode](#ACTION:-setMode)
        * [login](#ACTION:-login)
    * [studio](#studio----studio-methods)
        * [getStudio](#GET:-getStudio)
        * [showList](#GET:-showList)
        * [lineList](#GET:-lineList)
        * [hybridList](#GET:-hybridList)
        * [selectStudio](#ACTION:-selectStudio)
        * [selectShow](#ACTION:-selectShow)
        * [im](#ACTION:-im)
        * [setBusyAll](#ACTION:-setBusyAll)
        * [dropHybrid](#ACTION:-dropHybrid)
        * [holdHybrid](#ACTION:-holdHybrid)
    * [studio.line](#studio.line----studio-line-methods)
        * [getLine](#GET:-getLine)
        * [getCallerId](#GET:-getCallerId)
        * [setLineComment](#ACTION:-setLineComment)
        * [setCallerId](#ACTION:-setCallerId)
        * [seizeLine](#ACTION:-seizeLine)
        * [callLine](#ACTION:-callLine)
        * [takeLine](#ACTION:-takeLine)
        * [takeNext](#ACTION:-takeNext)
        * [dropLine](#ACTION:-dropLine)
        * [lockLine](#ACTION:-lockLine)
        * [unlockLine](#ACTION:-unlockLine)
        * [holdLine](#ACTION:-holdLine)
        * [raiseLine](#ACTION:-raiseLine)


# Overview
Telos Client is Node.js implementation of the interactive TCP protocol used by "Telos VX Prime" VoIP (Voice over IP) phone systems. The Livewire Control Protocol "LWCP" used by the VX-Prime server is designed to allow direct interaction with the system to monitor the state of the studio and its phone lines, and perform actions on the system. Telos client is a simple, clean API for managing a connection with the VX-Prime server, listening for studio changes, and performing actions within the studio.

# Telos Client vs. VX Client
Telos Client can be considered as version 1.0.0 of the package "vx-client" as it performs the same functionality. The reason that telos client is a seperate package is because it does not offer legacy syntax support for systems already using vx-client. Telos Client has a nearly identical set of methods, but the logging system is brand new and the entire library is strictly Promise based to adopt a more modern feel whereas vx-client is strictly callback based.

# Note on Promises
The decision to adopt a Promise based system for Telos Client was made to result in a cleaner implementation when incoporated into an application.

***PLEASE READ THIS***: Every implementation of Promises in this library will **NEVER** "reject", but instead will resolve a "null" value in the case of an error. This was decided to reduce the subjectively unappealing usage of try/catch statements in application code to catch errors. Instead, if the Promise resolves a null value, you can use the built in logging system to print out errors, warnings, stack traces, and I/O messages from the server in order to debug unexpected behavior.

# Disclaimer
This library is in active developement and will be tested over time. The syntax of this library will not change dramatically over the period of testing, but the functionality may change.  Use at your own risk.

# Installation
## Yarn
    $ yarn add telos-client
## NPM
    $ npm install --save telos-client

# Basic Usage
``` Javascript
const TelosClient = require('telos-client');
const client = new TelosClient();

client.setHost('10.1.1.1');

client.connect().then(async function(success){
    if(success)
        var server = await client.getServer();
})
```

# Configuring the Client
* Most configuration details can be initialized when creating the client. These configuration settings can also easily be overwritten with applicable configuration methods

## Via Options

### new TelosClient([options]);

| Property 	| Description                                                                                                 	| Type   	| Required 	| Default 	|
|----------	|-------------------------------------------------------------------------------------------------------------	|--------	|----------	|---------	|
| log      	| Specify the types of log messages to display. Formatted as a colon separated string (ex. "err:warn:input"). 	| String 	| NO       	|         	|
| host     	| Specify the host address to connect to                                                                      	| String 	| NO       	|         	|
| port     	| Specify the port to connect on                                                                              	| Number 	| NO       	| 20518   	|
| studioId 	| Specify the default studio id to connect to                                                                 	| Number 	| NO       	| 1       	|
| username 	| Specify the username for logging in to the server                                                           	| String 	| NO       	| 'user'  	|
| password 	| Specify the password for logging in to the server                                                           	| String 	| NO       	| ''      	|

## Via Methods

### Set Host Address
    client.setHost(host: String)

### Set Port Number
    client.setPort(port: Number)

### Set Studio ID
    client.setStudioId(studioId: Number)

### Set Username
    client.setUsername(username: String)

### Set Password
    client.setPassword(password: String)

# Console Logging
Telos Client includes a logging system to optimize application building and debugging. There are various different message types that are used throughout the system and can be toggled with the "log" option when configuring the client.

| Message Type 	| Color   	| Description                                                                                                                                                                                                                                                                          	| Aliases                               	|
|--------------	|---------	|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------	|---------------------------------------	|
| error        	| red     	| Error messages are displayed whenever a fatal error occurs as a result of using the library incorrectly or passing an invalid message. Errors will not terminate the application so it is important to enable this option whenever developing to ensure that all errors are noticed. 	| error, errors, err                    	|
| warning      	| orange  	| Warning messages are displayed whenever an error occurs that does not affect the performance of the client and are typically mitigated through the use of default values.                                                                                                            	| warning, warnings, warn               	|
| trace        	| magenta 	| Trace messages are displayed in tandem with error messages if the end-user needs to see the stack trace leading to the error.  They will only display if the error type is also enabled.                                                                                             	| trace, stack, stack trace, stacktrace 	|
| input        	| green   	| Input messages are displayed whenever TCP message is received by the client. Input messages are not parsed other than ignoring trailing or leading whitespace.                                                                                                                       	| input, in, request, req               	|
| output       	| green   	| Output messages are displayed whenever a TCP message is sent by the client. Output messages are the actual representation of what is sent.                                                                                                                                           	| output, out, response, res            	|

## Enabling console message types
```Javascript
const TelosClient = require('telos-client');
const client = new TelosClient({
    
    // Enable message types by passing a ":" seperated string of any combination of message type aliases
    log: "err:in:out"
})
```

# Events
The Telos VX system takes input from many different sources and thus changes frequently while being used.  For many methods that retrieve data, they are tracked and resolved internally as part of the Promise resolution flow.  For any other event triggered by the system, you will need to listen and track them using the events detailed below.

## 'studio'
Studio events are fired whenever a change within the studio has been made. Primarily these are called in response to changes of attributes within the studio such as setting the studio to the "busy all" state.

```Javascript
client.on('studio', (data) => {
    // Analyze studio changes here
})
```

## 'line'
Line events are fired whenever a change is made to a studio line. These can occur from a change requested by the end-user or naturally by the making and receive of calls on the line.  This should be the application's primary way of reacting to changes within the system and staying up to date.
**NOTE**: The "callerId" attribute may not be sent with the line event or the studio even. Be sure to manually [request callerId](#GET:-getCallerId) fields if they are not returned and desired.

```Javascript
client.on('line', (data) => {
    // Analyze line changes here

    // Line events will always include the additional "line" property
    //   This indicates the number of the line that has triggered the event
    console.log(`Line Number: ${data.line}`);
})
```

## 'book'
The book system is not thoroughly documented here as it has been untested. But if you decide to test the methods related to "studio.book", you can listen to the changes here.

```Javascript
client.on('book', (data) => {
    // Analyze book changes here
})
```

## 'im'
Instant messages can be tracked within the selected studio using the 'im' event. Refer to the [im](#ACTION:-im) method for more details on sending messages. Keep in mind that you will only receive instant messages that have been sent within the studio that has been selected.

```Javascript
client.on('im', (data) => {
    console.log(`A message has been sent from "${data.from}": ${data.message}`)
})
```

# Getting Started

***NOTE***: The next three "sub-sections" describe the manual way to connect to the server, login, and select a studio, while the forth section provides a nice ***shortcut*** to condense it all.

## Connecting

### client.connect() : Promise\<boolean\>
* Before calling connect you must set the host address either in the [configuration options](#via-options) or by the method [setHost](#set-host-address)

### Example
``` Javascript
...
client.setHost('your.vxserver.net');

client.connect().then(function(success){
    console.log(success? "Connected" : "Failed to connect");
})
```

## Logging In
***NOTE***: Logging in is a prerequisite for ALL methods except [getServer]().

### client.login([username: String [, password: String]]) : Promise\<boolean\>
* If a username is not passed, it will default to 'user'
* If a password is not passed, it will default to the empty string ''
* The client instance will keep track of whether or not you are logged in for you

### Example
``` Javascript
/** assume we are inside an async function **/
var loggedIn = await client.login('myusername', 'somepassword');
console.log(loggedIn? "Logged in" : "Failed to log in");
```

## Selecting A Studio
***NOTE***: Selecting a studio is a prerequisite for ALL methods except [studioList](), [date](), [getServer](), [setMode](), and [ping]().

### client.selectStudio(studioId: Number) : Promise\<boolean\>
* The studio Id must be greater than 0
* The client instance will keep track of whether or not you are in a studio for you.

### Example
``` Javascript
...
var studioSelected = await client.selectStudio(1);
console.log(studioSelected? "Studio selected": "Studio NOT selected");
```

## Shortcut

### Flow without shortcut
* Because almost every method requires you to be connected, authenticated, and have a studio selected, you will often see this repetitive flow of events.
```
  +----------------+
  |client.connect()| <-------+
  +----------------+         |
          |                  |
          |                  |
          v                  |
   +--------------+          |
   |client.login()|          |
   +--------------+          |
          |                  |
          |                  |
          |                  |
+---------------------+      |
|client.selectStudio()|      |
+---------------------+      |
          |                  |
          |                  |
          v                  |
  +----------------+         |
  |Still Connected?+-----NO--+
  +----------------+
          |     ^
         YES    |
          |     |
          |     |
          v     |
+--------------------------------------+
|client.*() //Execute some other method|
+--------------------------------------+
```

### Shortcut Method
* Since this flow is so common, a built-in method has been included to simplify it

#### client.connectLoginSelect() : Promise\<boolean\>
* This method performs all three actions for you

#### Example
```Javascript
...
var initialized = await client.connectLoginSelect();
console.log(initialized? "Ready to go" : "Something went wrong");
```

### Flow with shortcut

```
+---------------------------+
|client.connectLoginSelect()+<------+
+------------+--------------+       |
             |                      |
             |                      |
             v                      |
     +-------+--------+             |
     |Still Connected?+-----NO------+
     +----+-----------+
          |     ^
         YES    |
          |     |
          |     |
          v     |
+--------------------------------------+
|client.*() //Execute some other method|
+--------------------------------------+

```

# Server Methods
* Each section below outlines the getter and action methods for the respective "object" and "subobject" combinations According to the Livewire Control Protocol Spec pertaining to the VX Prime system

***
## cc -- general server methods

***
### GET: getServer
#### --Purpose
* Get the current state of attributes related to the server
#### --Definition
    getServer() : Promise<Object>
#### --Usage
```Javascript
var Data = await client.getServer();
```
#### --Output "Data"
| Property          	| Description                                                                             	| Type   	|
|-------------------	|-----------------------------------------------------------------------------------------	|--------	|
| serverId          	| This is a read-only string property containing server identification string             	| String 	|
| serverVersion     	| This is a read-only string property containing server version string                    	| String 	|
| serverCapabilites 	| This is a read-only string property containing server capabilities string               	| String 	|
| lwcpVersion       	| This is a read-only integer property containing the VX LWCP version the server is using 	| Number 	|

***
### GET: studioList
#### --Purpose
* Get a read-only list of available studios.
#### --Definition
    studioList() : Promise<Object>
#### --Usage
```Javascript
var Data = await client.studioList();
```
#### --Output "Data"
| Property   	| Description                                                                	| Type  	|
|------------	|----------------------------------------------------------------------------	|-------	|
| studioList 	| This is a read-only list property containing the list of available studios 	| Array of Objects	|

#### --studioList Array element object definition
| Property   	| Description                                     	| Type   	|
|------------	|-------------------------------------------------	|--------	|
| studioId   	| A read-only property for the id of a studio     	| Number 	|
| studioName 	| A read-only property for the name of the studio 	| String 	|

***
### GET: date
#### --Purpose
* Get a read-only string property mostly used for the VX phones to set their time because they don't have any RTC. ISO 8601 Date String Format.
#### --Definition
    date() : Promise<Object>
#### --Usage
```Javascript
var Data = await client.date();
```
#### --Output "Data"
| Property 	| Description                                                                                                                           	| Type   	|
|----------	|---------------------------------------------------------------------------------------------------------------------------------------	|--------	|
| date     	| This is a read-only string property mostly used for the VX phones to set their time because they don't have any RTC. ISO 8601 Formatted. 	| String 	|

***
### ACTION: ping
#### --Purpose
* To test if VX server is still alive.
#### --Definition
    ping() : Promise<Boolean>
#### --Usage
```Javascript
var pong = await client.ping();
if(!pong)
    console.log("Server connection has died");
```

***
### ACTION: setMode
#### --Purpose
* Write-only operation to tell the server of the current client's mode
#### --Definition
    setMode(mode: String) : Promise
#### --Arguments
| Property 	| Description                                                                                                                                                        	| Default 	| Type   	|
|----------	|--------------------------------------------------------------------------------------------------------------------------------------------------------------------	|---------	|--------	|
| mode     	| This is a write-only enumerated property that tells server of a current client mode. Must be one of two possible values: "TALENT" or "PRODUCER" (case insensitive) 	| TALENT  	| String 	|
#### --Usage
```Javascript
//This method does not produce a response
await client.setMode();
```

***
### ACTION: login
* Refer to the [Logging In](#logging-in) section in [Getting Started](#getting-started)

## studio -- Studio Methods

***
### GET: getStudio
#### --Purpose
* Get the state of attributes related to the currently selected studio
#### --Definition
    getStudio() : Promise<Object>
#### --Usage
```Javascript
var Data = await client.getStudio()
```
#### --Output "Data"
| Property             	| Description                                                                                                                                                            	| Type    	|
|----------------------	|------------------------------------------------------------------------------------------------------------------------------------------------------------------------	|---------	|
| studioId             	| This is a read-only integer property containing studio ID.                                                                                                             	| Number  	|
| studioName           	| This is a read-only string property containing studio name.                                                                                                            	| String  	|
| showId               	| This is a read-only integer property containing currently selected show ID.                                                                                            	| Number  	|
| showName             	| This is a read-only string property containing the name of currently selected show.                                                                                    	| String  	|
| numberOfLines        	| This is a read-only integer property containing the total number of lines in the selected studio.                                                                      	| Number  	|
| numberOfHybrids      	| This is a read-only integer property containing the total number of configured hybrids (fixed + selectable) in this studio.                                            	| Number  	|
| numberOfFixedHybrids 	| This is a read-only integer property containing the number of configured fixed hybrids in this studio.                                                                 	| Number  	|
| next                 	| This is a read-only integer property which holds the ID number of the line that will be taken when take next operation is used. This is the queue for “TALENT” mode.   	| Number  	|
| producerNext         	| This is a read-only integer property which holds the ID number of the line that will be taken when take next operation is used. This is the queue for “PRODUCER” mode. 	| Number  	|
| allBusy              	| This is a read-only enumerated boolean property that tells if the studio is in “busy all” state.                                                                       	| Boolean 	|
| muted                	| This is a read-only enumerated boolean property that tells if the “mute” flag was set in this studio.                                                                  	| Boolean 	|
| showLocked           	| This is a read-only enumerated boolean property that tells if the selected show is locked in this studio.                                                              	| Boolean 	|
| autoAnswerOn         	| This is a read-only enumerated boolean property that tells if the “auto_answer” flag was set in this studio.                                                           	| Boolean 	|

***
### GET: showList
#### --Purpose
* Get the list of shows in the currently selected studio
#### --Definition
    showList() : Promise<Object>
#### --Usage
```Javascript
var Data = await client.showList();
```
#### --Output "Data"
| Property 	| Description                                                                               	| Type             	|
|----------	|-------------------------------------------------------------------------------------------	|------------------	|
| showList 	| This is a read-only list property containing the list of available shows for this studio. 	| Array of Objects 	|

#### --studioList Array element object definition
| Property 	| Description               	| Type   	|
|----------	|---------------------------	|--------	|
| showId   	| The unique id of the show 	| Number 	|
| showName 	| The name of the show      	| String 	|

***
### GET: lineList
#### --Purpose
* Get the list of lines and their attributes in the currently selected studio
#### --Definition
    lineList() : Promise<Object>
#### --Usage
```Javascript
var Data = await client.lineList();
```
#### --Output "Data"
| Property 	| Description                                                               	| Type             	|
|----------	|---------------------------------------------------------------------------	|------------------	|
| lineList 	| This is a read-only list property containing the list of available lines. 	| Array of Objects 	|

#### --lineList Array element object definition
| Property  	| Description                                                                                                                                                                                                             	| Type   	|
|-----------	|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------	|--------	|
| state     	| This is a read-only enumerated property that holds the current state of the line.                                                                                                                                       	| String 	|
| callstate 	| This is a read-only enumerated property that holds the current state of the call that resides on this line.                                                                                                             	| String 	|
| name      	| This is a read-only string property that holds the name of the line.                                                                                                                                                    	| String 	|
| local     	| This is a read-only string property that holds the local number of the line dialing which the call will be assigned to this line.                                                                                       	| String 	|
| remote    	| This is a read-only string property that holds the remote number which has called this line.                                                                                                                            	| Number 	|
| hybrid    	| This is a read-only integer property that holds the hybrid currently assigned to this line.                                                                                                                             	| Number 	|
| time      	| This is a read-only integer property that holds the time that passed from the beginning of the call in seconds. It resets when the line state is changed to a different one.                                            	| Number 	|
| comment   	| This is a read-write string property that holds the comment assigned to this line. Comment will reset when the call is dropped. Also comment can only be set when line state is not idle, when there is an active call. 	| String 	|
| direction 	| This is a read-only enumerated property that holds the direction of the call. Can be on of three values                                                                                                                 	| String 	|

***
### GET: hybridList
#### --Purpose
* Get the list of hybrid lines in the currently selected studio
#### --Definition
    hybridList() : Promise<Object>
#### --Usage
```Javascript
var Data = await client.hybridList();
```
#### --Output "Data"
| Property 	| Description                                                               	| Type             	|
|----------	|---------------------------------------------------------------------------	|------------------	|
| hybridList 	| This is a read-only list property containing the list of configured hybrids in this studio. List elements are strings with hybrid names. 	| Array 	|

***
### ACTION: selectStudio
#### --Purpose
* Selected a studio on the server
#### --Definition
    selectStudio(studioId: Number) : Promise<Boolean>
#### --Arguments
| Property 	| Description                    	| Default 	| Type   	|
|----------	|--------------------------------	|---------	|--------	|
| studioId 	| The ID or Number of the studio 	|         	| Number 	|
#### --Usage
```Javascript
var selected = await client.selectStudio(1);
if(!selected)
    console.log("Failed to select a studio");
```

***
### ACTION: selectShow
#### --Purpose
* Select a show within the currently selected studio
#### --Definition
    selectShow(showId: Number) : Promise<Boolean>
#### --Arguments
| Property 	| Description                    	| Default 	| Type   	|
|----------	|--------------------------------	|---------	|--------	|
| showId 	| The ID or Number of the show within the selected studio 	|      1   	| Number 	|
#### --Usage
```Javascript
var selected = await client.selectShow(1);
if(!selected)
    console.log("Failed to select a show");
```

***
### ACTION: im
#### --Purpose
* Send an instant message to all other clients within the currently selected studio
#### --Definition
    im(from: String, message: String) : Promise
#### --Arguments
| Property 	| Description     	| Default 	| Type   	|
|----------	|-----------------	|---------	|--------	|
| from     	| Sender's name   	|         	| String 	|
| message  	| Message to send 	|         	| String 	|
#### --Usage
```Javascript
await client.im("Me", "Hello World");
```

***
### ACTION: setBusyAll
#### --Purpose
* Set the state of all lines in the studio to busy or not busy
#### --Definition
    setBusyAll(state: Boolean) : Promise
#### --Arguments
| Property 	| Description                             	| Default 	| Type    	|
|----------	|-----------------------------------------	|---------	|---------	|
| state    	| Whether to set all lines to busy or not 	| true    	| Boolean 	|
#### --Usage
```Javascript
await client.setBusyAll(false);
```

***
### ACTION: dropHybrid
#### --Purpose
* Drop the call on a hybrid line
#### --Definition
    dropHybrid(hybrid: Number) : Promise
#### --Arguments
| Property 	| Description                	| Default 	| Type   	|
|----------	|----------------------------	|---------	|--------	|
| hybrid   	| The id for the hybrid line 	|         	| Number 	|
#### --Usage
```Javascript
await client.dropHybrid(1);
```

***
### ACTION: holdHybrid
#### --Purpose
* Hold the call on a hybrid line
#### --Definition
    holdHybrid(hybrid: Number) : Promise
#### --Arguments
| Property 	| Description                	| Default 	| Type   	|
|----------	|----------------------------	|---------	|--------	|
| hybrid   	| The id for the hybrid line 	|         	| Number 	|
#### --Usage
```Javascript
await client.holdHybrid(1);
```

## studio.line -- studio line methods

***
### GET: getLine
#### --Purpose
* Get the attributes of a specific line
#### --Definition
    getLine(lineId: Number) : Promise<Object>
#### --Arguments
| Property 	| Description                          	| Default 	| Type   	|
|----------	|--------------------------------------	|---------	|--------	|
| lineId   	| The number of the line to operate on 	|         	| Number 	|
#### --Usage
```Javascript
var Data = await client.getLine(1);
```
#### --Output "Data"

***
### GET: getCallerId
#### --Purpose
* Get the caller ID value of a specific line
#### --Definition
    getCallerId(lineId: Number) : Promise<Object>
#### --Arguments
| Property 	| Description                          	| Default 	| Type   	|
|----------	|--------------------------------------	|---------	|--------	|
| lineId   	| The number of the line to operate on 	|         	| Number 	|
#### --Usage
```Javascript
var Data = await client.getCallerId(1);
```
#### --Output "Data"

***
### ACTION: setLineComment
#### --Purpose
* Set the comment string of a specific line. Can only be set when not "IDLE"
#### --Definition
    setLineComment(lineId: Number, comment: String) : Promise
#### --Arguments
| Property 	| Description                            	| Default 	| Type   	|
|----------	|----------------------------------------	|---------	|--------	|
| lineId   	| The number of the line to operate on   	|         	| Number 	|
| comment  	| The comment text to assign to the line 	|         	| String 	|
#### --Usage
```Javascript
await client.setLineComment(1, "Caller Name: John Smith, Topic: Programming");
```

***
### ACTION: setCallerId
#### --Purpose
* Set the caller ID string of a specific line. Can only be set when not "IDLE"
#### --Definition
    setCallerId(lineId: Number, callerId: String) : Promise
#### --Arguments
| Property 	| Description                                	| Default 	| Type   	|
|----------	|--------------------------------------------	|---------	|--------	|
| lineId   	| The number of the line to operate on       	|         	| Number 	|
| callerId 	| The caller id string to assign to the line 	|         	| String 	|
#### --Usage
```Javascript
await client.setCallerId(1, "John Smith");
```

***
### ACTION: seizeLine
#### --Purpose
* Reserve the specified line for the current client so that nobody can call from it except the client
#### --Definition
    seizeLine(lineId: Number) : Promise
#### --Arguments
| Property 	| Description                          	| Default 	| Type   	|
|----------	|--------------------------------------	|---------	|--------	|
| lineId   	| The number of the line to operate on 	|         	| Number 	|
#### --Usage
```Javascript
await client.seizeLine(3);
```

***
### ACTION: callLine
#### --Purpose
* Creates all call to the specified number and puts it on a hybrid or handset
#### --Definition
    callLine(lineId: Number, number: String [, additionalConfig: Object]) : Promise
#### --Arguments
| Property         	| Description                                      	| Default 	| Type   	|
|------------------	|--------------------------------------------------	|---------	|--------	|
| lineId           	| The number of the line to operate on             	|         	| Number 	|
| number           	| The remote number to call                        	|         	| String 	|
| additionalConfig 	| Additional configuration settings detailed below 	|         	| Object 	|
#### --additionalConfig - Definition
| Property 	| Description                                                                               	| Default 	| Type    	| Required 	|
|----------	|-------------------------------------------------------------------------------------------	|---------	|---------	|----------	|
| handset  	| If true the hybrid option will be considered otherwise the port option will be considered 	|         	| Boolean 	| No       	|
| hybrid   	| The identifier for which hybrid to use in the call                                        	|         	| Number  	| No       	|
| port     	| The port to use in the call                                                               	|         	| Number  	| No       	|
#### --Usage
```Javascript
await client.callLine(1,'18001231234');
```

***
### ACTION: takeLine
#### --Purpose
* Takes the call on the specified line to the air on.
#### --Definition
    takeLine(lineId: Number [, additionalConfig: Object]) : Promise
#### --Arguments
| Property         	| Description                                      	| Default 	| Type   	|
|------------------	|--------------------------------------------------	|---------	|--------	|
| lineId           	| The number of the line to take                   	|         	| Number 	|
| additionalConfig 	| Additional configuration settings detailed below 	|         	| Object 	|
#### --additionalConfig - Definition
| Property 	| Description                	| Default 	| Type    	| Required 	|
|----------	|----------------------------	|---------	|---------	|----------	|
| handset  	| Whether to use the handset 	|         	| Boolean 	| NO       	|
| hybrid   	| The hybrid id to use       	|         	| Number  	| NO       	|
#### --Usage
```Javascript
await client.takeLine();
```

***
### ACTION: takeNext
#### --Purpose
* Takes the call on the air specified by the next or producerNext studio attribute depending on the client mode (TALENT or PRODUCER)
#### --Definition
    takeNext() : Promise
#### --Usage
```Javascript
await client.takeNext();
```

***
### ACTION: dropLine
#### --Purpose
* Drops the call on the line specified.
#### --Definition
    dropLine(lineId: Number) : Promise
#### --Arguments
#### --Usage
```Javascript
await client.dropLine(2);
```

***
### ACTION: lockLine
#### --Purpose
* Locks the call on the line specified if the call is "ON_AIR"
#### --Definition
    lockLine(lineId: Number) : Promise
#### --Arguments
| Property 	| Description                          	| Default 	| Type   	|
|----------	|--------------------------------------	|---------	|--------	|
| lineId   	| The number of the line to operate on 	|         	| Number 	|
#### --Usage
```Javascript
await client.lockLine(4);
```

***
### ACTION: unlockLine
#### --Purpose
* Unlocks the call on the line specified if the call is "ON_AIR_LOCKED"
#### --Definition
    unlockLine(lineId: Number) : Promise
#### --Arguments
| Property 	| Description                          	| Default 	| Type   	|
|----------	|--------------------------------------	|---------	|--------	|
| lineId   	| The number of the line to operate on 	|         	| Number 	|
#### --Usage
```Javascript
await client.unlockLine(4);
```

*** 
### ACTION: holdLine
#### --Purpose
* Holds a call in either the "ON_HOLD" OR "ON_HOLD_READ" state
#### --Definition
    holdLine(lineId: Number, ready: Boolean) : Promise
#### --Arguments
| Property 	| Description                                                                                                      	| Default 	| Type   	|
|----------	|------------------------------------------------------------------------------------------------------------------	|---------	|--------	|
| lineId   	| The number of the line to operate on                                                                             	|         	| Number 	|
| ready    	| Specifying true will set the line to "ON_HOLD_READY", whereas setting it to false will set the line to "ON_HOLD" 	| false   	| String 	|
#### --Usage
```Javascript
await client.holdLine(2, false);
```

***
### ACTION: raiseLine
#### --Purpose
* Raises the priority of the selected line in the next queue.
#### --Definition
    raiseLine(lineId: Number) : Promise
#### --Arguments
| Property 	| Description                          	| Default 	| Type   	|
|----------	|--------------------------------------	|---------	|--------	|
| lineId   	| The number of the line to operate on 	|         	| Number 	|
#### --Usage
```Javascript
await client.raiseLine(2);
```