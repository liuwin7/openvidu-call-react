import React from 'react';
import { render } from "react-dom";
import CallComponent from "./lib/components/CallComponent";

const App = () => (
  <div style={{ width: "100%", margin: "0" }}>
    <CallComponent />
  </div>
);

render(<App />, document.getElementById("root"));
