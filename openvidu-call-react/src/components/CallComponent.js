import {Fab, makeStyles} from "@material-ui/core";
import {Phone} from "@material-ui/icons";
import OutgoingComponent from "./call/OutgoingComponent";
import IncomingComponent from "./call/IncomingComponent";
import VideoRoomComponent from "./VideoRoomComponent";
import React, {useEffect, useState} from "react";
import { v4 as uuidV4 } from 'uuid';

const useStyles = makeStyles(theme => ({
    fab: {
        position: "absolute",
        right: theme.spacing(2),
        bottom: theme.spacing(2),
    }
}));

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
    static Idle = 'idle';
    static Waiting = 'waiting';
    static Connected = 'connected';
}

/**
 * Call 用于记录当前通话的相关内容
 * */
class Call {
    constructor(direction, callId, originUserId, originUserName, peerUserId, peerUserName) {
        this.direction = direction;
        this.callId = callId;
        this.originUserId = originUserId;
        this.originUserName = originUserName;
        this.peerUserId = peerUserId;
        this.peerUserName = peerUserName;
        this.status = CallStatus.Idle;
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

    updateStatusAndGen(status) {
        return new Call(this.direction, this.callId,
            this.originUserId, this.originUserName,
            this.peerUserId, this.peerUserName,
            status);
    }
}

/**
 * OutgoingCall 拨出电话
 * */
class OutgoingCall extends Call {
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
class IncomingCall extends Call {
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
class Commands {
    static Registration = 'registration';
    static Invite = 'invite';
    static Connect = 'connect';
    static Disconnect = 'disconnect';
}

/**
 * 不同命令下不同的动作
 * */
class Actions {
    static Ring = 'ring';
    static Cancel = 'cancel';
    static Busy = 'busy';
    static Reject = 'reject';
    static Answer = 'answer';
    static Handoff = 'handoff';
}

const CallComponent = ({userId, userName, peerUserId, peerUserName}) => {

    const classes = useStyles();
    const [socket, setSocket] = useState();
    const [session, setSession] = useState();
    const [currentCall, setCurrentCall] = useState(); // call object

    // 【呼叫方】发起呼叫
    const handleOutgoing = () => {
        const outgoingCall = new OutgoingCall({
            originUserId: userId, originUserName: userName,
            peerUserId, peerUserName
        });
        setCurrentCall(outgoingCall)
        const data = {
            type: Commands.Invite,
            action: Actions.Ring,
            ...outgoingCall.callParams,
        };
        socket.send(JSON.stringify(data));
        setCurrentCall(outgoingCall.updateStatusAndGen(CallStatus.Waiting));
    };

    // 【呼叫方】取消呼叫
    const handleCallCancel = () => {
        const data = {
            type: Commands.Invite,
            action: Actions.Cancel,
            ...currentCall.callParams,
        };
        socket.send(JSON.stringify(data));
        setCurrentCall(undefined);
        // enqueueSnackbar('Cancel', {variant: 'warning', preventDuplicate: true});
    };

    // 【被呼叫方】
    const handleReject = () => {
        const data = {
            type: Commands.Invite,
            action: Actions.Reject,
            ...currentCall.callParams,
        };
        socket.send(JSON.stringify(data));
        setCurrentCall(undefined);
        // enqueueSnackbar('Rejected', {variant: 'warning', preventDuplicate: true});
    };

    const handleAnswer = () => {
        console.log('currentCall', currentCall);
        const data = {
            type: Commands.Invite,
            action: Actions.Answer,
            ...(currentCall.callParams),
        };
        socket.send(JSON.stringify(data));
        setCurrentCall(currentCall.updateStatusAndGen(CallStatus.Connected))
        // enqueueSnackbar('Connected', {variant: 'success', preventDuplicate: true});
    };

    const handleLeaveSession = () => {
        setSession(undefined);
        const data = {
            type: Commands.Disconnect,
            action: Actions.Handoff,
            ...(currentCall.callParams),
        };
        socket.send(JSON.stringify(data));
        setCurrentCall(undefined);
        // enqueueSnackbar('Disconnected', {variant: 'info', preventDuplicate: true});
    };

    const onopen = ev => {
        console.log('WebSocket Open', ev);
    };

    const onerror = ev => {
        console.error('WebSocket Error', ev);
    };

    const onclose = ev => {
        console.error('WebSocket Close', ev);
    };

    const onmessage = ev => {
        console.log('message', ev.data);
        const messageData = JSON.parse(ev.data);
        const {type, action, ...callParams} = messageData;
        if (type === Commands.Invite) {
            if (currentCall) {
                socket.send(JSON.stringify({
                    type: Commands.Invite,
                    action: Actions.Busy,
                    ...callParams,
                }));
                return;
            }
            if (action === Actions.Ring) {
                const incomingCall = new IncomingCall({
                    ...callParams
                });
                setCurrentCall(incomingCall.updateStatusAndGen(CallStatus.Waiting));
            } else if (action === Actions.Cancel) {
                setCurrentCall(undefined);
                // enqueueSnackbar('Cancel', {variant: 'warning', preventDuplicate: true});
            } else if (action === Actions.Busy) {
                setCurrentCall(undefined);
                // enqueueSnackbar('Peer Busy', {variant: 'warning', preventDuplicate: true});
            }
        } else if (type === Commands.Connect) {
            const {session} = messageData;
            setSession(session);
            setCurrentCall(currentCall.updateStatusAndGen(CallStatus.Connected));
            // enqueueSnackbar('Connected', {variant: 'success', preventDuplicate: true});
        } else if (type === Commands.Disconnect) {
            setSession(undefined);
            setCurrentCall(undefined);
            // enqueueSnackbar('Disconnected', {variant: 'info', preventDuplicate: true});
        }
    };

    const createSocket = () => {
        const ws = new WebSocket('ws://localhost:5000/my-call');
        ws.onopen = onopen;
        ws.onerror = onerror;
        ws.onclose = onclose;
        ws.onmessage = onmessage;
        return ws;
    };

    useEffect(() => {
        // create control socket
        if (!socket) {
            setSocket(createSocket());
        }
        // registration or bind the user and the websocket
        if (userId && userName) {
            const data = {
                type: Commands.Registration,
                userId, userName,
            }
            socket.send(JSON.stringify(data));
        }
        // 呼叫
        if (peerUserId && peerUserName && !currentCall) {
            handleOutgoing();
        }
    }, [userId, userName, peerUserId, peerUserName]);

    return (
        <div>
            <Fab color="secondary" className={classes.fab} onClick={handleOutgoing}>
                <Phone/>
            </Fab>
            <OutgoingComponent currentCall={currentCall}
                               handleCancel={handleCallCancel}/>
            <IncomingComponent currentCall={currentCall}
                               handleAnswer={handleAnswer}
                               handleReject={handleReject}
            />
            {
                session && <VideoRoomComponent
                    openviduServerUrl="https://192.168.8.181:4443"
                    sessionName={session}
                    user={userName}
                    leaveSession={handleLeaveSession}
                    // joinSession={() => {
                    //     setIncoming(false);
                    //     setOutgoing(false);
                    // }}
                />
            }
        </div>
    );
};

export default CallComponent;
