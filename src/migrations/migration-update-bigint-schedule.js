module.exports = {
    up: (queryInterface, Sequelize) => {
        return Promise.all([
            queryInterface.changeColumn("Users", "image", {
                // type: Sequelize.BLOB("long"),
                type: Sequelize.BLOB,
                allowNull: true,
            }),
        ]);
    },

    down: (queryInterface, Sequelize) => {
        return Promise.all([
            queryInterface.changeColumn("Users", "image", {
                // type: Sequelize.BLOB("long"),
                type: Sequelize.BLOB,
                allowNull: true,
            }),
        ]);
    },
};
