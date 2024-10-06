const creatorService =  require('../services/creatorService');

exports.addFollower = async (req, res) => {
    return creatorService.addFollower(req, res);
}

