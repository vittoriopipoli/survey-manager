'use strict';
/* Data Access Object (DAO) module for accessing surveys */

const sqlite = require('sqlite3');

// open the database
const db = new sqlite.Database('survey_db.db', (err) => {
    if (err) throw err;
  });
console.log("Database Opened");



const updateAnswerCounts = (surveyID)=>{
  let sql = "SELECT COUNT() as C from Main_Answer WHERE ID_Survey=?";
  let count;
  return new Promise((resolve, reject) => {
      db.all(sql, [surveyID], (err, rows) => {
        if (err) {
            reject(err);
            return;
        }
        count = rows[0].C;
        sql = "UPDATE Survey SET nAnswers = ? WHERE ID=?";
        db.run(sql, [count, surveyID], (err, rows) => {
          if (err) {
              reject(err);
              return;
          }
          resolve(null);
          });
      });

  });
};

// get all surveys
exports.listSurveys = (userId, updateCounts) => {
    let params;
    let sql;
    let i;
    return new Promise((resolve, reject) => {
        if(userId !== undefined){
            sql = 'SELECT * FROM Survey WHERE ID_Admin=?';
            params = [userId];
        }
        else{
            sql = 'SELECT * FROM Survey';
            params = [];
        }
        db.all(sql, params, (err, rows) => {
          if (err) {
              reject(err);
              return;
          }
        
          if(userId === undefined){
            const surveys = rows.map((s) => ({  ID      : s.ID,
                                                ID_Admin: s.ID_Admin,
                                                Title   : s.Title,
                                                nAnswers: "not available"})); /*don't give info to guests*/
            resolve(surveys);
            
          }else{  
              if(updateCounts===1){             /*update nAnsw counts*/        
                for(i=0; i<rows.length; i++){
                  updateAnswerCounts(rows[i].ID);
                } 
                resolve(null); 
              }else{                            /* give surveys to admin */
                db.all(sql, params, (err, rows) => {
                  if (err) {
                      reject(err);
                      return;
                  }
                  const surveys = rows.map((s) => ({  
                    ID      : s.ID,
                    ID_Admin: s.ID_Admin,
                    Title   : s.Title,
                    nAnswers: s.nAnswers}));
                    resolve(surveys);
                    
                });
              }

          }
        });

  });
};

// get all questions of a given survey
exports.listQuestions = (surveyID) => {
      return new Promise((resolve, reject) => {
          const sql = 'SELECT * FROM Quest WHERE ID_Survey=?';
          db.all(sql, [surveyID], (err, rows) => {
          if (err) {
              reject(err);
              return;
          }
          const questions = rows.map((q) => ({  id        : q.ID,
                                                dOrd      : q.DisplayOrder,
                                                question  : q.Question,
                                                min       : q.minq,
                                                max       : q.maxq,
                                                text      : JSON.parse(q.text), /**stringify when saved */
                                                type      : q.type})
          );
          resolve(questions);
        
      });
    });
  };

//check ownership of a survey
exports.checkSurveyOwnership = (userID, surveyID)=>{
  return new Promise((resolve, reject) => {
    const sql = 'SELECT ID_Admin FROM Survey WHERE ID=?';
    db.all(sql, [surveyID], (err, rows) => {
    if (err) {
        reject(err);
        return;
    }
    if(userID===rows[0].ID_Admin && userID !== undefined){
      resolve(null);
    }else{
      reject("You're not the owner of this survey!");
    }
    });
  });
};

//check survey existence
exports.surveyExistence = (surveyID)=>{
  return new Promise((resolve, reject) => {
    const sql = 'SELECT ID FROM Survey WHERE ID=?';
    db.all(sql, [surveyID], (err, rows) => {
    if (err) {
        reject(err);
        return;
    }
    console.log(rows);
    if(rows.length>0){
      if(surveyID===rows[0].ID){
        resolve(null);
      }else{
        reject("The survey does not exists");
      }
    }else{
      reject("The survey does not exists");
    }

  
    });
  });
};



// get all Main_Answers of a given survey
exports.listMainAnswers = (surveyID) => {
  return new Promise((resolve, reject) => {
      let sql = 'SELECT * FROM Main_Answer as M, Answer as A WHERE M.ID_Survey = ? and M.ID = A.ID_MainAnswer';
      db.all(sql, [surveyID], (err, rows) => {
      if (err) {
          reject(err);
          return;
      }
      let answers = rows.map((a) => ({      
            ID            : a.ID,
            ID_Survey     : a.ID_Survey,
            Username      : a.Username,
            ID_MainAnswer : a.ID_MainAnswer,
            ID_Quest      : a.ID_Quest,
            DisplayOrder  : a.DisplayOrder,
            Answer        : a.Answer
          })
      );
      let id_vector = [];
      const groupBy = function(xs, key) {
        return xs.reduce(function(rv, x, ind, arr) {
          if(ind===0 || id_vector.find((el)=>el===x[key])===undefined){
            id_vector.push(x[key]);
            rv.push( ({      
                    ID_MainAnswer : x.ID_MainAnswer,
                    ID_Survey     : x.ID_Survey,
                    Username      : x.Username,
                    Answers        : [({Answer: x.Answer,
                                        DisplayOrder: x.DisplayOrder})]
                    })  
            );
          }else{
              rv[rv.length-1].Answers.push(({ Answer: x.Answer,
                                              DisplayOrder: x.DisplayOrder}));

          }
          return rv;

        }, []);
      };
      answers = groupBy(answers, "ID_MainAnswer");
      answers.reduce(function(rv, x, ind, arr) {
        x.Answers = x.Answers.sort((a, b)=> a.DisplayOrder-b.DisplayOrder); /**order answers */
        rv.push(x);
        return rv;
      }, [])
      resolve(answers);
    
  });
});
};


// add a new survey
function insertQuestion(surveyID, question){
  
    const sql = 'INSERT INTO Quest(ID_Survey, DisplayOrder, minq, maxq, text, type, Question) VALUES(?, ?, ?, ?, ?, ?, ?)';
    
    db.run(sql, 
      [surveyID, question.dOrd, question.min, question.max, 
       JSON.stringify(question.text), question.type, question.question], function (err) {
        if (err) {
          reject(err);
          return;
        }
      
      
    });
  
}

exports.createSurvey = (survey, questions) => {
  return new Promise((resolve, reject) => {
    let sql = 'INSERT INTO Survey(ID_Admin, Title) VALUES(?, ?)';
    let i = 0;
    let surveyID;
    db.run(sql, [survey.ID_Admin, survey.Title], function (err) {
      if (err) {
        console.log(err);
        reject(err);
        return;
      }
      surveyID = this.lastID;
      for(i=0; i<questions.length; i++){
        insertQuestion(surveyID, questions[i]);
      }
      resolve(surveyID);
    });
  });
};


function insertAnswer(mainID, surveyID, answer){
    const sql = 'INSERT INTO Answer(ID_MainAnswer, ID_Quest, ID_Survey, DisplayOrder, Answer) VALUES(?, ?, ?, ?, ?)';
    db.run(sql, 
      [mainID, answer.id_quest, surveyID, answer.DisplayOrder, answer.answer], function (err) {
        if (err) {
          reject(err);
          return;
        }
    });
 
}

exports.createAnswer = (main, answers) => {
  return new Promise((resolve, reject) => {
    let sql = 'INSERT INTO Main_Answer(ID_Survey, Username) VALUES(?, ?)';
    let i = 0;
    let mainID;
    db.run(sql, [main.ID_Survey, main.Username], function (err) {
      if (err) {
        reject(err);
        return;
      }
      mainID = this.lastID;
      for(i=0; i<answers.length; i++){
        insertAnswer(mainID, main.ID_Survey, answers[i]);
      }
      resolve(mainID);
    });
  });
};


