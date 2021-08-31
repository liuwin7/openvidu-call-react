import OutgoingComponent from "./call/OutgoingComponent";
import IncomingComponent from "./call/IncomingComponent";
import VideoRoomComponent from "./VideoRoomComponent";
import React, {Component} from "react";
import {Actions, CallStatus, IncomingCall, OutgoingCall} from "./CallKit";

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
        } else if (action === Actions.Cancel) {
            const {onCancel} = this.props;
            if (onCancel) {
                onCancel();
            }
            this.setState({currentCall: undefined,});
        } else if (action === Actions.Reject) {
            const {onReject} = this.props;
            if (onReject) {
                onReject();
            }
            this.setState({currentCall: undefined,});
        }
    }

    onConnect = (session) => {
        const {onConnected} = this.props;
        if (onConnected) {
            onConnected();
        }
        const {currentCall} = this.state;
        this.setState({
            currentCall: currentCall.updateStatusAndGen(CallStatus.Connected),
            session,
        });
    }

    onDisconnect = () => {
        const {onDisconnected} = this.props;
        if (onDisconnected) {
            onDisconnected();
        }
        this.setState({
            currentCall: undefined,
            session: undefined,
        });
    }

    render() {
        const { currentCall, session } = this.state;
        const noop = () => {};
        const { userName,
            onReject = noop,
            onCancel = noop,
            onConnected = noop,
            onDisconnected = noop} = this.props;
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
                        // openviduServerUrl="https://localhost:4443"
                        openviduServerUrl={this.callKit.openviduURL}
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

export default CallComponent;
