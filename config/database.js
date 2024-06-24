const { Sequelize } = require('sequelize')

const sequelize = new Sequelize('mydb', 'root', 'hellosql', {
    host: 'localhost',
    dialect: 'mysql'
});

module.exports = sequelize;