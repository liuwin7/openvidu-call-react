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
class CallDirection {
    static Outgoing = 'outgoing';
    static Incoming = 'incoming';
}

/**
 * 电话状态
 * */
class CallStatus {
    static Idle = 'idle';
    static Waiting = 'waiting';
    static Connected = 'connected';
    static Disconnected = 'disconnected';
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
}

/**
 * OutgoingCall 拨出电话
 * */
class OutgoingCall extends Call {
    constructor(originUserId, originUserName, peerUserId, peerUserName) {
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
    constructor(originUserId, originUserName, peerUserId, peerUserName) {
        super(
            CallDirection.Incoming, uuidV4(),
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
    const [outgoing, setOutgoing] = useState(false);
    const [incoming, setIncoming] = useState(false);
    const [socket, setSocket] = useState();
    const [session, setSession] = useState();
    const [currentCall, setCurrentCall] = useState(); //

    const handleOutgoing = () => {
        setOutgoing(true);
        const call = {
            peerUserName, peerUserId,
            fromUserName: userName, fromUserId: userId,
        };
        const data = {
            type: Commands.Invite,
            action: Actions.Ring,
            ...call,
        };
        socket.send(JSON.stringify(data));
    };

    const handleCallCancel = () => {
        setOutgoing(false);
        const data = {
            type: Commands.Outgoing,
            action: Actions.Cancel,
            peerUserName, peerUserId,
            fromUserName: userName,
            fromUserId: userId,
        };
        socket.send(JSON.stringify(data));
        // enqueueSnackbar('Cancel', {variant: 'warning', preventDuplicate: true});
    };

    const handleReject = () => {
        setIncoming(false);
        const data = {
            type: Commands.Incoming,
            action: Actions.Reject,
            originUserId: peerUserId,
        };
        socket.send(JSON.stringify(data));
        // enqueueSnackbar('Rejected', {variant: 'warning', preventDuplicate: true});
    };

    const handleAnswer = () => {
        setIncoming(false);
        const data = {
            type: Commands.Incoming,
            action: Actions.Answer,
            originUserId: peerUserId,
        };
        socket.send(JSON.stringify(data));
        // enqueueSnackbar('Connected', {variant: 'success', preventDuplicate: true});
    };

    const handleLeaveSession = () => {
        setSession(undefined);
        const data = {
            type: Commands.Incoming,
            action: Actions.Handoff,
            peerUserId,
        };
        socket.send(JSON.stringify(data));
        // enqueueSnackbar('Disconnected', {variant: 'info', preventDuplicate: true});
    };

    const onopen = ev => {
        console.log('WebSocket Open', ev);
        // registration or bind the user and the websocket
        const data = {
            type: Commands.Registration,
            userId,
        }
        this.send(JSON.stringify(data));
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
        const {type} = messageData;
        if (type === Commands.Invite) {
            if (currentCall) {
                // TODO - Tell the server, I'm busy.
                socket.send(JSON.stringify({

                }));
                return;
            }
            const {action} = messageData;
            if (action === Actions.Ring) {
                setIncoming(true);
            } else if (action === Actions.Cancel) {
                setIncoming(false);
                // enqueueSnackbar('Cancel', {variant: 'warning', preventDuplicate: true});
            }
        } else if (type === Commands.Connect) {
            setOutgoing(false);
            const {session} = messageData;
            setSession(session);
            // enqueueSnackbar('Connected', {variant: 'success', preventDuplicate: true});
        } else if (type === Commands.Disconnect) {
            setSession(undefined);
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
        if (socket) {
            console.log('Socket has created');
            return;
        }
        setSocket(createSocket());
    }, []);

    return (
        <div>
            <Fab color="secondary" className={classes.fab} onClick={handleOutgoing}>
                <Phone/>
            </Fab>
            <OutgoingComponent open={outgoing}
                               callType="Video"
                               handleCancel={handleCallCancel}/>
            <IncomingComponent open={incoming}
                               callType="Audio"
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
