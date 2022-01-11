import {Survey} from "./Survey.js";
import { Question } from "./Question.js";

/**
 * All the API calls
 */
const BASEURL = '/api'; 

function getJson(httpResponsePromise) {
  return new Promise((resolve, reject) => {
    httpResponsePromise
      .then((response) => {
        if (response.ok) {

         // always return {} from server, never null or non json, otherwise it will fail
         response.json()
            .then( json => resolve(json) )
            .catch( err => reject({ error: "Cannot parse server response" }))

        } else {
          // analyze the cause of error
          response.json()
            .then(obj => reject(obj)) // error msg in the response body
            .catch(err => reject({ error: "Cannot parse server response" })) // something else
        }
      })
      .catch(err => reject({ error: "Cannot communicate"  })) // connection error
  });
}


async function getSurveys() {
  // call: GET /api/surveys
  return getJson(
    fetch(BASEURL + '/surveys')
  ).then(surveys => {
    return surveys.map((s)=> new Survey(s.ID, s.ID_Admin, s.Title, s.nAnswers));
  });

}

async function fetchQuestions(surveyID){
  // call: GET /api/questions/:id
  return getJson(
    fetch(BASEURL + '/questions/'+surveyID)
    ).then(questions=>{
      return  questions.map((q)=> new Question(q.id, q.dOrd, q.question, q.min, q.max, q.text, q.type)).sort((a,b)=>a.dOrd-b.dOrd);
    });
}

async function fetchAnswers(surveyID){
  // call: GET /api/answers/:id
  return getJson(
      fetch(BASEURL + '/answers/'+surveyID)
    ).then(answers=>{
      return answers.map((x)=> ({      
        ID_MainAnswer : x.ID_MainAnswer,
        ID_Survey     : x.ID_Survey,
        Username      : x.Username,
        Answers       : x.Answers
        }));
    });
}

function addSurvey(title, questions) {
  // call: POST /api/tasks
  return getJson(
    fetch(BASEURL + '/surveys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({Title: title, Questions:questions})
      })
  );
}

function addAnswer(surveyID, username, answers) {
  // call: POST /api/tasks
  return getJson(
    fetch(BASEURL + '/answers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ID_Survey : surveyID, 
                            Username  : username, 
                            Answers   : answers})
      })
    );
}

async function logIn(username, password) {
  let response = await fetch('/api/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({username, password}),
  });
  if(response.ok) {
    
    const user = await response.json();
    return user;
  }
  else {
    try {
      const errDetail = await response.json();
      throw errDetail.message;
    }
    catch(err) {
      throw err;
    }
  }
}

async function logOut() {
  await fetch('/api/sessions/current', {method: "DELETE"});
}

async function getUserInfo() {
  const response = await fetch(BASEURL + '/sessions/current');
  const userInfo = await response.json();
  if (response.ok) {
    return userInfo;
  } else {
    throw userInfo;  // an object with the error coming from the server
  }
}

const API = {getSurveys, fetchQuestions, fetchAnswers, addSurvey, addAnswer, logIn, logOut, getUserInfo};
export default API;