import React, {useState} from "react";
import {
    AppBar,
    Button,
    Dialog,
    IconButton,
    makeStyles,
    Slide,
    Toolbar,
    Typography,
} from "@material-ui/core";
import {CallEnd} from '@material-ui/icons';

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

const OutgoingComponent = ({callType = 'Video', open, handleCancel}) => {
    const classes = useStyles();
    return (
        <div>
            <Dialog open={open} fullScreen TransitionComponent={Transition}>
                <AppBar className={classes.appBar}>
                    <Toolbar>
                        <Typography variant="h6" className={classes.title}>
                            Call
                        </Typography>
                    </Toolbar>
                </AppBar>
                <div className={classes.content}>
                    <Typography variant="h6">
                        {callType} To 张三
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
