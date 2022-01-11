import {Button, Container, Row, Col, Alert, Form} from 'react-bootstrap';
import {useState} from 'react';
import { ArrowUp, ArrowDown, Trash } from 'react-bootstrap-icons';
import {Redirect} from 'react-router-dom';
import { Question } from './Question.js';

function AddSurvey(props) {

    const [questions, setQuestions] = useState([]);
    const [errorQuestions, setErrorQuestions] = useState([]);
    const [errorVoid, setErrorVoid] = useState(undefined);
    const [title, setTitle] = useState("");
    const [errorTitle, setErrorTitle] = useState(undefined);
    const [submitted, setSubmitted] = useState(false);

    const [validated, setValidated] = useState(0);

    const [counter, setCounter] = useState(1);
    
    const updateQuestions = (value, ind, field, ti)=>{
        let r = [...questions];
        if(ti===undefined){
            r[ind][field] = value;
        }else{
            r[ind][field][ti] = value;
        }
        setQuestions([...r]);
    };

    const updateErrors = (value, ind, field, ti)=>{
        let r  = [...errorQuestions];
        if(ti===undefined){
            r[ind][field] = value;
        }else{
            r[ind][field][ti] = value;
        }
        setErrorQuestions([...r]);
    };

    const incDec = (delta, ind, field)=>{ /**+-buttons for min max and alternatives */
        let r = [...questions];
        let value;
        value = r[ind][field] + delta;
        if(field==="text"){
            if(delta===1){
                let ers = [...errorQuestions];
                ers[ind][field].push(undefined);
                r[ind][field].push("");
                setQuestions([...r]);
                setErrorQuestions([...ers]);
            }
            else{
                if(r[ind][field].length>1){
                    let ers = [...errorQuestions];
                    ers[ind][field].pop();
                    r[ind][field].pop();
                    setQuestions([...r]);
                    setErrorQuestions([...ers]);
                }
            }
        }else{
            if(value>=0 && field==="min"){
                r[ind][field] += delta;
                setQuestions([...r]);
            }
            else{
                if(value>=1 && field==="max"){
                    r[ind][field] += delta;
                    setQuestions([...r]);
                }
            }
        }
    };

    const addQuest = (type)=>{
        const quest = new Question(null, counter, "", 0, 1, [""], type);
        setCounter((old)=>old+1);
        setQuestions((old)=>[...old, quest]);
        setErrorQuestions((old)=>[...old, ({
                                                question    :undefined, 
                                                min         :undefined, 
                                                max         :undefined,
                                                text        :[undefined]
                                            })]);
    }

    const deleteQuest = (dOrd)=>{
        let r = questions.filter((q)=>q.dOrd!==dOrd);        
        let len = r.length;
        let i;
        for(i=dOrd-1; i<len; i++){
            r[i].dOrd--;
        }
        setCounter((old=>old-1));
        setQuestions([...r]);
        setErrorQuestions((old)=>old.filter((e,i)=>i!==dOrd-1));
    };

    const moveUp = (dOrd)=>{ /**move quests with arrows... also invert first with last if needed */
        let r = [...questions];
        let e = [...errorQuestions];
        let swap;
        let errswap;
        swap = r[dOrd-1];
        errswap = e[dOrd-1];
        if(dOrd!==1){
            swap.dOrd--;
            r[dOrd-1] = r[dOrd-2];
            r[dOrd-1].dOrd++;
            r[dOrd-2] = swap;

            e[dOrd-1] = e[dOrd-2];
            e[dOrd-2] = errswap;
        }else{
            swap.dOrd = r.length;
            r[dOrd-1] = r[r.length-1];
            r[dOrd-1].dOrd = 1;
            r[r.length-1] = swap;

            e[dOrd-1] = e[r.length-1];
            e[r.length-1] = errswap;
        }
        setQuestions(()=>[...r]);
        setErrorQuestions(()=>[...e]);
    };
    const moveDown = (dOrd)=>{  /**move quests with arrows... also invert last with first if needed */
        let r = [...questions];
        let e = [...errorQuestions];
        let swap;
        let errswap;
        swap = r[dOrd-1];
        errswap = e[dOrd-1];
        if(dOrd!==r.length){
            swap.dOrd++;
            r[dOrd-1] = r[dOrd];
            r[dOrd-1].dOrd--;
            r[dOrd] = swap;

            e[dOrd-1] = e[dOrd];
            e[dOrd] = errswap;
        }else{
            swap.dOrd = 1;
            r[dOrd-1] = r[0];
            r[dOrd-1].dOrd = dOrd;
            r[0] = swap;

            e[dOrd-1] = e[0];
            e[0] = errswap;
        }
        setQuestions(()=>[...r]);
        setErrorQuestions(()=>[...e]);
    };

    const handleSubmit = (event)=>{
        let i;
        let j;
        let passCheck = true;
        event.preventDefault();
        event.stopPropagation();
        if(title===""){
            setErrorTitle("Insert a title for your Survey!");
            passCheck = false;
        }
        else{
            setErrorTitle(undefined);
        }
        if(questions.length===0){
            setErrorVoid("Insert at least a question!");
            passCheck = false;
        }
        else{
            setErrorVoid(undefined);
        }
        for(i=0; i<questions.length; i++){
            if(questions[i].question===""){
                updateErrors("Insert the question!", i, "question", undefined);
                passCheck = false;
            }else{
                updateErrors(undefined, i, "question", undefined);
            }
            if(questions[i].type===1){
                if(questions[i].min>questions[i].max){
                    updateErrors("Too much mandatory answers!\nPlease choose a lower threshold or increase the max number of answers (and alternatives if needed)!",
                                    i, "min");
                    passCheck = false;
                }else{
                    if(questions[i].min===questions[i].max && questions[i].max===questions[i].text.length){
                        updateErrors("Too much mandatory answers, \nit makes no sense to have min===max if max is equal to the number of actual alternatives!", i, "min");
                        passCheck = false;
                    }else{
                        updateErrors(undefined, i, "min");
                    }
                }
                for(j=0; j<questions[i].text.length; j++){
                    if(questions[i].text[j]===""){
                        updateErrors("Insert the alternative!", i, "text", j);
                        passCheck = false;
                    }else{
                        updateErrors(undefined, i, "text", j, undefined);
                    }
                }
                if(questions[i].max>questions[i].text.length){
                    updateErrors("Too high value! Choose a value less than the actual number of alternatives", i, "max", undefined);
                    passCheck = false;
                }
                else{
                    updateErrors(undefined, i, "max", undefined);
                }
            }

        }
        if(passCheck){
            setValidated(true);
            props.addSurvey(title, questions);
            setSubmitted(true);
        }
    }
    return(
        (submitted===false && props.admin===true) /**if your not an admin you cannot stay here */
                || props.waiting===true ?         /**wait logging type before redirect */
            <div className="below-nav w-100 pr-0 pl-0">
                <Container>
                    <div className="d-flex justify-content-center">
                        <h1>Create your Survey</h1>
                    </div>
                        <Form noValidate validated={validated} onSubmit={handleSubmit}>
                            <Form.Group className="pb-3 border-bottom border-secondary" controlId="exampleForm.ControlInput1">
                                <Form.Label><b>Title</b></Form.Label>
                                <Form.Control required value={title} onChange={(event)=>setTitle(event.target.value)} />
                                {errorTitle ? <Alert variant='danger'>{errorTitle}</Alert> : ''}
                            </Form.Group>

                            {questions.map((q, ind)=>
                                <Form.Group className="py-1 border-bottom border-secondary" key={`form${q.dOrd}`} controlId={`exampleForm.quest${q.dOrd}`}>
                                    <Row key={`row${q.dOrd}`}>
                                        <Col className="col-9" key={`col1_${q.dOrd}`}>
                                            <Form.Group key={`quest${q.dOrd}`} controlId={`exampleForm.ControlInp${q.dOrd}`} className="pt-2 pb-2">
                                                <Form.Label><b>Question {q.dOrd}</b></Form.Label>
                                                <Form.Control required value={q.question} onChange={(event)=>updateQuestions(event.target.value, ind, "question", undefined)} />
                                                {errorQuestions[q.dOrd-1].question ? <Alert variant='danger'>{errorQuestions[q.dOrd-1].question}</Alert> : ''}
                                            </Form.Group>
                                            {q.type===1 ?
                                            <>
                                                <Form.Group key={`min${q.dOrd}`} controlId={`exampleForm.ControlInput2${q.dOrd}`} className="pt-2 pb-2">
                                                    <Form.Label>Min</Form.Label>
                                                    <Button className="mx-2 px-3 py-0" onClick={()=>incDec(-1, q.dOrd-1, "min")}>-</Button>
                                                    <Button className="mx-2 px-3 py-0" onClick={()=>incDec( 1, q.dOrd-1, "min")}>+</Button>
                                                    <Form.Control className="my-1 bg-light" required value={q.min.toString()} readOnly/>
                                                    {errorQuestions[q.dOrd-1].min ? <Alert variant='danger'>{errorQuestions[q.dOrd-1].min}</Alert> : ''}
                                                </Form.Group>
                                                <Form.Group key={`max${q.dOrd}`} controlId={`exampleForm.ControlInput3${q.dOrd}`}  className="pt-2 pb-2">
                                                    <Form.Label>Max</Form.Label>
                                                    <Button className="mx-2 px-3 py-0" onClick={()=>incDec(-1, q.dOrd-1, "max")}>-</Button>
                                                    <Button className="mx-2 px-3 py-0" onClick={()=>incDec( 1, q.dOrd-1, "max")}>+</Button>
                                                    <Form.Control className="my-1 bg-light" required value={q.max.toString()} readOnly />
                                                    {errorQuestions[q.dOrd-1].max ? <Alert variant='danger'>{errorQuestions[q.dOrd-1].max}</Alert> : ''}
                                                </Form.Group>
                                                <Form.Group key={`text${q.dOrd}`} controlId={`exampleForm.ControlInput4${q.dOrd}`} className="pt-2 pb-2">
                                                    <Form.Label>Answers</Form.Label>
                                                    <Button className="mx-2 px-3 py-0" onClick={()=>incDec(-1, q.dOrd-1, "text")}>-</Button>
                                                    <Button className="mx-2 px-3 py-0" onClick={()=>incDec( 1, q.dOrd-1, "text")}>+</Button>
                                                    {q.text.map((t, ti)=>
                                                        <div key={`${q.dOrd}answ${ti}`}>
                                                            <Form.Control className="my-1" required value={t} onChange={(event)=> updateQuestions(event.target.value, ind, "text", ti) } />
                                                            {errorQuestions[q.dOrd-1].text[ti] ? <Alert variant='danger'>{errorQuestions[q.dOrd-1].text[ti]}</Alert> : ''}
                                                        </div>
                                                    )}
                                                    
                                                </Form.Group>
                                            </> 
                                            
                                            :

                                                <Form.Group key={`min${q.dOrd}`} controlId={`exampleForm.ControlInput5${q.dOrd}`} className="pt-2 pb-2">
                                                        <Row className="d-flex justify-content-left">
                                                            <Col className="col-2">
                                                                <Form.Label >Mandatory:</Form.Label>
                                                            </Col>
                                                            <Col className="col-1">
                                                                <Form.Check type="checkbox" className="my-1" required checked={q.min} onChange={(event)=>updateQuestions(event.target.checked?1:0, ind, "min", undefined)} />
                                                            </Col>    
                                                            {errorQuestions[q.dOrd-1].min ? <Alert variant='danger'>{errorQuestions[q.dOrd-1].min}</Alert> : ''}
                                                        </Row>
                                                </Form.Group>
                                            }
                                        </Col>
                                        <Col key={`col2_${q.dOrd}`} className="col-3 d-flex justify-content-center">
                                            <Button className="m-3" variant="danger" onClick={() => moveUp(q.dOrd)}>
                                                <ArrowUp key={q.dOrd} size={20}/>
                                            </Button>
                                            <Button className="m-3" variant="danger" onClick={() => moveDown(q.dOrd)}>
                                                <ArrowDown key={q.dOrd} size={20}/>
                                            </Button>
                                            <Button className="m-3" variant="danger" onClick={() => deleteQuest(q.dOrd)}>
                                                <Trash key={`del${q.dOrd}`} size={20}/>
                                            </Button>
                                        </Col>
                                    </Row>
                                </Form.Group>
                            )}

                            <Container fluid className=" w-100">
                                <Row className="justify-content-center">
                                    <Col className="col-8 d-flex justify-content-center">
                                        <Button className="m-3" variant="warning" onClick={() => addQuest(1)}>+ Closed Question</Button>
                                        <Button className="m-3" variant="warning" onClick={() => addQuest(0)}>+ Open Question</Button>
                                        <Button className="m-3" variant="primary" type="submit" >Publish</Button>
                                    </Col>
                                </Row>
                            </Container>
                        
                            {errorVoid ? <Alert variant='danger'>{errorVoid}</Alert> : ''}
                        </Form>
  
                </Container>
            </div>
            :
            <Redirect to="/"/>
            
    );
}
export default AddSurvey;
