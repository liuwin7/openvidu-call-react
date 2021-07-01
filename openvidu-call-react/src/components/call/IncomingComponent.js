import React from "react";
import {AppBar, Dialog, IconButton, makeStyles, Slide, Toolbar, Typography} from "@material-ui/core";
import {CallEnd, Phone} from "@material-ui/icons";
import {green, red} from "@material-ui/core/colors";
import {CallDirection, CallStatus} from "../CallComponent";

const useStyles = makeStyles(theme => ({
    appBar: {
        position: 'relative',
    },
    title: {
        marginLeft: theme.spacing(2),
        flex: 1,
    },
    content: {
        textAlign: "center",
        marginTop: theme.spacing(20),
        flex: 1,
    },
    handle_off: {
        marginTop: theme.spacing(10),
    }
}));

const Transition = React.forwardRef((props, ref) => (
    <Slide direction="up" ref={ref} {...props} />
));

const IncomingComponent = ({currentCall, handleAnswer, handleReject}) => {
    const classes = useStyles();
    const dialogOpen = !!currentCall
        && currentCall.direction === CallDirection.Incoming
        && currentCall.status !== CallStatus.Connected;
    return (
        <Dialog open={dialogOpen}
                fullScreen TransitionComponent={Transition}>
            <AppBar className={classes.appBar}>
                <Toolbar>
                    <Typography variant="h6" className={classes.title}>
                        Call
                    </Typography>
                </Toolbar>
            </AppBar>
            <div className={classes.content}>
                <Typography variant="h6">
                    视频电话 { currentCall ? currentCall.originUserName : ''}
                </Typography>
                <div>
                    <IconButton color="secondary" aria-label="reject"
                                className={classes.handle_off} onClick={handleReject}>
                        <CallEnd style={{ color: red[500] }}/>
                    </IconButton>
                    <IconButton color="secondary" aria-label="answer"
                                className={classes.handle_off} onClick={handleAnswer}>
                        <Phone style={{ color: green[500] }}/>
                    </IconButton>
                </div>
            </div>
        </Dialog>
    );
};

export default IncomingComponent;
