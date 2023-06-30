import db from "../models";
import dotenv from "dotenv";
dotenv.config();
import _ from "lodash";
import emailService from "../services/emailService";
const MAX_NUMBER_SCHEDULE = process.env.MAX_NUMBER_SCHEDULE;
let getTopDoctorHome = (limit) => {
    return new Promise(async (resolve, reject) => {
        try {
            let users = await db.User.findAll({
                limit,
                where: { roleId: "R2" },
                order: [["createdAt", "DESC"]],
                attributes: {
                    exclude: ["password"],
                },
                include: [
                    {
                        model: db.Allcode,
                        as: "positionData",
                        attributes: ["valueEn", "valueVi"],
                    },
                    {
                        model: db.Allcode,
                        as: "genderData",
                        attributes: ["valueEn", "valueVi"],
                    },
                ],
                raw: false,
                nest: true,
            });
            resolve({
                errCode: 0,
                data: users,
            });
        } catch (error) {
            reject(error);
        }
    });
};
let getAllDoctors = () => {
    return new Promise(async (resolve, reject) => {
        try {
            let doctors = await db.User.findAll({
                where: { roleId: "R2" },
                attributes: {
                    exclude: ["password", "image"],
                },
            });
            resolve({
                errCode: 0,
                data: doctors,
            });
        } catch (error) {
            reject(error);
        }
    });
};
let checkRequiredFields = (inputData) => {
    let arrFields = [
        "doctorId",
        "contentHTML",
        "contentMarkdown",
        "action",
        "selectedPrice",
        "selectedPayment",
        "selectedProvince",
        "nameClinic",
        "addressClinic",
        "note",
        "specialtyId",
    ];
    let isValid = true;
    let element = "";
    for (let i = 0; i < arrFields.length; i++) {
        if (!inputData[arrFields[i]]) {
            isValid = false;
            element = arrFields[i];
            break;
        }
    }
    return {
        isValid,
        element,
    };
};
let saveDetailInforDoctor = (inputData) => {
    return new Promise(async (resolve, reject) => {
        try {
            let checkObj = checkRequiredFields(inputData);
            if (!checkObj.isValid) {
                resolve({
                    errCode: 1,
                    errMessage: `Missing parameter ${checkObj.element}`,
                });
            } else {
                // upsert to markdown table
                if (inputData.action === "CREATE") {
                    await db.Markdown.create({
                        contentHTML: inputData.contentHTML,
                        contentMarkdown: inputData.contentMarkdown,
                        description: inputData.description,
                        doctorId: inputData.doctorId,
                    });
                } else if (inputData.action === "EDIT") {
                    let doctorMarkdown = await db.Markdown.findOne({
                        where: { doctorId: inputData.doctorId },
                        raw: false,
                    });
                    if (doctorMarkdown) {
                        doctorMarkdown.contentHTML = inputData.contentHTML;
                        doctorMarkdown.contentMarkdown =
                            inputData.contentMarkdown;
                        doctorMarkdown.description = inputData.description;
                        doctorMarkdown.doctorId = inputData.doctorId;
                        await doctorMarkdown.save();
                    }
                }
                // upsert to doctor_infor table
                let doctorInfor = await db.Doctor_Infor.findOne({
                    where: { doctorId: inputData.doctorId },
                    raw: false,
                });
                if (doctorInfor) {
                    //update
                    doctorInfor.doctorId = inputData.doctorId;
                    doctorInfor.priceId = inputData.selectedPrice;
                    doctorInfor.paymentId = inputData.selectedPayment;
                    doctorInfor.provinceId = inputData.selectedProvince;
                    doctorInfor.nameClinic = inputData.nameClinic;
                    doctorInfor.addressClinic = inputData.addressClinic;
                    doctorInfor.note = inputData.note;
                    doctorInfor.specialtyId = inputData.specialtyId;
                    doctorInfor.clinicId = inputData.clinicId;
                    await doctorInfor.save();
                } else {
                    //create
                    await db.Doctor_Infor.create({
                        doctorId: inputData.doctorId,
                        priceId: inputData.selectedPrice,
                        paymentId: inputData.selectedPayment,
                        provinceId: inputData.selectedProvince,
                        nameClinic: inputData.nameClinic,
                        addressClinic: inputData.addressClinic,
                        note: inputData.note,
                        specialtyId: inputData.specialtyId,
                        clinicId: inputData.clinicId,
                    });
                }
                resolve({
                    errCode: 0,
                    errMessage: "Save doctor information successfully",
                });
            }
        } catch (error) {
            reject(error);
        }
    });
};
let getDetailDoctorById = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!id) {
                resolve({
                    errCode: 1,
                    errMessage: "Missing required parameter!",
                });
            } else {
                let data = await db.User.findOne({
                    where: {
                        id,
                    },
                    attributes: {
                        exclude: ["password"],
                    },
                    include: [
                        {
                            model: db.Markdown,
                            attributes: [
                                "description",
                                "contentHTML",
                                "contentMarkdown",
                            ],
                        },
                        {
                            model: db.Allcode,
                            as: "positionData",
                            attributes: ["valueEn", "valueVi"],
                        },
                        {
                            model: db.Doctor_Infor,
                            attributes: {
                                exclude: ["id", "doctorId"],
                            },
                            include: [
                                {
                                    model: db.Allcode,
                                    as: "priceTypeData",
                                    attributes: ["valueEn", "valueVi"],
                                },
                                {
                                    model: db.Allcode,
                                    as: "provinceTypeData",
                                    attributes: ["valueEn", "valueVi"],
                                },
                                {
                                    model: db.Allcode,
                                    as: "paymentTypeData",
                                    attributes: ["valueEn", "valueVi"],
                                },
                            ],
                            // attributes: [
                            //     "description",
                            //     "contentHTML",
                            //     "contentMarkdown",
                            // ],
                        },
                    ],
                    raw: false,
                    nest: true,
                });
                if (data && data.image) {
                    data.image = new Buffer(data.image, "base64").toString(
                        "binary"
                    );
                }
                if (!data) data = {};
                resolve({
                    errCode: 0,
                    data,
                });
            }
        } catch (error) {
            reject(error);
        }
    });
};
let bulkCreateSchedule = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.arrSchedule || !data.doctorId || !data.formatedDate) {
                resolve({
                    errCode: 1,
                    errMessage: "Missing required parameters!",
                });
            } else {
                let schedule = data.arrSchedule;
                if (schedule && schedule.length > 0) {
                    schedule.forEach((item) => {
                        item.maxNumber = MAX_NUMBER_SCHEDULE;
                    });
                }
                //get all existing data
                let existing = await db.Schedule.findAll({
                    where: { doctorId: data.doctorId, date: data.formatedDate },
                    attributes: ["timeType", "date", "doctorId", "maxNumber"],
                });
                //compare difference between schedule data and existing data
                let toCreate = _.differenceWith(schedule, existing, (a, b) => {
                    return a.timeType === b.timeType && +a.date === +b.date;
                });
                //create different data and insert to db
                if (toCreate && toCreate.length > 0) {
                    await db.Schedule.bulkCreate(toCreate);
                }
                resolve({
                    errCode: 0,
                    errMessage: "OK",
                });
            }
        } catch (error) {
            reject(error);
        }
    });
};
let getScheduleByDate = (doctorId, date) => {
    return new Promise(async (resolve, reject) => {
        try {
            if ((!doctorId, !date)) {
                resolve({
                    errCode: 1,
                    errMessage: "Missing required parameters",
                });
            } else {
                let dataSchedule = await db.Schedule.findAll({
                    where: { doctorId, date },
                    include: [
                        {
                            model: db.Allcode,
                            as: "timeTypeData",
                            attributes: ["valueEn", "valueVi"],
                        },
                        {
                            model: db.User,
                            as: "doctorData",
                            attributes: ["firstName", "lastName"],
                        },
                    ],
                    raw: false,
                    nest: true,
                });
                if (!dataSchedule) dataSchedule = [];
                resolve({
                    errCode: 0,
                    data: dataSchedule,
                });
            }
        } catch (error) {
            reject(error);
        }
    });
};
let getExtraInforDoctorById = (doctorId) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!doctorId) {
                resolve({
                    errCode: 1,
                    errMessage: "Missing required parameters",
                });
            } else {
                let data = await db.Doctor_Infor.findOne({
                    where: { doctorId },
                    attributes: {
                        exclude: ["id", "doctorId"],
                    },
                    include: [
                        {
                            model: db.Allcode,
                            as: "priceTypeData",
                            attributes: ["valueEn", "valueVi"],
                        },
                        {
                            model: db.Allcode,
                            as: "provinceTypeData",
                            attributes: ["valueEn", "valueVi"],
                        },
                        {
                            model: db.Allcode,
                            as: "paymentTypeData",
                            attributes: ["valueEn", "valueVi"],
                        },
                    ],
                    raw: false,
                    nest: true,
                });
                if (!data) data = [];
                resolve({
                    errCode: 0,
                    data,
                });
            }
        } catch (error) {
            reject(error);
        }
    });
};
let getProfileDoctorById = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!id) {
                resolve({
                    errCode: 1,
                    errMessage: "Missing required parameters",
                });
            } else {
                let data = await db.User.findOne({
                    where: {
                        id,
                    },
                    attributes: {
                        exclude: ["password"],
                    },
                    include: [
                        {
                            model: db.Markdown,
                            attributes: [
                                "description",
                                "contentHTML",
                                "contentMarkdown",
                            ],
                        },
                        {
                            model: db.Allcode,
                            as: "positionData",
                            attributes: ["valueEn", "valueVi"],
                        },
                        {
                            model: db.Doctor_Infor,
                            attributes: {
                                exclude: ["id", "doctorId"],
                            },
                            include: [
                                {
                                    model: db.Allcode,
                                    as: "priceTypeData",
                                    attributes: ["valueEn", "valueVi"],
                                },
                                {
                                    model: db.Allcode,
                                    as: "provinceTypeData",
                                    attributes: ["valueEn", "valueVi"],
                                },
                                {
                                    model: db.Allcode,
                                    as: "paymentTypeData",
                                    attributes: ["valueEn", "valueVi"],
                                },
                            ],
                        },
                    ],
                    raw: false,
                    nest: true,
                });
                if (data && data.image) {
                    data.image = new Buffer(data.image, "base64").toString(
                        "binary"
                    );
                }
                if (!data) data = {};
                resolve({
                    errCode: 0,
                    data,
                });
            }
        } catch (error) {
            reject(error);
        }
    });
};
let getListPatientForDoctor = (doctorId, date) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!doctorId || !date) {
                resolve({
                    errCode: 1,
                    errMessage: "Missing required parameter",
                });
            } else {
                let data = await db.Booking.findAll({
                    where: {
                        statusId: "S2",
                        doctorId,
                        date,
                    },
                    include: [
                        {
                            model: db.User,
                            as: "patientData",
                            attributes: [
                                "email",
                                "firstName",
                                "address",
                                "gender",
                                "phoneNumber",
                            ],
                            include: [
                                {
                                    model: db.Allcode,
                                    as: "genderData",
                                    attributes: ["valueVi", "valueEn"],
                                },
                            ],
                        },
                        {
                            model: db.Allcode,
                            as: "timeTypeDataPatient",
                            attributes: ["valueVi", "valueEn"],
                        },
                    ],
                    raw: false,
                    nest: true,
                });
                resolve({
                    errCode: 0,
                    data,
                });
            }
        } catch (error) {
            reject(error);
        }
    });
};
let sendRemedy = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (
                !data.email ||
                !data.doctorId ||
                !data.patientId ||
                !data.timeType ||
                !data.imgBase64
            ) {
                resolve({
                    errCode: 1,
                    errMessage: "Missing required parameter",
                });
            } else {
                let { doctorId, patientId, timeType } = data;
                let appointment = await db.Booking.findOne({
                    where: { doctorId, patientId, timeType, statusId: "S2" },
                    raw: false,
                });
                if (appointment) {
                    appointment.statusId = "S3";
                    await appointment.save();
                }
                await emailService.sendAttachment(data);
                resolve({
                    errCode: 0,
                    errMessage: "Ok",
                });
            }
        } catch (error) {
            reject(error);
        }
    });
};
module.exports = {
    getTopDoctorHome,
    getAllDoctors,
    saveDetailInforDoctor,
    getDetailDoctorById,
    bulkCreateSchedule,
    getScheduleByDate,
    getExtraInforDoctorById,
    getProfileDoctorById,
    getListPatientForDoctor,
    sendRemedy,
};
