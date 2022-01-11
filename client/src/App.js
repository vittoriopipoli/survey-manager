import './App.css';
import Row from 'react-bootstrap/Row';
import 'bootstrap/dist/css/bootstrap.min.css';
import MyNavBar from './MyNavBar.js';
import MyMain from './MyMain.js';
import {useState, useEffect} from 'react';
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';
import AddSurvey from "./AddSurvey.js";
import AnswerSurvey from './AnswerSurvey';
import API from "./API";

function App() {
  const [surveys, setSurveys] = useState([]);
  const [logged, setLogged] = useState(false);
  const [waiting, setWaiting] = useState(true);
  const [dirty, setDirty] = useState(true);

  const logout = async () => {
    await API.logOut();
    setLogged(false);
    setDirty(true);
    // clean up everything
  }

  const getSurveys = async () =>{
    try{
      setWaiting(true);
      const s = await API.getSurveys();
      setSurveys(s);
      setWaiting(false);
    }catch(err){
      throw err;
    }
  };

  const addSurvey = async (title, questions)=>{
    try{
      await API.addSurvey(title, questions);
      setDirty(true);
    }catch(err)
    {
      throw err;
    }
  };

  const loginCallback = async (email, password) => {
    try {
      const u = await API.logIn(email, password)
      alert(`Welcome, ${u.name}!`);
      setLogged(true);
      setDirty(true);
      return false;
    } catch(err) {
      throw err;
    }
  }

  useEffect(()=> {
    const checkAuth = async() => {
      try {
        // here you have the user info, if already logged in
        // TODO: store them somewhere and use them, if needed
        await API.getUserInfo();
        setLogged(true);
        setWaiting(false);  
      } catch(err) {
        setLogged(false);
        setWaiting(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(()=>{
    if(dirty){
      getSurveys();
      setDirty(false);
    }
  },[logged, dirty]);


  return (
    
    <Router>

        <MyNavBar logged={logged} logout={logout} loginCallback={loginCallback} waiting={waiting} setDirty={setDirty}/>
        
        <Row className="vheight-100  m-0">

            <Switch>
            
                <Route path="/viewAnswers">
                    <AnswerSurvey admin={logged} waiting={waiting} setDirty={setDirty}/>
                </Route>

                <Route path="/answerSurvey">
                    <AnswerSurvey admin={logged} waiting={waiting} setDirty={setDirty}/>
                </Route>
            
                <Route path="/addSurvey">
                    <AddSurvey admin={logged} addSurvey={addSurvey} waiting={waiting}/>
                </Route>
            
                <Route path="/">
                    <MyMain surveys={surveys} admin={logged} waiting={waiting}/>
                </Route>

            </Switch>

        </Row>

    </Router>
  );
}

export default App;
