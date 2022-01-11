import {Button, Container, Row, Col} from 'react-bootstrap';
import MySurvey from "./MySurvey.js";
import {Link} from 'react-router-dom';

function MyMain(props) {

    return(
      props.waiting === false ?
        <main className="below-nav w-100 pr-0 pl-0">
          <Container fluid>
            <Row className="justify-content-center border-bottom border-dark p-3"> 
                <Col className="col-8 d-flex justify-content-center">
                    <b>Title</b>
                </Col>
                <Col className="col-2 d-flex justify-content-center">
                    {props.admin===true ? <b>#Answers</b> : ""}
                </Col>
                <Col className="col-2 d-flex justify-content-center">
                    <b>Action</b>
                </Col>
            </Row>
          </Container>
            <Container fluid>
                  { props.surveys.map((s) => <MySurvey key={s.ID} ID={s.ID} Title={s.Title} nAnsw={s.nAnsw} admin={props.admin}/>) }
            </Container>
            {props.admin===true ? <Link to={{pathname: "/addSurvey"}}><Button id="plusbutton" type="button" className="btn btn-lg btn-success fixed-right-bottom">&#43;</Button></Link>:"" }
        </main>
      :""
    );
}
export default MyMain;
