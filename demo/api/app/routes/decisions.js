// Example route file from Routing demo
// import the express router
const router = require('express').Router();
// import the decisions controller
const decisionsCtrl = require('../controllers/decisions');

// Initial Example Route ***************
// router.get('/', (req, res) => {
//   res.send('<h1>Decisions</h1>');
// });

// ROUTES *******************
// GET /decisions route
router.get('/', decisionsCtrl.getAll);
// GET / decisions/public
router.get('/public', decisionsCtrl.getPublic);
// GET /decisions/:id
router.get('/:id', decisionsCtrl.getOneById);

// POST /decisions
// NOTE: Tip - using POST for creation! That's Good!
// Always try to use the correct HTTP verb!
router.post('/', decisionsCtrl.createDecision);
// PUT /decisions/:id
router.put('/:id', decisionsCtrl.updateDecision);
// DELETE /decisions/:id
router.delete('/:id', decisionsCtrl.removeDecision);

// export the route from this file
module.exports = router;
