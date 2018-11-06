/**
 * @copyright Philip Brown 2018
 * @module Model
 */

/**
 * Defines the configuration of every type of write to the server.
 *  Each key represents an object namespace in the Livewire control protocol
 *  Each key inside an object namespace represents the name of the method to create
 */
module.exports = {
    'cc': {
        studioList: {
            props: ['studio_list'],
            studioReq: false,
            cb: true
        },
        date: {
            props: ['date'],
            studioReq: false,
            cb: true
        },
        getServer: {
            props: ['server_id','server_version','server_caps','lwcp_version'],
            loginRequired: false,
            studioReq: false,
            cb: true
        },
        setMode: {
            op: 'set',
            studioReq: false,
            props: [
                { property: 'mode', value: {arg:0,type:'String',mod:'toUpperCase',name:'Mode',opts:['TALENT','PRODUCER'],default:'TALENT'} }
            ]
        },
        login: {
            op: 'login',
            props: [
                { property: 'user', value: {arg:0,type:'String',name:'Username',default:'user'} },
                { property: 'password', value: {arg:1,type:'String',name:'Password',default:''} }
            ],
            loginRequired: false,
            studioReq: false,
            cb: true
        },
        ping: {
            op: 'ping',
            studioReq: false,
            loginRequired: false,
            cb: true
        }
    },
    'studio': {
        getStudio: {
            props: ['id', 'name', 'show_id', 'show_name', 'num_lines', 'num_hybrids', 'num_hyb_fixed', 'next', 'pnext', 'busy_all', 'mute', 'show_locked', 'auto_answer'],
            cb: true
        },
        showList: {
            props: ['show_list'],
            cb: true
        },
        lineList: {
            props: ['line_list'],
            cb: true
        },
        hybridList: {
            props: ['hybrid_list'],
            cb: true
        },
        selectStudio: {
            op: 'select',
            props: [
                { property: 'id', value: {arg:0,name:'Studio ID',type:'Number',min:0} }
            ],
            studioReq: false,
            cb: true
        },
        selectShow: {
            op: 'select_show',
            props: [{
                property: 'id',
                value: {arg:0,name:'Show',type:'Number',min:1}
            }],
            cb: true
        },
        im: {
            op: 'im',
            props: [
                { property: 'from', value: {arg:0,name:'From User',type:'String'} },
                { property: 'message', value: {arg:1,name:'Message Text',type:'String'} }
            ]
        },
        setBusyAll: {
            op: 'busy_all',
            props: [
                { property: 'state', value: {arg:0,name:'All Busy State',type:'Boolean',default:true}}
            ]
        },
        dropHybrid: {
            op: 'drop',
            props: [
                { property: 'hybrid', value: {arg:0,name:'Hybrid line ID',type:'Number',min:0} }
            ]
        },
        holdHybrid: {
            op: 'hold',
            props: [
                { property: 'hybrid', value: {arg:0,name:'Hybrid line ID',type:'Number',min:0} }
            ]
        }
    },
    'studio.line': {
        getLine: {
            id: {arg:0,name:'Line Number',type:'Number',min:1},
            props: ['state','callstate','name','local','remote','hybrid','time','comment','direction','caller_id'],
            cb: true
        },
        getCallerId: {
            id: {arg:0,name:'Line Number',type:'Number',min:1},
            props: ['caller_id'],
            cb: true
        },
        setLineComment: {
            op: 'set',
            id: {arg: 0, name:'Line Number',type:'Number',min:1},
            lineState:{not:['IDLE']},
            props: [
                { property: 'comment', value: {arg:1,name:'Comment',type:'String'}}
            ]
        },
        setCallerId: {
            op: 'set',
            id: {arg:0,name:'Line Number',type:'Number',min:1},
            lineState:{not:['IDLE']},
            props: [
                { property: 'caller_id', value: {arg:1,name:'Caller ID',type:'String'}}
            ]
        },
        seizeLine: {
            op: 'seize',
            id: {arg:0,name:'Line Number',type:'Number',min:1}
        },
        callLine: {
            op: 'call',
            id: {arg:0,name:'Line Number',type:'Number',min:1},
            props: [
                { property: 'number', value: {arg:1,name:'Remote Number',type:'String'} },
                { property: 'handset', value: {arg:2,key:'handset',name:'Handset',type:'Boolean',optional:true} },
                { property: 'hybrid', value: {arg:2,key:'hybrid',name:'Hybrid',type:'Number',optional:true} },
                { property: 'port', value: {arg:2,key:'port',name:'Port',type:'Number',optional:true} }
            ]
        },
        takeLine: {
            op: 'take',
            id: {arg:0,name:'Line Number',type:'Number',min:1},
            props: [
                { property: 'handset', value: {arg:1,key:'handset',name:'Handset',type:'Boolean',optional:true} },
                { property: 'hybrid', value: {arg:1,key:'hybrid',name:'Hybrid ID',type:'Number',optional:true} }
            ]
        },
        takeNext: {
            op: 'take'
        },
        dropLine: {
            op: 'drop',
            id: {arg:0,name:'Line Number',type:'Number',min:1}
        },
        lockLine: {
            op: 'lock',
            id: {arg:0,name:'Line Number',type:'Number',min:1},
            lineState:{is:['ON_AIR']}
        },
        unlockLine: {
            op: 'unlock',
            id: {arg:0,name:'Line Number',type:'Number',min:1},
            lineState:{is:['ON_AIR_LOCKED']}
        },
        holdLine: {
            op: 'hold',
            id: {arg:0,name:'Line Number',type:'Number',min:1},
            props: [
                { property: 'ready', value: {arg:1,name:'Ready State',type:'Boolean',default:false} }
            ]
        },
        raiseLine: {
            op: 'raise',
            id: {arg:0,name:'Line Number',type:'Number',min:1}
        }
    },
    'studio.book': {
        recordCount: {
            props: ['count'],
            cb:true
        },
        recordList: {
            props: [
                'list',
                { property: 'range', value: {arg: 0,name:'List Range',type:'(Number,Number)',optional:true} }
            ],
            cb:true
        },
        addRecord: {
            op: 'add',
            props: [
                { property: 'type', value: {arg:0,key:'type',name:'type',type:'String',mod:'toUpperCase',opts:['GLOBAL','STUDIO','SHOW'],optional:true} },
                { property: 'name', value: {arg:0,key:'name',name:'name',type:'String'} },
                { property: 'number', value: {arg:0,key:'number',name:'number',type:'String'} }
            ]
        },
        updateRecord: {
            op: 'set',
            id: {arg:0,name:'Record Number',type:'Number',min:1},
            props: [
                { property: 'type', value: {arg:1,key:'type',name:'type',type:'String',mod:'toUpperCase',opts:['GLOBAL','STUDIO','SHOW'],optional:true} },
                { property: 'name', value: {arg:1,key:'name',name:'name',type:'String',optional:true} },
                { property: 'number', value: {arg:1,key:'number',name:'number',type:'String',optional:true} }
            ]
        },
        deleteRecord: {
            op: 'del',
            id: {arg:0,name:'Record Number',type:'Number',min:1}
        }
    },
    'studio.log': {
        logCount: {
            props: ['count'],
            expects: {
                'count': {name: 'logCount'}
            },
            cb:true
        },
        logList: {
            props: [
                'list',
                { property: 'range', value: {arg: 0,name:'List Range',type:'(Number,Number)',optional:true} }
            ],
            expects: {
                'list': {name: 'logList', each: ['lineStartTime','lineDuration','lineDirection','lineLocal','lineRemote','lineCallerId']}
            },
            cb:true
        }
    },
}