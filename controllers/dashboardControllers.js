const { successResponse, errorResponse } = require("../utils/responseHandler")
const { sequelize } = require("../models");
const moment = require('moment-timezone');






exports.get_dashboard_leaves = async (req, res) => {
    try {
        let { month } = req.query;
        const currentDate = new Date();
        let queryMonth = month || (currentDate.getMonth() + 1);

        const leavesQuery = `
            SELECT 
                u.email,
                u.name, 
                u.position,
                l.id AS leave_id, 
                l.createdAt AS date_of_application,
                l.type,
                l.count,
                l.user_id,
                CONCAT(DATE_FORMAT(l.from_date, '%Y-%m-%d'), ' - ', DATE_FORMAT(l.to_date, '%Y-%m-%d')) AS duration, 
                l.status
            FROM 
                leaves l
            JOIN 
                users u ON u.id = l.user_id
            WHERE 
                MONTH(l.createdAt) = :queryMonth AND l.status = 'PENDING'
            ORDER BY 
                l.createdAt DESC;
        `;


        const leaves = await sequelize.query(leavesQuery, {
            replacements: { queryMonth },
            type: sequelize.QueryTypes.SELECT,
        });


        if (leaves.length === 0) {
            queryMonth = parseInt(queryMonth)
            let month_name;
            switch (queryMonth) {
                case 1: month_name = 'January';
                    break;
                case 2: month_name = 'February';
                    break;
                case 3: month_name = 'March';
                    break;
                case 4: month_name = 'April';
                    break;
                case 5: month_name = 'May';
                    break;
                case 6: month_name = 'June';
                    break;
                case 7: month_name = 'July';
                    break;
                case 8: month_name = 'August';
                    break;
                case 9: month_name = 'September';
                    break;
                case 10: month_name = 'October';
                    break;
                case 11: month_name = 'November';
                    break;
                case 12: month_name = 'December';
                    break;
                default: month_name = 'Unknown';
            }
            return res.status(200).json(successResponse(`No pending leaves found for ${month_name}`));
        }



        return res.status(200).json(successResponse("Data retrieved successfully", leaves));

    } catch (error) {
        console.log("ERROR::", error)
        return res.status(500).json(errorResponse(error.message))
    }
}







exports.get_dashboard_interview_leads_overview = async (req, res) => {
    try {
        const { timePeriod = 'today' } = req.query;
        let dateCondition;

        const currentDate = new Date();
        const startOfDay = new Date(currentDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(currentDate.setHours(23, 59, 59, 999));

        switch (timePeriod) {
            case 'week':
                const startOfWeek = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay()));
                const endOfWeek = new Date(currentDate.setDate(startOfWeek.getDate() + 6));
                dateCondition = `createdAt BETWEEN '${startOfWeek.toISOString()}' AND '${endOfWeek.toISOString()}'`;
                break;
            case 'month':
                const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                dateCondition = `createdAt BETWEEN '${startOfMonth.toISOString()}' AND '${endOfMonth.toISOString()}'`;
                break;
            default:
                dateCondition = `createdAt BETWEEN '${startOfDay.toISOString()}' AND '${endOfDay.toISOString()}'`;
                break;
        }


        const leadsOverviewQuery = `
            SELECT 
                COUNT(id) AS totalLeads,
                SUM(CASE WHEN in_round = 1 THEN 1 ELSE 0 END) AS hrRound,
                SUM(CASE WHEN in_round = 2 THEN 1 ELSE 0 END) AS technicalRound,
                SUM(CASE WHEN in_round = 3 THEN 1 ELSE 0 END) AS faceToFaceRound,
                SUM(CASE WHEN in_round = 4 THEN 1 ELSE 0 END) AS finalRound
            FROM interview_leads
            WHERE ${dateCondition};
        `;

        const leadsOverview = await sequelize.query(leadsOverviewQuery, {
            type: sequelize.QueryTypes.SELECT,
        });


        const finalRoundStatusQuery = `
            SELECT 
                SUM(CASE WHEN final_result = 'SELECTED' THEN 1 ELSE 0 END) AS selected,
                SUM(CASE WHEN final_result = 'REJECTED' THEN 1 ELSE 0 END) AS rejected,
                SUM(CASE WHEN final_result = 'ON HOLD' THEN 1 ELSE 0 END) AS onHold,
                SUM(CASE WHEN final_result = 'PENDING' THEN 1 ELSE 0 END) AS pending
            FROM interviews
            WHERE lead_id IN (SELECT id FROM interview_leads WHERE in_round = 4)
            AND ${dateCondition};
        `;

        const finalRoundStatus = await sequelize.query(finalRoundStatusQuery, {
            type: sequelize.QueryTypes.SELECT,
        });



        const result = {
            totalLeads: leadsOverview[0].totalLeads,
            hrRound: leadsOverview[0].hrRound,
            technicalRound: leadsOverview[0].technicalRound,
            faceToFaceRound: leadsOverview[0].faceToFaceRound,
            finalRound: leadsOverview[0].finalRound,
            selected: finalRoundStatus[0].selected,
            rejected: finalRoundStatus[0].rejected,
            onHold: finalRoundStatus[0].onHold,
            pending: finalRoundStatus[0].pending,
        };

        return res.status(200).json(successResponse("Data retrieved successfully", result))

    } catch (error) {
        console.error("Error", error);
        return res.status(500).json(errorResponse(error.message));
    }
};






exports.get_employees_working_time = async (req, res) => {
    try {
        let current_time = moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
        let current_date = moment().tz('Asia/Kolkata').format('YYYY-MM-DD');


        const query = `
            SELECT 
                u.id AS user_id,
                u.name AS user_name,
                a.in_time,
                a.out_time,
                -- Calculate working time (in seconds) based on whether out_time is null or not
                CASE 
                    WHEN a.out_time IS NULL THEN 
                        TIMESTAMPDIFF(SECOND, CONCAT(:currentDate, ' ', a.in_time), :currentTime) 
                    ELSE 
                        TIMESTAMPDIFF(SECOND, CONCAT(:currentDate, ' ', a.in_time), CONCAT(:currentDate, ' ', a.out_time)) 
                END AS working_seconds
            FROM 
                attendances a
            JOIN 
                users u ON u.id = a.user_id
            WHERE 
                a.status = 'PRESENT' AND
                 u.is_disabled = 0
            AND 
                a.date = :currentDate;  -- Get records only for today
        `;

        const result = await sequelize.query(query, {
            replacements: { currentTime: current_time, currentDate: current_date },
            type: sequelize.QueryTypes.SELECT
        });

        result.forEach(entry => {
            const seconds = entry.working_seconds;
            const hours = seconds / 3600;

            entry.total_time = hours.toFixed(2);

            delete entry.working_seconds;
        });

        return res.status(200).json(successResponse(result));

    } catch (error) {
        console.error("ERROR::", error);
        return res.status(500).json(errorResponse(error.message));
    }
};




exports.get_user_today_attendance = async (req, res) => {
    try {
        const user_id = req.result.user_id;
        const get_attendance_query = `
         SELECT in_time,out_time
            FROM attendances 
            WHERE DATE(createdAt) = CURDATE() AND user_id = ?
        `;
        const attendance = await sequelize.query(get_attendance_query, {
            replacements: [user_id],
            type: sequelize.QueryTypes.SELECT
        });

        if (!attendance || attendance.length === 0) {
            return res.status(400).json(errorResponse('No attendance found for today'));
        }

        res.status(200).json(successResponse('Data retreived successfully', attendance));

    } catch (error) {
        return res.status(500).json(errorResponse(error.message));
    }
}





exports.get_all_present_employee = async (req, res) => {
    try {
        const all_present_employees_query = `SELECT COUNT(*) AS presentEmployees
                                            FROM attendances 
                                            WHERE in_time IS NOT NULL 
                                            AND DATE(createdAt) = CURDATE()`;
        const [total_present_employees] = await sequelize.query(all_present_employees_query, {
            type: sequelize.QueryTypes.SELECT
        })

        return res.status(200).json({ type: "success", total_present_employees })
    } catch (error) {
        return res.status(400).json({ type: "error", message: error.message })
    }
}






exports.get_all_on_leave_employees = async (req, res) => {
    try {
        const currentDate = new Date();
        const today = currentDate.toISOString().split('T')[0];


        const leavesCount = await sequelize.query(`
            SELECT COUNT(*) AS onLeaveCount
            FROM leaves
            WHERE status = 'ACCEPTED'
            AND from_date <= '${today}'
            AND to_date >= '${today}'
        `, {
            type: sequelize.QueryTypes.SELECT,
        });


        const attendanceCount = await sequelize.query(`
            SELECT COUNT(*) AS presentCount
            FROM attendances
            WHERE date = '${today}'
            AND status = 'PRESENT'
        `, {
            type: sequelize.QueryTypes.SELECT,
        });


        const onLeaveCount = leavesCount[0].onLeaveCount;
        const presentCount = attendanceCount[0].presentCount;

        const effectiveOnLeaveCount = onLeaveCount - presentCount;

        return res.status(200).json({
            success: true,
            data: {
                onLeaveCount: effectiveOnLeaveCount < 0 ? 0 : effectiveOnLeaveCount,
                totalAcceptedLeaves: onLeaveCount,
                presentCount: presentCount,
            },
        });
    } catch (error) {
        console.log("ERROR::", error);
        return res.status(500).json({ success: false, message: "An error occurred while processing the request." });
    }
};



exports.get_all_interviews = async (req, res) => {
    try {
        const today = new Date().toISOString().slice(0, 10);


        const query = `
                SELECT 
                    COUNT(*) as interviewCount
                FROM 
                    interviews
                WHERE 
                    (DATE(createdAt) = :today OR DATE(updatedAt) = :today);
            `;


        const result = await sequelize.query(query, {
            replacements: { today },
            type: sequelize.QueryTypes.SELECT
        });


        return res.status(200).json({
            success: true,
            data: {
                interviewCount: result[0].interviewCount
            }
        });
    } catch (error) {
        console.log("ERROR::", error)
        return res.status(500).json(errorResponse(error.message))
    }
}







// ******************************** Employee Dashboard **************************


exports.get_employee_leaves_record = async (req, res) => {
    try {
        let userId = req.result.user_id

        let userExistQuery = `SELECT id FROM users WHERE id = ${userId}`
        let isUserExist = await sequelize.query(userExistQuery)

        if (isUserExist.length < 1) {
            return res.status(400).json(errorResponse('User not found with this userId'))
        }

        const appliedLeavesQuery = `
        SELECT COALESCE(SUM(count), 0) AS totalLeaves
        FROM leaves
        WHERE user_id = ${userId} AND from_date >= CURDATE()
        `;
        const [appliedLeaves] = await sequelize.query(appliedLeavesQuery);


        const takenLeavesQuery = `
        SELECT COALESCE(SUM(count), 0) AS totalTakenLeaves
        FROM leaves
        WHERE user_id = ${userId} 
          AND status = 'ACCEPTED'
          AND to_date <= CURDATE()
        `;
        const [takenLeaves] = await sequelize.query(takenLeavesQuery);


        const pendingLeavesQuery = `
        SELECT 
        COALESCE(paid_leave, 0) AS pending_leaves
        FROM bank_leaves
        WHERE employee_id = ${userId}
        ORDER BY createdAt DESC
        LIMIT 1
`;

        const [pendingLeaves] = await sequelize.query(pendingLeavesQuery);


        let leavesData = {
            available_leaves_in_year: 12,
            pending_leaves: pendingLeaves[0].pending_leaves,
            taken_leaves_till_today: takenLeaves[0].totalTakenLeaves,
            applied_leaves_form_today: appliedLeaves[0].totalLeaves
        }

        return res.status(200).json(successResponse('Data retrieved successfully', leavesData))

    } catch (error) {
        console.log('ERROR::', error)
        return res.status(500).json(errorResponse(error.message))
    }
}






exports.get_all_employees_accepted_leaves = async (req, res) => {
    try {
        const startOfWeek = moment().startOf('week').format('YYYY-MM-DD');
        const endOfWeek = moment().endOf('week').format('YYYY-MM-DD');

        const usersWithLeavesQuery = `
            SELECT u.id, u.name, u.position, l.count, l.from_date, l.to_date
            FROM users u
            LEFT JOIN leaves l ON u.id = l.user_id
            WHERE l.status = 'ACCEPTED'
            AND (
                (l.from_date >= '${startOfWeek}' AND l.from_date <= '${endOfWeek}') 
                OR (l.to_date >= '${startOfWeek}' AND l.to_date <= '${endOfWeek}')
                OR (l.from_date <= '${startOfWeek}' AND l.to_date >= '${endOfWeek}')
            )
        `;

        const [usersWithLeaves] = await sequelize.query(usersWithLeavesQuery);

        if (usersWithLeaves.length < 1) {
            return res.status(400).json(errorResponse('No accepted leaves found for this week'));
        }

        const responseData = usersWithLeaves.map(user => ({
            name: user.name,
            department: user.position,
            count: user.count,
            duration: user.from_date === user.to_date ? user.from_date : `${user.from_date} to ${user.to_date}`,
        }));

        return res.status(200).json(successResponse('Data retrieved successfully', responseData));

    } catch (error) {
        console.log("ERROR::", error);
        return res.status(500).json(errorResponse(error.message));
    }
};





exports.create_task = async (req, res) => {
    let transaction;
    try {

        transaction = await sequelize.transaction();

        let userId = req.result.user_id;
        let task_name = req.body.task_name;
        let task_status = 'ACTIVE';


        if (!task_name) {
            return res.status(400).json(errorResponse('Please provide task_name'));
        }


        let userExistQuery = `SELECT id FROM users WHERE id = ?`;
        let [isUserExist] = await sequelize.query(userExistQuery, {
            replacements: [userId],
            type: sequelize.QueryTypes.SELECT,
            transaction
        });

        if (!isUserExist) {
            return res.status(400).json(errorResponse('User not found with this userId'));
        }


        const insertTaskQuery = `
            INSERT INTO to_do_list (user_id, task_name, task_status, created_at, updated_at) 
            VALUES (?, ?, ?, NOW(), NOW())
        `;

        await sequelize.query(insertTaskQuery, {
            replacements: [userId, task_name, task_status],
            type: sequelize.QueryTypes.INSERT,
            transaction
        });


        await transaction.commit();

        return res.status(200).json(successResponse('Task added successfully'));

    } catch (error) {
        if (transaction) await transaction.rollback();
        console.log("ERROR::", error);
        return res.status(500).json(errorResponse(error.message));
    }
};





exports.get_tasks = async (req, res) => {
    try {

        let userId = req.result.user_id
        let task_status = req.query.task_status

        if (!task_status) {
            return res.status(400).json(errorResponse('Provide task status for which you want to get list'))
        }

        if (task_status !== 'ACTIVE' && task_status !== 'COMPLETED') {
            return res.status(400).json(errorResponse('Task status must be one of: ACTIVE or COMPLETED'));
        }

        let userExistQuery = `SELECT id FROM users WHERE id = ?`;
        let [isUserExist] = await sequelize.query(userExistQuery, {
            replacements: [userId],
            type: sequelize.QueryTypes.SELECT,
        });

        if (!isUserExist) {
            return res.status(400).json(errorResponse('User not found with this userId'));
        }


        let getUserTasksQuery = `Select id,task_name 
        FROM to_do_list 
        WHERE user_id = ? 
        AND task_status = ?
        AND MONTH(created_at) = MONTH(CURDATE()) 
        AND YEAR(created_at) = YEAR(CURDATE())
        `

        let [userTasks] = await sequelize.query(getUserTasksQuery, {
            replacements: [userId, task_status],
        })

        if (userTasks.length < 1) {
            return res.status(200).json(successResponse(`Currently you have no task in ${task_status}`))
        }

        return res.status(200).json(successResponse('Data retreived successfully', userTasks))

    } catch (error) {
        console.log('ERROR::', error)
        return res.status(500).json(errorResponse(error.message))
    }
}




exports.shift_task = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const userId = req.result.user_id;
        const tasks_ids = req.body.tasks_ids;
        const status = req.body.task_status;


        if (!status) {
            return res.status(400).json(errorResponse('Please provide task status to where you want to move tasks'));
        }
        if (status !== 'ACTIVE' && status !== 'COMPLETED') {
            return res.status(400).json(errorResponse('Task status must be one of: ACTIVE or COMPLETED'));
        }
        if (!tasks_ids || !Array.isArray(tasks_ids) || tasks_ids.length === 0) {
            return res.status(400).json(errorResponse('Please provide a valid array of task IDs'));
        }


        const userExistQuery = `SELECT id FROM users WHERE id = ?`;
        const [isUserExist] = await sequelize.query(userExistQuery, {
            replacements: [userId],
            type: sequelize.QueryTypes.SELECT,
        });

        if (!isUserExist) {
            return res.status(400).json(errorResponse('User not found with this userId'));
        }


        const tasksQuery = `SELECT id FROM to_do_list WHERE id IN (?) AND user_id = ?`;
        const [tasks] = await sequelize.query(tasksQuery, {
            replacements: [tasks_ids, userId],
            type: sequelize.QueryTypes.SELECT,
        });



        const updateTasksQuery = `UPDATE to_do_list SET task_status = ?, updated_at = NOW() WHERE id IN (?)`;
        await sequelize.query(updateTasksQuery, {
            replacements: [status, tasks_ids],
            type: sequelize.QueryTypes.UPDATE,
            transaction,
        });

        await transaction.commit();
        return res.status(200).json(successResponse('Tasks shifted successfully'));

    } catch (error) {
        if (transaction) await transaction.rollback();
        console.log('ERROR::', error)
        return res.status(500).json(errorResponse(error.message))
    }
}




exports.get_notifications = async (req, res) => {
    try {
        let userId = req.result.user_id;

        const userExistQuery = `SELECT id FROM users WHERE id = ?`;
        const [isUserExist] = await sequelize.query(userExistQuery, {
            replacements: [userId],
            type: sequelize.QueryTypes.SELECT,
        });

        if (!isUserExist) {
            return res.status(400).json(errorResponse("User doesn't exist with this userId"))
        }

        let getNotificationQuery = `SELECT id,type,text,status,created_at  FROM notifications WHERE user_id = ?`
        let [getNotifications] = await sequelize.query(getNotificationQuery, {
            replacements: [userId],
        })

        if (getNotifications.length < 1) {
            return res.status(400).json(errorResponse('No notifications found'))
        }
        return res.status(200).json(successResponse('Data retrieved successfully', getNotifications))

    } catch (error) {
        console.log('ERROR:', error)
        return res.status(500).json(errorResponse(error.message))
    }
}




exports.mark_notifications_as_read = async (req, res) => {
    try {
        let userId = req.result.user_id

        const userExistQuery = `SELECT id FROM users WHERE id = ?`;
        const [isUserExist] = await sequelize.query(userExistQuery, {
            replacements: [userId],
            type: sequelize.QueryTypes.SELECT,
        });

        if (!isUserExist) {
            return res.status(400).json(errorResponse("User doesn't exist with this userId"))
        }

        const readNotificationsQuery = `UPDATE notifications SET status = ? WHERE user_id = ?`
        await sequelize.query(readNotificationsQuery, {
            replacements: ['read', userId]
        })

        return res.status(200).json(successResponse("Notifications mark as read"))

    } catch (error) {
        console.log('ERROR::', error)
        return res.status(500).json(errorResponse(error.message))
    }
}





exports.get_employee_montly_leave_report = async (req, res) => {
    try {
        let userId = req.result.user_id

        const userExistQuery = `SELECT id FROM users WHERE id = ?`;
        const [isUserExist] = await sequelize.query(userExistQuery, {
            replacements: [userId],
            type: sequelize.QueryTypes.SELECT,
        });

        if (!isUserExist) {
            return res.status(400).json(errorResponse("User doesn't exist with this userId"))
        }

        const getLeavesTypesCountQuery =
            `SELECT 
            type, 
            SUM(count) AS total_count
               FROM 
                   Leaves
               WHERE 
                   user_id = ? 
                   AND MONTH(from_date) = MONTH(CURRENT_DATE()) 
                   AND YEAR(from_date) = YEAR(CURRENT_DATE())  
                   AND from_date <= CURRENT_DATE()             
                   AND status = 'ACCEPTED'                    
               GROUP BY 
                   type;
        `

        let [leavesTypes] = await sequelize.query(getLeavesTypesCountQuery, {
            replacements: [userId]
        })


        const count_late_entries_query = `
        SELECT COUNT(*) AS late_count
        FROM late_attendance
        WHERE user_id = ? AND MONTH(date) = MONTH(CURDATE()) AND YEAR(date) = YEAR(CURDATE())
    `;
        const [late_entries] = await sequelize.query(count_late_entries_query, {
            replacements: [userId],
            type: sequelize.QueryTypes.SELECT
        });




        const validLeaveTypes = ['SICK LEAVE', 'URGENT LEAVE', 'CASUAL', 'HALF DAY', 'SHORT DAY'];



        const leaveCounts = validLeaveTypes.reduce((acc, type) => {
            const formattedType = type.replace(/ /g, '_');
            acc[formattedType] = 0;
            return acc;
        }, {});


        leavesTypes.forEach(leave => {
            const formattedType = leave.type.replace(/ /g, '_');
            if (leaveCounts.hasOwnProperty(formattedType)) {
                leaveCounts[formattedType] = leave.total_count || 0;
            }
        });


        leaveCounts["late_count"] = late_entries.late_count || 0;
        leaveCounts["absent"] = 0;

        return res.status(200).json(successResponse('Data retrieved successfully', leaveCounts));



    } catch (error) {
        console.log('ERROR::', error)
        return res.status(500).json(errorResponse(error.message))
    }
}

