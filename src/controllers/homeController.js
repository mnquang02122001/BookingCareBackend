import db from '../models/index';
import CRUDService from '../services/CRUDService';
let getHomePage = async (req, res) => {
    try {
        let data = await db.User.findAll();

        return res.render('homepage.ejs', {
            data: JSON.stringify(data),
        });
    } catch (error) {
        console.log(error);
    }
};
let getAboutPage = (req, res) => {
    return res.render('test/about.ejs');
};
let getCRUD = (req, res) => {
    return res.render('crud.ejs');
};
let postCRUD = async (req, res) => {
    let message = await CRUDService.createNewUser(req.body);
    return res.send('post crud from server');
};
let displayGetCRUD = async (req, res) => {
    let data = await CRUDService.getAllUser();
    return res.render('displayCRUD.ejs', {
        dataTable: data,
    });
};
let getEditCRUD = async (req, res) => {
    let userId = req.query.id;
    if (userId) {
        let userData = await CRUDService.getUserInfoById(userId);
        //check user data is existed
        if (userData) {
            res.render('editCRUD.ejs', {
                user: userData,
            });
        }
    } else {
        return res.send('Users not found!');
    }
};
let putCRUD = async (req, res) => {
    let data = req.body;
    let allUsers = await CRUDService.updateUserData(data);
    return res.render('displayCRUD.ejs', {
        dataTable: allUsers,
    });
};
let deleteCRUD = async (req, res) => {
    let id = req.query.id;
    if (id) {
        await CRUDService.deleteUserById(id);
        return res.send('Delete the user successfully');
    } else {
        return res.send('User not found');
    }
};
module.exports = {
    getHomePage,
    getAboutPage,
    getCRUD,
    postCRUD,
    displayGetCRUD,
    getEditCRUD,
    putCRUD,
    deleteCRUD,
};
