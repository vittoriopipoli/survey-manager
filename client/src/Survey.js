

function Survey(ID, ID_Admin, Title, nAnsw){
    this.ID = ID;
    this.ID_Admin = ID_Admin;
    this.Title = Title;
    this.nAnsw = nAnsw;

    this.toString = ()=>{
        return `ID: ${this.ID}, ID_Admin: ${this.ID_Admin}, Title: ${this.Title}`;
    };
}

export {Survey};