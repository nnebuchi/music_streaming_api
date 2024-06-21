const express = require('express');
const genericRouter = express.Router();
const genericController = require('../controllers/genericController');


genericRouter.post('/version', genericController.version);

module.exports = genericRouter;