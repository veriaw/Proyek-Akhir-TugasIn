import { DataTypes } from "sequelize";
import db from "../configs/Database.js";

const Logs = db.define("Log", {

    id:{
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    description:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    logDate:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    userId:{
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    taskId:{
        type: DataTypes.INTEGER,
        allowNull: true,
    },
});

export default Logs;