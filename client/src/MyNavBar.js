import { PersonCircle, ReplyAll } from 'react-bootstrap-icons';
import {Button, Container, Row, Col, Navbar} from 'react-bootstrap';
import {useState} from 'react';
import MyLoginModal from "./MyLoginModal";


function MyNavBar(props) {
    const [modalShow, setModalShow] = useState(false);

    return(
      <nav className="navbar navbar-dark navbar-expand-sm bg-primary fixed-top">
        <Container fluid>
            <Row className="w-100 align-items-center d-flex justify-content-center">
                {props.waiting===false?
                    <Col className="col-3 d-flex justify-content-start">    
                        <span className="p-2 border border-light rounded text-light"> {props.logged===true? "Admin":"Guest"} </span>
                    </Col>:""
                }
                <Col className="col-4 d-flex justify-content-center">    
                        <Navbar.Brand href="/" className="navbar-brand p-3" >
                                <ReplyAll size={30}/>{' '}
                                Survey 2.0
                        </Navbar.Brand>
                </Col>
                {props.waiting===false?
                <Col className="col-3 d-flex justify-content-end">
                    <div className="navbar-nav ml-md-auto">
                        <div className="nav-item nav-link">
                                {props.logged ?  <Button variant="dark" onClick={()=>props.logout()} >Logout</Button>  :  <Button variant="primary" onClick={() => setModalShow(true)} type="button"><PersonCircle size={30} /></Button> }
                        </div>
                    </div>
                </Col>:""
                }
            </Row>
        </Container>
        <MyLoginModal
                show={modalShow}
                onHide={() => setModalShow(false)}
                loginCallback={props.loginCallback}
        />   
    </nav>
    );
}
export default MyNavBar;
