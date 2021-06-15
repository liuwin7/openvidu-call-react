import React, {useEffect, useState} from "react";
import {Fab, makeStyles} from "@material-ui/core";
import {Phone} from "@material-ui/icons";
import OutgoingComponent from "./components/call/OutgoingComponent";
import IncomingComponent from "./components/call/IncomingComponent";
import VideoRoomComponent from "./components/VideoRoomComponent";

const useStyles = makeStyles(theme => ({
    fab: {
        position: "absolute",
        right: theme.spacing(2),
        bottom: theme.spacing(2),
    }
}));

const App = () => {
    const classes = useStyles();

    const [outgoing, setOutgoing] = useState(false);
    const [incoming, setIncoming] = useState(false);
    const [socket, setSocket] = useState();
    const [session, setSession] = useState();

    const handleOutgoing = () => {
        setOutgoing(true);
        const data = {
            type: 'outgoing',
            to: '张三',
            toUserId: '001',
            from: '李四',
            fromUserId: '002',
        };
        socket.send(JSON.stringify(data));
    };

    const handleCallCancel = () => {
        setOutgoing(false);
        const data = {
            type: 'outgoing',
            action: 'cancel',
            to: '张三',
            toUserId: '001',
            from: '李四',
            fromUserId: '002',
        };
        socket.send(JSON.stringify(data));
    };

    const handleReject = () => {
        setIncoming(false);
    };

    const handleAnswer = () => {
        setIncoming(false);
    };

    // create socket
    useEffect(() => {
        const ws = new WebSocket('ws://localhost:5000/my-call');
        ws.addEventListener('open', ev => {
            console.log('WebSocket Open');
            // register
            const data = {
                type: 'registration',
                userId: '001',
            }
            ws.send(JSON.stringify(data));
        });
        ws.addEventListener('message', ev => {
            console.log('message', ev.data);
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
                />
            }
        </div>
    );
};

export default App;
