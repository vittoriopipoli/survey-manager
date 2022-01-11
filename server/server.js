'use strict';

const express = require('express');
const morgan = require('morgan'); // logging middleware
const {check, validationResult} = require('express-validator'); // validation middleware
const dao = require('./dao'); // module for accessing the DB
const passport = require('passport'); // auth middleware
const LocalStrategy = require('passport-local').Strategy; // username and password for login
const session = require('express-session'); // enable sessions
const userDao = require('./user-dao'); // module for accessing the users in the DB


/*** Set up Passport ***/
// set up the "username and password" login strategy
// by setting a function to verify username and password
passport.use(new LocalStrategy(
  function(username, password, done) {
    console.log("passportuse new local", username, password);
    userDao.getUser(username, password).then((user) => {
      if (!user)
        return done(null, false, { message: 'Incorrect username and/or password.' });
        
      return done(null, user);
    })
  }
));

// serialize and de-serialize the user (user object <-> session)
// we serialize the user id and we store it in the session: the session is very small in this way
passport.serializeUser((user, done) => {
  console.log("Serialize User");
  done(null, user.id);
});

// starting from the data in the session, we extract the current (logged-in) user
passport.deserializeUser((id, done) => {
  console.log("Deserialize User");
  userDao.getUserById(id)
    .then(user => {
      done(null, user); // this will be available in req.user
    }).catch(err => {
      done(err, null);
    });
});

// init express
const app = express();
const port = 3001;

// set-up the middlewares
app.use(morgan('dev'));
app.use(express.json());

// custom middleware: check if you are in user mode or admin mode
const checkMode = (req, res, next) => {
  if(req.isAuthenticated()){
      return next();
  }else{
    req.user  = {id: undefined};
    return next();
  }
}

// custom middleware: block unauthenticated users which may perform dangerous actions
const isLoggedIn = (req, res, next) => {
  if(req.isAuthenticated())
    return next();
  
  return res.status(401).json({ error: 'not authenticated'});
}

const checkSurveyOwnership = (req, res, next) =>{ /**check if you are the owner of the survey */
  dao.checkSurveyOwnership(req.user.id, req.params.surveyID)
    .then(()=>next())
    .catch((err)=>{
      console.log(err);
      return res.status(401).json({ error: 'you are not the owner!'});
    });
  
}

// set up the session
app.use(session({
  // by default, Passport uses a MemoryStore to keep track of the sessions
  secret: 'a secret sentence not to share with anybody and anywhere, used to sign the session ID cookie',
  resave: false,
  saveUninitialized: false 
}));

// then, init passport
app.use(passport.initialize());
app.use(passport.session());


/*** APIs ***/

// GET /api/surveys
app.get('/api/surveys', checkMode, async (req, res) => {
  let surveys;
  
  if(req.user.id===undefined){
    try{
      surveys = await dao.listSurveys(req.user.id, 0); /**take surveys */
      res.status(200).json(surveys);
    }catch(err){
      res.status(500).end();
    }
  }
  else{
    try{
      await dao.listSurveys(req.user.id, 1);  /**update counts */
      surveys = await dao.listSurveys(req.user.id, 0); /**take surveys */
      res.status(200).json(surveys);
    }catch(err){
      res.status(500).end();
    }
    
  }
  });

// GET /api/questions
app.get('/api/questions/:surveyID', (req, res) => {
  dao.listQuestions(req.params.surveyID)
    .then(questions => res.status(200).json(questions))
    .catch(() => res.status(500).end());
});

// GET /api/answers
app.get('/api/answers/:surveyID', isLoggedIn, checkSurveyOwnership, 
        (req, res) => {
  dao.listMainAnswers(req.params.surveyID)
    .then((answers) => res.status(200).json(answers))
    .catch(() => res.status(500).end());
});

// POST /api/survey
app.post('/api/surveys', isLoggedIn, [
    check("Title").notEmpty(), 
    check("Questions").custom((questions)=>{
      if(questions===undefined || questions===null){
        throw new Error("invalid questions");
      }
      if(questions.length===0){
        throw new Error("missing questions!");
      }
      let j=1; /**display order */
      for(let q of questions){
        if(q === undefined || q===null){
          throw new Error("invalid question");
        }
        if(q.question === undefined || q.question===null || q.question===""){
          throw new Error("missing question");
        }
        if(q.dOrd === undefined || q.dOrd===null || q.dOrd!==j){
          throw new Error("invalid DisplayOrder");
        }
        j++;
        if(q.min === undefined || q.min < 0 || q.min===null){
          throw new Error("invalid min");
        }
        if(q.max === undefined || q.max < 1 || q.max===null){
          throw new Error("invalid max");
        }
        if(q.text === undefined || q.text===null){
          throw new Error("invalid text");
        }
        if(q.type === undefined || q.type===null){
          throw new Error("invalid type");
        }
        if(q.type === 1){
          for(let alterntative of q.text){
            if(alterntative===""){
              throw new Error("Missing alternative(s)!");
            }
          }
          if(q.min === q.max && q.max === q.text.length){
            throw new Error("invalid min");
          }
          if(q.min>q.max){
            throw new Error("Too much mandatory answers! Please choose a lower threshold or increase the max number of answers (and alternatives if needed)!");
          }
          if(q.max>q.text.length){
            throw new Error("Max value is too high value! Choose a value less than the actual number of alternatives");
          }
        }else{
          if(q.text[0]!=="" || q.text.length>1){
            throw new Error("invalid text");
          }
          if(q.min!==0 && q.min!==1){
            throw new Error("invalid min");
          }
          if(q.max!==1){
            throw new Error("invalid max");
          }
        }
      }
      return true;
    })
],  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({errors: errors.array()});
    }
    console.log(req.body);
    const survey = {
        ID_Admin: req.user.id,
        Title   : req.body.Title
      };

    dao.createSurvey(survey, req.body.Questions)
      .then((results)=>{console.log(results);res.status(201).json({})})
        .catch(()=>res.status(503).json({error: `Database error during the creation of survey.`}));
  });

  // POST /api/answers
app.post('/api/answers', [
  check("ID_Survey").custom(async(surveyID)=>{
    if(surveyID == undefined || surveyID === null){
      throw new Error("invalid SurveyID!");
    }
    try{
        await dao.surveyExistence(surveyID);
        return true;
    }catch(err){
      throw err;
    }
  
  }), check("Username").notEmpty(),
  check(["Answers"]).custom(async(answers, info)=>{
    let questions;
    try{
      questions = await dao.listQuestions(info.req.body.ID_Survey); /**take questions for checks */
    }catch(err){
      throw err;
    }
    let nQuest = questions.length;
    questions = questions.sort((a,b)=>a.dOrd-b.dOrd); /**they could be fetched in random order */

    if(answers === undefined || answers=== null){
      throw new Error("invalid Answers list!");
    }

    if(answers.length!==nQuest){
      throw new Error("invalid Answers list!");
    }
    let i;
    let answer;

    for(i=0; i<answers.length; i++){
        if(answers[i].answer === undefined || answers[i].answer === null){
          throw new Error("invalid answer!");
        }
        if(answers[i].type!==questions[i].type){
            throw new Error("wrong type!");
        }
        if(answers[i].id_quest!==questions[i].id){
          throw new Error("wrong id_quest!");
        }
        try{
          answer = answers[i].type===1?JSON.parse(answers[i].answer):answers[i].answer
        }catch(err)
        {
          throw err;
        }
        if(answer===undefined || answer===null){
          throw new Error("invalid Answer!");
        }
        if(answers[i].DisplayOrder!==(i+1)){
          throw new Error("invalid Display Order!");
        }
        if(questions[i].type===0){
          if(questions[i].min === 1){
            if(answer===""){
              throw new Error("Missing mandatory open answer!");
            }
          }
          if(answer.length>200){
            throw new Error("Too long answer! You have 200char!");
          }

        }else{
          let j = 0;
          for(let b of answer){
            if(b===true)
              j++;
          }
          if(answer.length !== questions[i].text.length){
            throw new Error("Wrong number of alternatives!");
          }
          if(j<questions[i].min){
            throw new Error("Missing mandatory closed answer(s)!");
          }
          if(j>questions[i].max){
            throw new Error("Too much answers! Choose less!");
          }

        }
    }
    return true;
  })
],  (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({errors: errors.array()});
  }

  console.log(req.body);
  const main = {
      ID_Survey  : req.body.ID_Survey,
      Username   : req.body.Username
    };
  
  dao.createAnswer(main, req.body.Answers)
  .then((results)=>{console.log(results);res.status(201).json({})})
    .catch(()=>res.status(503).json({error: `Database error during the creation of the answer.`}));
});

/*** Other express-related instructions ***/
// POST /sessions 
// login
app.post('/api/sessions', function(req, res, next) {
  passport.authenticate('local', (err, user, info) => {
    console.log("app.post api/session ==>" ,user, info, req.body)
    if (err)
      return next(err);
    if (!user) {
      // display wrong login messages
      return res.status(401).json(info);
    }
    // success, perform the login
    req.login(user, (err) => {
      if (err)
        return next(err);
      
      // req.user contains the authenticated user, we send all the user info back
      // this is coming from userDao.getUser()
      return res.json(req.user);
    });
  })(req, res, next);
});

// DELETE /sessions/current 
// logout
app.delete('/api/sessions/current', (req, res) => {
  console.log(req.user, " logged out");
  req.logout();
  res.end();
});

// GET /sessions/current
// check whether the user is logged in or not
app.get('/api/sessions/current', (req, res) => {
  if(req.isAuthenticated()) {
    res.status(200).json(req.user);
    console.log(req.user, " is still logged");
  }  
  else
    res.status(401).json({error: 'Unauthenticated user!'});
});

/*** Other express-related instructions ***/

// Activate the server
app.listen(port, () => {
  console.log(`server listening at http://localhost:${port}`);
});
