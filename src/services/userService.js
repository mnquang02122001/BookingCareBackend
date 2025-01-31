import db from "../models";
import bcrypt from "bcryptjs";
const salt = bcrypt.genSaltSync(10);
let handleUserLogin = (email, password) => {
    return new Promise(async (resolve, reject) => {
        try {
            let userData = {};
            let isExist = await checkUserEmail(email);
            if (isExist) {
                let user = await db.User.findOne({
                    where: { email },
                    attributes: [
                        "id",
                        "email",
                        "roleId",
                        "password",
                        "firstName",
                        "lastName",
                    ],
                    raw: true,
                });
                if (user) {
                    let check = await bcrypt.compare(password, user.password);
                    if (check) {
                        userData.errCode = 0;
                        userData.message = `Ok`;
                        delete user.password;
                        userData.user = user;
                    } else {
                        userData.errCode = 3;
                        userData.errMessage = `Wrong password`;
                    }
                } else {
                    userData.errCode = 2;
                    userData.errMessage = `User is not found`;
                    resolve(userData);
                }
            } else {
                userData.errCode = 1;
                userData.errMessage = `Your email doesn't exist in our system. Plz try other email!`;
            }
            resolve(userData);
        } catch (error) {
            reject(error);
        }
    });
};
let checkUserEmail = (userEmail) => {
    return new Promise(async (resolve, reject) => {
        try {
            let user = await db.User.findOne({
                where: { email: userEmail },
            });
            if (user) {
                resolve(true);
            } else {
                resolve(false);
            }
        } catch (error) {
            reject(error);
        }
    });
};
let getAllUsers = (userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            let users = "";
            if (userId === "ALL") {
                users = await db.User.findAll({
                    attributes: {
                        exclude: ["password"],
                    },
                });
            }
            if (userId && userId !== "ALL") {
                users = await db.User.findOne({
                    where: { id: userId },
                    attributes: {
                        exclude: ["password"],
                    },
                });
            }
            resolve(users);
        } catch (e) {
            reject(e);
        }
    });
};
let createNewUser = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            let check = await checkUserEmail(data.email);
            if (check) {
                resolve({
                    errCode: 1,
                    errMessage:
                        "Your email is already in used, plz try another email!",
                });
            } else {
                let hashPasswordFromBcrypt = await hashUserPassword(
                    data.password
                );
                await db.User.create({
                    email: data.email,
                    password: hashPasswordFromBcrypt,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    address: data.address,
                    phoneNumber: data.phoneNumber,
                    gender: data.gender,
                    roleId: data.roleId,
                    positionId: data.positionId,
                    image: data.avatar,
                });
                resolve({
                    errCode: 0,
                    message: "OK",
                });
            }
        } catch (error) {
            reject(error);
        }
    });
};
let hashUserPassword = (password) => {
    return new Promise(async (resolve, reject) => {
        try {
            let hashPassword = await bcrypt.hashSync(password, salt);
            resolve(hashPassword);
        } catch (error) {
            reject(error);
        }
    });
};
let deleteUser = (id) => {
    return new Promise(async (resolve, reject) => {
        let user = await db.User.findOne({
            where: { id },
        });
        if (!user) {
            resolve({
                errCode: 2,
                errMessage: `The user doesn't exist`,
            });
        } else {
            await db.User.destroy({
                where: { id },
            });
            resolve({
                errCode: 0,
                message: `The user is deleted`,
            });
        }
    });
};
let editUser = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.id || !data.roleId || !data.positionId || !data.gender) {
                resolve({
                    errCode: 2,
                    errMessage: "Missing required parameters",
                });
            } else {
                let user = await db.User.findOne({
                    where: {
                        id: data.id,
                    },
                    raw: false,
                });
                if (user) {
                    user.firstName = data.firstName;
                    user.lastName = data.lastName;
                    user.address = data.address;
                    user.phoneNumber = data.phoneNumber;
                    user.roleId = data.roleId;
                    user.positionId = data.positionId;
                    user.gender = data.gender;
                    if (data.avatar) {
                        user.image = data.avatar;
                    }
                    await user.save();
                    resolve({
                        errCode: 0,
                        message: "Update the user successfully",
                    });
                } else {
                    resolve({
                        errCode: 1,
                        errMessage: "User is not found!",
                    });
                }
            }
        } catch (error) {
            reject(error);
        }
    });
};
let getAllCodeService = (type) => {
    return new Promise(async (resolve, reject) => {
        try {
            let res = {};
            if (!type) {
                res.errCode = 1;
                res.errMessage = "Missing required parameters!";
            } else {
                let allcode = await db.Allcode.findAll({
                    where: { type: type.toUpperCase() },
                });
                res.errCode = 0;
                res.data = allcode;
            }
            resolve(res);
        } catch (e) {
            reject(e);
        }
    });
};
module.exports = {
    handleUserLogin,
    getAllUsers,
    createNewUser,
    deleteUser,
    editUser,
    getAllCodeService,
};
