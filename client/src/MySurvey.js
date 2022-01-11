import {Button, Row, Col} from 'react-bootstrap';
import {Link} from 'react-router-dom';

function MySurvey(props) {


    return(
                <Row className="justify-content-center border-bottom p-3"> 
                    <Col className="col-8 d-flex justify-content-center align-items-center">
                        <div>{props.Title}</div>
                    </Col>
                    <Col className="col-2 d-flex justify-content-center align-items-center">
                        <div>{props.admin===true ? props.nAnsw : ""}</div>
                    </Col>
                    <Col className="col-2 d-flex justify-content-center">
                        {props.admin===true ? 
                                <>
                                    <Link to={{pathname: "/viewAnswers", state:{surveyID:props.ID, title:props.Title}}}>
                                        <Button className="m-2 text-light" variant="warning" type="submit" >View</Button>
                                    </Link>
                                    
                                </>
                            : 
                                <Link to={{pathname: "/answerSurvey", state:{surveyID:props.ID, title:props.Title}}}>
                                    <Button className="m-2 text-light" variant="warning" type="submit" >Answer</Button>
                                </Link>}
                    </Col>
                </Row>
    );
}
export default MySurvey;
