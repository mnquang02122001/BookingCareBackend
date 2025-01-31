module.exports = {
    up: (queryInterface, Sequelize) => {
        return Promise.all([
            queryInterface.changeColumn("Schedules", "date", {
                // type: Sequelize.BLOB("long"),
                type: Sequelize.BIGINT,
            }),
        ]);
    },

    down: (queryInterface, Sequelize) => {
        return Promise.all([
            queryInterface.changeColumn("Schedules", "date", {
                // type: Sequelize.BLOB("long"),
                type: Sequelize.BIGINT,
            }),
        ]);
    },
};
