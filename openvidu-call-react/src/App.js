import React, {useEffect, useState} from "react";
import {
    Avatar, Button,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    makeStyles,
    TextField
} from "@material-ui/core";
import {AccountCircle} from "@material-ui/icons";
import {useSnackbar} from "notistack";
import CallComponent from "./components/CallComponent";
import {useForm} from "react-hook-form";
import axios from "axios";
import CallKit from "./components/CallKit";

const useStyles = makeStyles(theme => ({
    fab: {
        position: "absolute",
        right: theme.spacing(2),
        bottom: theme.spacing(2),
    },
    root: {
        margin: '0 auto',
        '& > *': {
            margin: theme.spacing(2),
            width: '25em',
        },
    },
    list: {
        width: '100%',
        backgroundColor: theme.palette.background.paper,
    },
    error: {
        color: "red",
    },
}));

const call = new CallKit('wss://uniplay.boyfu.xyz:40002/my-call',
    'https://uniplay.boyfu.xyz:40002/call');

const App = () => {
    const classes = useStyles();
    const {
        register, handleSubmit, formState: {errors},
    } = useForm();
    const { enqueueSnackbar } = useSnackbar();

    const [userId, setUserId] = useState();
    const [userName, setUserName] = useState();
    const [login, setLogin] = useState(false);
    const [users, setUsers] = useState([]);

    const onSubmit = data => {
        const {userId, userName} = data;
        setUserId(userId);
        setUserName(userName);
        call.init(userId, userName);
        setLogin(true);
    };

    useEffect(() => {
        // 请求服务
        if (login) {
            axios.get('https://uniplay.boyfu.xyz:40002/dashboard/onlineUsers')
                .then(res => {
                    const {users} = res.data;
                    setUsers(users);
                })
                .catch(err => {
                    console.error(err);
                });
        } else {
            setUsers([]);
        }
    }, [login]);

    return (
        <div >
            <form className={classes.root} onSubmit={handleSubmit(onSubmit)}>
                <div>
                    <TextField label="User Id"
                               disabled={login} fullWidth
                               helperText={
                                   errors.userId ? errors.userId.message : ''
                               }
                               {...register('userId', { required: true })}/>
                </div>
                <div>
                    <TextField label="User Name"
                               disabled={login} fullWidth
                               helperText={
                                   errors.userName ? errors.userName.message : ''
                               }
                               {...register('userName', { required: true })}/>
                </div>

                <div>
                    <Button type="submit"
                            disabled={login}
                            variant="contained"
                            color="primary"
                            fullWidth>
                        登录
                    </Button>
                </div>
            </form>

            <span style={{paddingLeft: '20px'}}>在线用户</span>
            <List className={classes.list}>
                {
                    users.map(user => (
                        <ListItem button={user.userId !== userId}
                                  key={user.userId}
                                  onClick={() => {
                                      if (user.userId === userId) return;
                                      call.call(user.userId, user.userName);
                                  }}
                        >
                            <ListItemAvatar>
                                <Avatar>
                                    <AccountCircle color="primary"/>
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText primary={user.userName}
                                          secondary={
                                              user.userId + (
                                                  user.userId === userId ? "(Me)" : ""
                                              )
                                          }/>
                        </ListItem>
                    ))
                }
            </List>

            <CallComponent callKit={call} userId={userId} userName={userName}
                           onCancel={() => {
                               enqueueSnackbar('Cancel', {
                                   variant: 'info',
                               });
                           }}
                           onReject={() => {
                               enqueueSnackbar('Reject', {
                                   variant: 'info',
                               });
                           }}
                           onConnected={() => {
                               enqueueSnackbar('Connected', {
                                   variant: 'info',
                               });
                           }}
                           onDisconnected={() => {
                               enqueueSnackbar('Disconnected', {
                                   variant: 'info',
                               });
                           }}
                           />
        </div>
    );
};

export default App;
