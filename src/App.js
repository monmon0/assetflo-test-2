import React from 'react';
// import { BrowserRouter, Route, Switch } from "react-router-dom";
// import agent from "./views/agent";
import MainPage from './views/MainPage';
// import { Login, Page404, Page500 } from "./views/Pages";
// export const history = createHashHistory();
import './index.css';
import { makeStyles } from '@mui/styles';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme();

const useStyles = makeStyles((theme) => {
  root: {
    // some CSS that accesses the theme
  }
});

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <MainPage />
    </ThemeProvider>
    // <BrowserRouter>
    //   <Switch>
    //     {/* <Route exact path="/login" name="Login Page" component={Login} />
    //     <Route exact path="/404" name="Page 404" component={Page404} />
    //     <Route exact path="/500" name="Page 500" component={Page500} /> */}
    //     <Route path="/" name="Home" component={MainPage} />
    //   </Switch>
    // </BrowserRouter>
  );
};

export default App;
