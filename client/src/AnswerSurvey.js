import {Button, Container, Row, Col, Alert, Form} from 'react-bootstrap';
import {ArrowRightCircleFill,  ArrowLeftCircleFill} from 'react-bootstrap-icons';
import {useLocation, Redirect} from 'react-router-dom';
import API from "./API.js";
import { useEffect, useState } from 'react';


function AnswerSurvey(props) {

    const location = useLocation();

    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState([]);
    const [answErrors, setAnswErrors] = useState([]);

    const [submitted, setSubmitted] = useState(false);
    const [validated, setValidated] = useState(false);
    const [username, setUsername]   = useState("");
    const [errorUsername, setErrorUsername] = useState(undefined);

    const [rows, setRows] = useState([]); /**all fetched answers */
    const [navigator, setNavigator] = useState(0); /**to move across different answers */
    const [waitAnswers, setWaitAnswers] = useState(true);

    const navigate = (direction) => {
        let newpos;
        if(direction==="right"){
            newpos = navigator + 1;
        }else{
            newpos = navigator - 1;
        }
        if(newpos<0){
            newpos = rows.length - 1;
        }
        if(newpos >= rows.length){
            newpos = 0
        }
        if(rows.length!==0){
            setNavigator(newpos);
            setAnswers(()=>rows[newpos].Answers.map((a, ind)=>questions[ind].type===1?JSON.parse(a.Answer):a.Answer)); /**boolean vector needs to be parsed */
            setUsername(()=>rows[newpos].Username);
        }
    };

    const addAnswer = async () =>{
        try{
            await API.addAnswer(
                location.state.surveyID,
                username,
                answers.map((a, ind)=> ({
                                        answer      : questions[ind].type===1?JSON.stringify(a):a, /**boolean vector needs stringify */
                                        DisplayOrder: questions[ind].dOrd,
                                        id_quest    : questions[ind].id,
                                        type        : questions[ind].type
                                    }))
            );
        }catch(err){
            throw err;
        }
    };

    const updateAnswers = (value, index, checkIndex) =>{
        let r = [...answers];
        if(checkIndex === null){
            if(value.length<=200){
                r[index] = value;
            }
        }else{
            r[index][checkIndex] = value;
        }
        setAnswers(()=>[...r]);
    };

    const handleSubmit = async (event) =>{
        event.preventDefault();
        event.stopPropagation();
        let i;
        let j;
        let r;
        let count;
        let finalcheck = true;
        r = [...answErrors];
        if(username===""){
            setErrorUsername("You must choose a username!");
            finalcheck = false;
        }
        else{
            setErrorUsername(undefined);
        }
        for(i=0; i<questions.length; i++){
            if(questions[i].type===0){
                if(answers[i]==="" && questions[i].min>0){
                    r[i] = "This question is mandatory!"
                    finalcheck = false;         
                }
                else{
                    r[i] = undefined;                    
                }
            }else{
                count=0;
                for(j=0; j<answers[i].length; j++){
                    if(answers[i][j]===true){
                        count++;
                    }
                }
                /* min check  */
                if(count<questions[i].min){
                    r[i] = `Too few alternatives!\nThis question needs ${questions[i].min} answer(s)!`;
                    finalcheck = false;                    
                }
                else{
                    /* max check */
                    if(count>questions[i].max){
                        r[i] = `Too much alternatives!\nThis expects at most ${questions[i].max} answer(s)!`;
                        finalcheck = false;                        
                    }
                    else{
                        r[i] = undefined;                        
                    }
                }

                
            }
        }
        setAnswErrors(()=>[...r]);
        /* validation */
        if(finalcheck){
            setValidated(true);
            addAnswer();
            props.setDirty(true);
            setSubmitted(true);
            
        }
        else{
            setValidated(false);
            
        }
        
    };

    const resetFields = () =>{
        let i = 0;
        let j = 0;
        let ansvec = [];
        let ansErr = [];
        let voidArr = [];
        for(i=0; i<questions.length; i++){
            if(questions[i].type===0){
                ansvec.push("");
            }
            else{
                voidArr = [];
                for(j=0; j<questions[i].text.length; j++){
                    voidArr.push(false);
                }
                ansvec.push(voidArr);
            }
            ansErr.push(undefined);
        }
        setUsername("");
        setErrorUsername(undefined);
        setAnswers([...ansvec]);
        setAnswErrors([...ansErr]);
        setValidated(false);
    };

    useEffect(()=>{
        const fetchQuestions = async () =>{
            let i = 0;
            let j = 0;
            let ansvec = [];
            let ansErr = [];
            let voidArr = [];
            let array;
            try{
                array = await API.fetchQuestions(location.state.surveyID);
            }catch(err){
                throw err;
            }
            for(i=0; i<array.length; i++){
                if(array[i].type===0){ /**you may push an array for multiple quest or a string for open */
                    ansvec.push("");
                }
                else{
                    voidArr = [];
                    for(j=0; j<array[i].text.length; j++){
                        voidArr.push(false);
                    }
                    ansvec.push(voidArr);
                }
                ansErr.push(undefined); /**fill error vector with undefined */
            }
            if(props.admin===true){
                let buff;
                try{
                    buff = await API.fetchAnswers(location.state.surveyID);
                }catch(err){
                    throw err;
                }
                if(buff.length!==0){
                    setRows([...buff]);
                    setAnswers(()=>buff[0].Answers.map((a, ind)=>array[ind].type===1?JSON.parse(a.Answer):a.Answer)); /**boolean vector needs to be parsed */
                    setUsername(buff[0].Username);
                }else{
                    setAnswers([...ansvec]);
                }
                
            }else{
                setAnswers([...ansvec]);
            }
            setAnswErrors([...ansErr]);
            setQuestions([...array]);
            setWaitAnswers(false);
        };
        if(location.state!==undefined 
            && ((location.pathname==="/viewAnswers" && props.admin===true)
                        ||
                (location.pathname==="/answerSurvey" && props.admin===false))){ /*avoid errors if you go with direct url or login logout or f5 reload*/
            setWaitAnswers(true);
            fetchQuestions();
        }
        
        
    },[location, props.admin]);

    return(
        (location.state!==undefined && submitted===false && ((location.pathname==="/viewAnswers" && props.admin===true)
                        ||
                                (location.pathname==="/answerSurvey" && props.admin===false)
                        ))
                                || props.waiting===true /*for f5*/
                                
                                ?

            props.waiting===false ?
            <div className="below-nav w-100 pr-0 pl-0">
                <Container>
                    
                        <Row className="col-12 text-center">
                            <h1 ><b>{location.state.title}</b></h1>
                        </Row>
                        <Row className="col-12 text-center">
                        {props.admin===true? <h3>Review Answers</h3>:<h3>Answer Survey</h3>}
                        </Row>
                    
                    <Form noValidate validated={validated} onSubmit={handleSubmit}>
                        <Row>
                            <Form.Group className="p-3" controlId="exampleForm.ControlUsername">
                                <Form.Label>Username</Form.Label>
                                <Form.Control disabled={props.admin} required value={username} onChange={(event)=>setUsername(event.target.value)} />
                                {errorUsername ? <Alert variant='danger'>{errorUsername}</Alert> : ''}
                            </Form.Group> 
                        </Row>

                        {questions.map((q)=>
                            <Row key={q.dOrd}>
                                <Form.Group className="p-3" controlId={`exampleForm.ControlInput${q.dOrd+1}`}>
                                    <Form.Label>
                                        {q.question}
                                        {q.type===0 ? q.min>0? <b> [Mandatory]</b>               : <b> [Not Mandatory]</b> : ""}
                                        {q.type===1           ? <b> [min:{q.min}, max:{q.max}]</b>:""}
                                    </Form.Label>
                                    {q.type===0?
                                        <textarea disabled={props.admin} className="w-100 border-info rounded py-1 px-3" required value={answers[q.dOrd-1]} onChange={(event)=>updateAnswers(event.target.value, q.dOrd-1, null)} />
                                    :
                                        <div>
                                            {q.text.map((o, index)=>
                                                <Form.Check id={`check${q.dOrd}${index}`} disabled={props.admin} key={index} type="checkbox" label={o} checked={answers[q.dOrd-1][index]} 
                                                onChange={(event)=>updateAnswers(event.target.checked, q.dOrd-1, index)}/>
                                            )}
                                        </div>}
                                    {answErrors[q.dOrd-1] ? <Alert variant='danger'>{answErrors[q.dOrd-1]}</Alert> : ''}
                                </Form.Group> 
                            </Row>)}

                            <Container fluid className=" w-100">
                                <Row className="justify-content-center">
                                    <Col className="col-8 justify-content-center">
                                        {props.admin===false  ? 
                                            
                                            <Row className="w-100 d-flex justify-content-center">
                                                <Col className="col-5 d-flex justify-content-center">
                                                    <Button className="m-3 p-3" variant="warning" onClick={() => resetFields()}>Reset Fields</Button>
                                                </Col>      
                                                <Col className="col-5 d-flex justify-content-center">
                                                    <Button className="m-3 p-3" variant="primary" type="submit">Submit Answer</Button>
                                                </Col>  
                                            </Row>
                                            :
                                            <>
                                                <Row className="w-100 d-flex justify-content-center fixed-bottom">
                                                    <Col className="col-1  d-flex justify-content-center">
                                                        <Button className="m-3" variant="primary" onClick={()=>navigate("left")}><ArrowLeftCircleFill size={30} /></Button>
                                                    </Col>
                                                    <Col className="col-1 d-flex align-items-center justify-content-center text-center">
                                                    {   
                                                        waitAnswers===false ? 
                                                            <div>{rows.length!==0 ? `${navigator+1}/${rows.length}` : <Alert variant="danger">No answers yet!</Alert>}</div>
                                                        :
                                                            <div>Loading...</div>
                                                    }
                                                    </Col>
                                                    <Col className="col-1 d-flex justify-content-center">
                                                        <Button className="m-3" variant="primary" onClick={()=>navigate("right")}><ArrowRightCircleFill size={30} /></Button>
                                                    </Col>
                                                </Row>

                                            </>
                                        }
                                    </Col>
                                </Row>
                            </Container>
                    </Form>
                    <Row style={{height: 200 + 'px'}} className="w-100"></Row>
                </Container>
            </div>:""
            :
            <Redirect to="/"/>
                            
    );
}
export default AnswerSurvey;
