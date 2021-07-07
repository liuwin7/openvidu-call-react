import OutgoingComponent from "./call/OutgoingComponent";
import IncomingComponent from "./call/IncomingComponent";
import VideoRoomComponent from "./VideoRoomComponent";
import React, {Component} from "react";
import {Actions, CallStatus, Commands, IncomingCall, OutgoingCall} from "./CallKit";

class CallComponent extends Component {

    state = {}

    constructor(props) {
        super(props);
        const {callKit} = props;
        this.callKit = callKit;
        callKit._onCall = this.onCall;
        callKit._onInvite = this.onInvite;
        callKit._onConnect = this.onConnect;
        callKit._onDisconnect = this.onDisconnect;
    }

    onCall = (peerUserId, peerUserName) => {
        this.setState({
            currentCall: new OutgoingCall({
                originUserId: this.callKit.userId,
                originUserName: this.callKit.userName,
                peerUserId, peerUserName,
            }),
        });
    }

    onInvite = (action, callParams) => {
        const {currentCall} = this.state;
        if (action === Actions.Ring) {
            if (!currentCall) {
                const currentCall = new IncomingCall({
                    ...callParams
                });
                this.setState({
                    currentCall,
                });
            } else {
                console.error('conflict call');
            }
        } else if (action === Actions.Cancel
            || action === Actions.Reject) {
            this.setState({currentCall: undefined,});
        }
    }

    onConnect = (session) => {
        const {currentCall} = this.state;
        this.setState({
            currentCall: currentCall.updateStatusAndGen(CallStatus.Connected),
            session,
        });
    }

    onDisconnect = () => {
        this.setState({
            currentCall: undefined,
            session: undefined,
        });
    }

    // componentDidMount() {
    //     this.socket = new WebSocket('ws://localhost:5000/my-call');
    //     this.socket.onmessage = ev => {
    //         console.log('message', ev.data, ev);
    //         const { currentCall } = this.state;
    //         const messageData = JSON.parse(ev.data);
    //         const {type, action, ...callParams} = messageData;
    //         if (type === Commands.Invite) {
    //             if (currentCall && action === Actions.Ring) {
    //                 this.socket.send(JSON.stringify({
    //                     type: Commands.Invite,
    //                     action: Actions.Busy,
    //                     ...callParams,
    //                 }));
    //                 return;
    //             }
    //             if (action === Actions.Ring) {
    //                 const incomingCall = new IncomingCall({
    //                     ...callParams
    //                 });
    //                 this.setState({currentCall: incomingCall});
    //             } else if (action === Actions.Cancel) {
    //                 console.log('-----Actions.Cancel', currentCall);
    //                 this.setState({currentCall: undefined});
    //             } else if (action === Actions.Busy) {
    //                 console.log('--------Actions.Busy', currentCall);
    //                 this.setState({currentCall: undefined});
    //                 // enqueueSnackbar('Peer Busy', {variant: 'warning', preventDuplicate: true});
    //             } else if (action === Actions.Reject) {
    //                 console.log('-----Actions.Reject', currentCall);
    //                 this.setState({currentCall: undefined});
    //             }
    //         } else if (type === Commands.Connect) {
    //             const {session} = messageData;
    //             console.log('--------Commands.Connect', currentCall);
    //             this.setState({
    //                 currentCall: currentCall.updateStatusAndGen(CallStatus.Connected)
    //             });
    //             this.setState({session});
    //         } else if (type === Commands.Disconnect) {
    //             console.log('--------Commands.Disconnect', currentCall);
    //             this.setState({session: undefined, currentCall: undefined});
    //         }
    //     };
    // }

    // 【呼叫方】取消呼叫
    handleCancel = () => {
        const {currentCall} = this.state;
        const data = {
            type: Commands.Invite,
            action: Actions.Cancel,
            ...currentCall.callParams,
        };
        this.socket.send(JSON.stringify(data));
    };

    // 【被呼叫方】
    handleReject = () => {
        const {currentCall} = this.state;
        const data = {
            type: Commands.Invite,
            action: Actions.Reject,
            ...currentCall.callParams,
        };
        this.socket.send(JSON.stringify(data));
    };

    handleAnswer = () => {
        const {currentCall} = this.state;
        const data = {
            type: Commands.Invite,
            action: Actions.Answer,
            ...(currentCall.callParams),
        };
        this.socket.send(JSON.stringify(data));
    };

    handleLeaveSession = () => {
        const {currentCall} = this.state;
        this.setState({session: undefined});
        const data = {
            type: Commands.Disconnect,
            action: Actions.Handoff,
            ...(currentCall.callParams),
        };
        this.socket.send(JSON.stringify(data));
    };


    render() {
        const { currentCall, session } = this.state;
        const { userName,
            onReject, onCancel, onConnected, onDisconnected } = this.props;
        return (
            <div>
                <OutgoingComponent currentCall={currentCall}
                                   handleCancel={() => {
                                       this.callKit.cancel(currentCall);
                                       this.setState({currentCall: undefined});
                                       onCancel();
                                   }}/>
                <IncomingComponent currentCall={currentCall}
                                   handleAnswer={() => {
                                       this.callKit.answer(currentCall);
                                       this.setState({
                                           currentCall: currentCall.updateStatusAndGen(CallStatus.Connected),
                                       });
                                       onConnected();
                                   }}
                                   handleReject={() => {
                                       this.callKit.reject(currentCall);
                                       this.setState({currentCall: undefined});
                                       onReject();
                                   }}
                />
                {
                    session && <VideoRoomComponent
                        // openviduServerUrl="https://192.168.8.181:4443"
                        openviduServerUrl="https://localhost:4443"
                        sessionName={session}
                        user={userName}
                        leaveSession={() => {
                            this.callKit.handoff(currentCall);
                            this.setState({
                                currentCall: undefined,
                                session: undefined
                            });
                            onDisconnected();
                        }}
                    />
                }
            </div>
        );
    }
}

// const CallComponent = ({userId, userName, peerUserId, peerUserName,
//     onReject, onConnected, onDisconnected, onCancel}) => {
//
//     const [currentCall, setCurrentCall] = useState(); // call object
//     // socket
//     const onopen = ev => { console.log('WebSocket Open', ev); };
//     const onerror = ev => { console.error('WebSocket Error', ev); };
//     const onclose = ev => { console.error('WebSocket Close', ev); };
//     const onmessage = ev => {
//         console.log('+++++++++currentCall+++++', currentCall);
//         console.log('message', ev.data);
//         const messageData = JSON.parse(ev.data);
//         const {type, action, ...callParams} = messageData;
//         if (type === Commands.Invite) {
//             if (currentCall) {
//                 socket.send(JSON.stringify({
//                     type: Commands.Invite,
//                     action: Actions.Busy,
//                     ...callParams,
//                 }));
//                 return;
//             }
//             if (action === Actions.Ring) {
//                 const incomingCall = new IncomingCall({
//                     ...callParams
//                 });
//                 setCurrentCall(incomingCall);
//             } else if (action === Actions.Cancel) {
//                 console.log('-----Actions.Cancel', currentCall);
//                 setCurrentCall(undefined);
//                 // enqueueSnackbar('Cancel', {variant: 'warning', preventDuplicate: true});
//             } else if (action === Actions.Busy) {
//                 console.log('--------Actions.Busy', currentCall);
//                 setCurrentCall(undefined);
//                 // enqueueSnackbar('Peer Busy', {variant: 'warning', preventDuplicate: true});
//             } else if (action === Actions.Reject) {
//                 console.log('-----Actions.Reject', currentCall);
//                 setCurrentCall(undefined);
//             }
//         } else if (type === Commands.Connect) {
//             const {session} = messageData;
//             console.log('--------Commands.Connect', currentCall);
//             if (currentCall) {
//                 setCurrentCall(currentCall.updateStatusAndGen(CallStatus.Connected));
//             }
//             setSession(session);
//             // enqueueSnackbar('Connected', {variant: 'success', preventDuplicate: true});
//         } else if (type === Commands.Disconnect) {
//             console.log('--------Commands.Disconnect', currentCall);
//             setSession(undefined);
//             setCurrentCall(undefined);
//             // enqueueSnackbar('Disconnected', {variant: 'info', preventDuplicate: true});
//         }
//     };
//     const createSocket = () => {
//         const ws = new WebSocket('ws://localhost:5000/my-call');
//         ws.onopen = onopen;
//         ws.onerror = onerror;
//         ws.onclose = onclose;
//         ws.onmessage = onmessage;
//         return ws;
//     };
//     const [socket, ] = useState(createSocket());
//     const [session, setSession] = useState();
//
//     // 【呼叫方】发起呼叫
//     const handleOutgoing = () => {
//         const outgoingCall = new OutgoingCall({
//             originUserId: userId, originUserName: userName,
//             peerUserId, peerUserName
//         });
//         const data = {
//             type: Commands.Invite,
//             action: Actions.Ring,
//             ...outgoingCall.callParams,
//         };
//         socket.send(JSON.stringify(data));
//         setCurrentCall(outgoingCall);
//     };
//
//     // 【呼叫方】取消呼叫
//     const handleCancel = () => {
//         const data = {
//             type: Commands.Invite,
//             action: Actions.Cancel,
//             ...currentCall.callParams,
//         };
//         socket.send(JSON.stringify(data));
//     };
//
//     // 【被呼叫方】
//     const handleReject = () => {
//         const data = {
//             type: Commands.Invite,
//             action: Actions.Reject,
//             ...currentCall.callParams,
//         };
//         socket.send(JSON.stringify(data));
//     };
//
//     const handleAnswer = () => {
//         const data = {
//             type: Commands.Invite,
//             action: Actions.Answer,
//             ...(currentCall.callParams),
//         };
//         socket.send(JSON.stringify(data));
//     };
//
//     const handleLeaveSession = () => {
//         setSession(undefined);
//         const data = {
//             type: Commands.Disconnect,
//             action: Actions.Handoff,
//             ...(currentCall.callParams),
//         };
//         socket.send(JSON.stringify(data));
//     };
//
//     useEffect(() => {
//         if (socket.readyState === WebSocket.OPEN
//             && userId && userName) {
//             const data = {
//                 type: Commands.Registration,
//                 userId, userName,
//             };
//             socket.send(JSON.stringify(data));
//         }
//     }, [socket.readyState, userId, userName]);
//
//     useEffect(() => {
//         console.log('-----currentCall----', currentCall);
//         if (currentCall) {
//             if (currentCall.status === CallStatus.Reject) {
//                 handleReject();
//                 onReject()
//             } else if (currentCall.status === CallStatus.Cancel) {
//                 handleCancel();
//                 onCancel();
//             } else if (currentCall.status === CallStatus.Connected) {
//                 handleAnswer();
//                 onConnected();
//             } else if (currentCall.status === CallStatus.Disconnected) {
//                 handleLeaveSession();
//                 onDisconnected();
//             }
//         }
//     }, [currentCall]);
//
//     useEffect(() => {
//         if (peerUserId
//             && peerUserName
//             && socket.readyState === WebSocket.OPEN) {
//             handleOutgoing();
//         }
//     }, [socket.readyState, peerUserId, peerUserName]);
//
//     return (
//         <div>
//             <OutgoingComponent currentCall={currentCall}
//                                handleCancel={() => {
//                                    setCurrentCall(currentCall.updateStatusAndGen(CallStatus.Cancel));
//                                }}/>
//             <IncomingComponent currentCall={currentCall}
//                                handleAnswer={() => {
//                                    setCurrentCall(currentCall.updateStatusAndGen(CallStatus.Connected));
//                                }}
//                                handleReject={() => {
//                                    setCurrentCall(currentCall.updateStatusAndGen(CallStatus.Reject));
//                                }}
//             />
//             {
//                 session && <VideoRoomComponent
//                     // openviduServerUrl="https://192.168.8.181:4443"
//                     openviduServerUrl="https://localhost:4443"
//                     sessionName={session}
//                     user={userName}
//                     leaveSession={() => {
//                         setCurrentCall(currentCall.updateStatusAndGen(CallStatus.Disconnected))
//                     }}
//                     // joinSession={() => {
//                     //     setIncoming(false);
//                     //     setOutgoing(false);
//                     // }}
//                 />
//             }
//         </div>
//     );
// };

export default CallComponent;
