import React from 'react';
import ReactDOM from 'react-dom';
import {SnackbarProvider} from 'notistack';
import './index.css';
import registerServiceWorker from './registerServiceWorker';
import App from "./App";
import {Route, Switch, BrowserRouter as Router} from "react-router-dom";

ReactDOM.render(
    <SnackbarProvider>
        <Router>
            <Switch>
                <Route path="/">
                    <App/>
                </Route>
            </Switch>
        </Router>
    </SnackbarProvider>
    , document.getElementById('root')
);
registerServiceWorker();
