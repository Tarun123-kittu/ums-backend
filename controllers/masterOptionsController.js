const { errorResponse, successResponse } = require('../utils/responseHandler');
const masterOptionsService = require('../services/masterOptionsService');

exports.get_master_options = async (req, res) => {
    try {
        let category = req.query.category;

        if (!category) {
            let result = masterOptionsService.getAllMasterOptions();
            return res.status(200).json(successResponse('master options fetched successfully.', result));
        }

        let result = masterOptionsService.getMasterOptionsByCategory(category);

        if (!result) {
            return res.status(400).json(errorResponse(`No master options found for category: ${category}`));
        }

        return res.status(200).json(successResponse(`${category} options fetched successfully.`, result));
    } catch (error) {
        console.log('ERROR::', error);
        return res.status(500).json(errorResponse(error.message));
    }
};