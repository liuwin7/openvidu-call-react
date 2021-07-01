import React from "react";
import {
    AppBar,
    Dialog,
    IconButton,
    makeStyles,
    Slide,
    Toolbar,
    Typography,
} from "@material-ui/core";
import {CallEnd} from '@material-ui/icons';
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

const OutgoingComponent = ({currentCall, handleCancel}) => {
    const classes = useStyles();
    const dialogOpen = !!currentCall
        && currentCall.direction === CallDirection.Outgoing
        && currentCall.status !== CallStatus.Connected;
    return (
        <div>
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
                        呼叫 { currentCall ? currentCall.peerUserName : '' }
                    </Typography>
                    <IconButton color="secondary" aria-label="hand off"
                                className={classes.handle_off} onClick={handleCancel}>
                        <CallEnd/>
                    </IconButton>
                </div>
            </Dialog>
        </div>
    );
};
export default OutgoingComponent;
