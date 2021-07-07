import { v4 as uuidV4 } from 'uuid';

/**
 * 电话类型
 * */
export class CallDirection {
    static Outgoing = 'outgoing';
    static Incoming = 'incoming';
}

/**
 * 电话状态
 * */
export class CallStatus {
    static Waiting = 'waiting';
    static Connected = 'connected';
    static Disconnected = 'disconnected';
    static Cancel = 'cancel';
    static Reject = 'reject';
}

/**
 * Call 用于记录当前通话的相关内容
 * */
class Call {
    constructor(direction, callId, originUserId, originUserName, peerUserId, peerUserName, status = CallStatus.Waiting) {
        this.direction = direction;
        this.callId = callId;
        this.originUserId = originUserId;
        this.originUserName = originUserName;
        this.peerUserId = peerUserId;
        this.peerUserName = peerUserName;
        this.status = status;
    }

    get callParams() {
        return {
            direction: this.direction,
            callId: this.callId,
            originUserId: this.originUserId,
            originUserName: this.originUserName,
            peerUserId: this.peerUserId,
            peerUserName: this.peerUserName,
        };
    }

    updateStatusAndGen = (status) => {
        return new Call(this.direction, this.callId,
            this.originUserId, this.originUserName,
            this.peerUserId, this.peerUserName,
            status);
    }
}

/**
 * OutgoingCall 拨出电话
 * */
export class OutgoingCall extends Call {
    constructor({originUserId, originUserName, peerUserId, peerUserName}) {
        super(
            CallDirection.Outgoing, uuidV4(),
            originUserId, originUserName, peerUserId, peerUserName
        );
    }
}

/**
 * IncomingCall 拨入电话
 * */
export class IncomingCall extends Call {
    constructor({callId, originUserId, originUserName, peerUserId, peerUserName}) {
        super(
            CallDirection.Incoming, callId,
            originUserId, originUserName, peerUserId, peerUserName
        );
    }
}

/**
 * 客户端和服务器的交互命令
 *
 * @param Registration 注册
 * @param Invite 请求通话
 * @param Connect 对方接听后，下发的连接命令
 * @param Disconnect 通话双方中的任意一方挂断电话后，服务器发出的断开命令
 * */
export class Commands {
    static Registration = 'registration';
    static Invite = 'invite';
    static Connect = 'connect';
    static Disconnect = 'disconnect';
}

/**
 * 不同命令下不同的动作
 * */
export class Actions {
    static Ring = 'ring';
    static Cancel = 'cancel';
    static Busy = 'busy';
    static Reject = 'reject';
    static Answer = 'answer';
    static Handoff = 'handoff';
}

export default class CallKit {
    constructor() {
        this.websocket = new WebSocket('ws://localhost:5000/my-call');
        this.websocket.onmessage = ev => {
            const messageData = JSON.parse(ev.data);
            const {type, action, ...callParams} = messageData;
            const {_onInvite, _onConnect, _onDisconnect} = this;
            if (type === 'invite') {
                if (_onInvite) {
                    _onInvite(action, callParams);
                }
            } else if (type === 'connect') {
                const {session} = messageData;
                if (_onConnect) {
                    _onConnect(session);
                }
            } else if (type === 'disconnect') {
                if (_onDisconnect) {
                    _onDisconnect();
                }
            }
        };
    }

    init = (userId, userName) => {
        this.userId = userId;
        this.userName = userName;
        this.websocket.send(JSON.stringify({
            type: Commands.Registration,
            userId, userName,
        }));
    }

    call = (peerUserId, peerUserName) => {
        const {_onCall} = this;
        if (_onCall) {
            _onCall(peerUserId, peerUserName);
        }
        this.websocket.send(JSON.stringify({
            type: Commands.Invite,
            action: Actions.Ring,
            originUserId: this.userId,
            originUserName: this.userName,
            peerUserId, peerUserName,
        }))
    }

    cancel = (call) => {
        this.websocket.send(JSON.stringify({
            type: Commands.Invite,
            action: Actions.Cancel,
            ...call.callParams,
        }));
    }

    reject = (call) => {
        this.websocket.send(JSON.stringify({
            type: Commands.Invite,
            action: Actions.Reject,
            ...call.callParams,
        }));
    }

    answer = (call) => {
        this.websocket.send(JSON.stringify({
            type: Commands.Invite,
            action: Actions.Answer,
            ...call.callParams,
        }));
    }

    handoff = (call) => {
        this.websocket.send(JSON.stringify({
            type: Commands.Disconnect,
            action: Actions.Handoff,
            ...call.callParams,
        }));
    }
}