import db from "../models/index";
import emailService from "./emailService";
let postBookAppointment = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!data.email || !data.doctorId || !data.timeType || !data.date) {
                resolve({
                    errCode: 1,
                    errMessage: "Missing parameter",
                });
            } else {
                emailService.sendSimpleEmail({
                    receiverEmail: data.email,
                    patientName: "Tuấn cùi",
                    time: "8:00 - 9:00 Chủ Nhật 1/7/2023",
                    doctorName: "Vincent",
                    redirectLink:
                        "https://www.youtube.com/channel/UC9GnTmIA8IESH5thAMU5y6A",
                });
                let user = await db.User.findOrCreate({
                    where: { email: data.email },
                    defaults: {
                        email: data.email,
                        roleId: "R3",
                    },
                });

                if (user && user[0]) {
                    await db.Booking.findOrCreate({
                        where: { patientId: user[0].id },
                        defaults: {
                            statusId: "S1",
                            doctorId: data.doctorId,
                            patientId: user[0].id,
                            date: data.date,
                            timeType: data.timeType,
                        },
                    });
                }
                resolve({
                    errCode: 0,
                    errMessage: "Save patient infor successfully",
                });
            }
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = { postBookAppointment };
