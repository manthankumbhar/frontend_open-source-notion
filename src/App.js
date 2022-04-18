import { Route, Routes } from "react-router";
import "App.scss";
import Home from "components/Home/Home";
import Login from "components/Login/Login";
import Signup from "components/Signup/Signup";
import PrivateRoute from "hoc/PrivateRoute";
import Error from "components/Error/Error";

export default function App() {
  return (
    <div className="App">
      <Routes>
        <Route exact path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/home" element={<PrivateRoute />}>
          <Route path="/home" element={<Home />} />
        </Route>
        <Route path="*" element={<Error />} />
      </Routes>
    </div>
  );
}
