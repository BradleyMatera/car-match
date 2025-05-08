// Example route file from Routing demo
// import the express router
const router = require('express').Router();
// import the options controller
const optionsCtrl = require('../controllers/options');

// ROUTES *******************
// GET /options route
router.get('/', optionsCtrl.getDecisionOptions);
// GET /options/:id
router.get('/:id', optionsCtrl.getOneById);

// POST /options    NOTE: Using POST for creation!
router.post('/', optionsCtrl.createOption);
// PUT /options/:id
router.put('/:id', optionsCtrl.updateOption);
// DELETE /options/:id
router.delete('/:id', optionsCtrl.removeOption);

// export the route from this file
module.exports = router;
