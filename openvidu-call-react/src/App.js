import React, {useEffect, useState} from "react";
import {Fab, makeStyles} from "@material-ui/core";
import {Phone} from "@material-ui/icons";
import OutgoingComponent from "./components/call/OutgoingComponent";
import IncomingComponent from "./components/call/IncomingComponent";
import VideoRoomComponent from "./components/VideoRoomComponent";
import { useLocation } from 'react-router-dom';
import {parse} from 'qs';
import {useSnackbar} from "notistack";

const useStyles = makeStyles(theme => ({
    fab: {
        position: "absolute",
        right: theme.spacing(2),
        bottom: theme.spacing(2),
    }
}));

const App = () => {
    const classes = useStyles();
    const location = useLocation();
    const { enqueueSnackbar } = useSnackbar();

    let mineId = '001', originUser = '张三', peerUserId = '002', peerUser = '李四';
    if (location.search.length !== 0) {
        const searchStr = location.search.slice(1);
        const {userId, toUserId, to, origin} = parse(searchStr);
        mineId = userId;
        peerUserId = toUserId;
        originUser = origin;
        peerUser = to;
    }

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
        enqueueSnackbar('Cancel', {variant: 'warning', preventDuplicate: true});
    };

    const handleReject = () => {
        setIncoming(false);
        const data = {
            type: 'incoming',
            action: 'reject',
            originUserId: peerUserId,
        };
        socket.send(JSON.stringify(data));
        enqueueSnackbar('Rejected', {variant: 'warning', preventDuplicate: true});
    };

    const handleAnswer = () => {
        setIncoming(false);
        const data = {
            type: 'incoming',
            action: 'answer',
            originUserId: peerUserId,
        };
        socket.send(JSON.stringify(data));
        enqueueSnackbar('Connected', {variant: 'success', preventDuplicate: true});
    };

    const handleLeaveSession = () => {
        setSession(undefined);
        const data = {
            type: 'incoming',
            action: 'handoff',
            peerUserId,
        };
        socket.send(JSON.stringify(data));
        enqueueSnackbar('Disconnected', {variant: 'info', preventDuplicate: true});
    };

    // create socket
    useEffect(() => {
        const ws = new WebSocket('ws://localhost:5000/my-call');
        ws.addEventListener('open', ev => {
            console.log('WebSocket Open');
            // register
            const data = {
                type: 'registration',
                userId: mineId,
            }
            ws.send(JSON.stringify(data));
        });
        ws.addEventListener('message', ev => {
            console.log('message', ev.data);
            const messageData = JSON.parse(ev.data);
            const {type} = messageData;
            if (type === 'incoming') {
                const {action} = messageData;
                if (action === 'ring') {
                    setIncoming(true);
                } else if (action === 'cancel') {
                    setIncoming(false);
                    enqueueSnackbar('Cancel', {variant: 'warning', preventDuplicate: true});
                }
            } else if (type === 'connect') {
                setOutgoing(false);
                const {session} = messageData;
                setSession(session);
                enqueueSnackbar('Connected', {variant: 'success', preventDuplicate: true});
            } else if (type === 'disconnect') {
                setSession(undefined);
                enqueueSnackbar('Disconnected', {variant: 'info', preventDuplicate: true});
            }
        });
        setSocket(ws);
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

export default App;
