import React, {useEffect, useState} from "react";
import {Avatar, List, ListItem, ListItemAvatar, ListItemText, makeStyles, TextField} from "@material-ui/core";
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
        '& > *': {
            margin: theme.spacing(1),
            width: '25ch',
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

const call = new CallKit();

const App = () => {
    const classes = useStyles();
    const {
        register, handleSubmit, formState: {errors},
    } = useForm();
    const { enqueueSnackbar } = useSnackbar();

    const [userId, setUserId] = useState();
    const [userName, setUserName] = useState();
    const [peerUserId, setPeerUserId] = useState();
    const [peerUserName, setPeerUserName] = useState();
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
            axios.get('http://localhost:5000/dashboard/onlineUsers')
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
                <TextField label="User Id"
                           disabled={login}
                           {...register('userId', { required: true })}/>
                {errors.userId && <p className={classes.error}>请输入UserId</p>}

                <TextField label="User Name"
                           disabled={login}
                           {...register('userName', { required: true })}/>
                {errors.userName && <p className={classes.error}>请输入UserName</p>}

                <input type="submit" disabled={login}/>
            </form>

            <span style={{paddingLeft: '20px'}}>在线用户</span>
            <List className={classes.list}>
                {
                    users.map(user => (
                        <ListItem button={user.userId !== userId}
                                  key={user.userId}
                                  onClick={() => {
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
                           }}
                           onReject={() => {
                           }} onConnected={() => console.log('connected')}
                           onDisconnected={() => {
                           }}
                           />
        </div>
    );
};

export default App;
