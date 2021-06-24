import {Fab, makeStyles} from "@material-ui/core";
import {Phone} from "@material-ui/icons";
import OutgoingComponent from "./call/OutgoingComponent";
import IncomingComponent from "./call/IncomingComponent";
import VideoRoomComponent from "./VideoRoomComponent";
import React, {useEffect, useState} from "react";

const useStyles = makeStyles(theme => ({
    fab: {
        position: "absolute",
        right: theme.spacing(2),
        bottom: theme.spacing(2),
    }
}));

const ReadyStatusIdle = 0; // 空闲
const ReadyStatusRegistration = 1; // 注册用户
const ReadyStatusRegistrationSuccess = 2; // 注册成功
const ReadyStatusRegistrationFailed = 3; // 注册失败

const CallComponent = ({userId, userName, onReadyStatusChange}) => {

    const classes = useStyles();
    let readyStatusChange = ReadyStatusIdle; // 空闲
    const [outgoing, setOutgoing] = useState(false);
    const [incoming, setIncoming] = useState(false);
    const [socket, setSocket] = useState();
    const [session, setSession] = useState();

    const handleOutgoing = () => {
        setOutgoing(true);
        const data = {
            type: 'outgoing',
            action: 'ring',
            to: peerUser,
            toUserId: peerUserId,
            origin: originUser,
            originUserId: mineId,
        };
        socket.send(JSON.stringify(data));
    };

    const handleCallCancel = () => {
        setOutgoing(false);
        const data = {
            type: 'outgoing',
            action: 'cancel',
            to: peerUser,
            toUserId: peerUserId,
            origin: originUser,
            originUserId: mineId,
        };
        socket.send(JSON.stringify(data));
        // enqueueSnackbar('Cancel', {variant: 'warning', preventDuplicate: true});
    };

    const handleReject = () => {
        setIncoming(false);
        const data = {
            type: 'incoming',
            action: 'reject',
            originUserId: peerUserId,
        };
        socket.send(JSON.stringify(data));
        // enqueueSnackbar('Rejected', {variant: 'warning', preventDuplicate: true});
    };

    const handleAnswer = () => {
        setIncoming(false);
        const data = {
            type: 'incoming',
            action: 'answer',
            originUserId: peerUserId,
        };
        socket.send(JSON.stringify(data));
        // enqueueSnackbar('Connected', {variant: 'success', preventDuplicate: true});
    };

    const handleLeaveSession = () => {
        setSession(undefined);
        const data = {
            type: 'incoming',
            action: 'handoff',
            peerUserId,
        };
        socket.send(JSON.stringify(data));
        // enqueueSnackbar('Disconnected', {variant: 'info', preventDuplicate: true});
    };

    const onopen = ev => {
        console.log('WebSocket Open', ev);
        // registration or bind the user and the websocket
        const data = {
            type: 'registration',
            userId: mineId,
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
        if (type === 'incoming') {
            const {action} = messageData;
            if (action === 'ring') {
                setIncoming(true);
            } else if (action === 'cancel') {
                setIncoming(false);
                // enqueueSnackbar('Cancel', {variant: 'warning', preventDuplicate: true});
            }
        } else if (type === 'connect') {
            setOutgoing(false);
            const {session} = messageData;
            setSession(session);
            // enqueueSnackbar('Connected', {variant: 'success', preventDuplicate: true});
        } else if (type === 'disconnect') {
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
                    user={originUser}
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
