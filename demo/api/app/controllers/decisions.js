// Load in the decision model
// AND load in Sequelize and custom error handler(s) if used
// const { Decisions, Sequelize } = require('../models');
// Only pulling in Descisions model, would only need Sequelize if
// running the custom error handler... see createDecision WIP.
const { Decisions } = require('../models');
// Custom error handler - WIP.
// const { throwError } = require('../utils/errorHandling');

// get all the decisions
exports.getAll = async (req, res) => {
  // run the find all function on the model
  const decisions = await Decisions.findAll();
  // respond with json of the decisions array
  res.json(decisions);
};
// get all the decisions with a type of public
exports.getPublic = async (req, res) => {
  // run the find all function on the model
  const publicDecisions = await Decisions.findAll({
    where: { type: 'public' },
  });
  // respond with json of the public decisions array
  res.json(publicDecisions);
};

// Example find one decision by id
exports.getOneById = async (req, res) => {
  // get the id from the route params
  const { id } = req.params;
  // search decision model for the decision
  const decision = await Decisions.findByPk(id);
  // if no decision is found
  if (!decision) {
    res.sendStatus(404);
    return;
  }
  // if the decision is found send it back.
  res.json(decision);
};

// add a new decision (And setting up an Error Handler)
// Note! Passing an exception to the catch block will need to be
// handled in the error block or forwarded to another error handler
// AND, if passing to another error handler, BE SURE to include
// next as a parameter when defining the overall async method.
exports.createDecision = async (req, res, next) => {
  // get the title and type values from the request body
  const { title, type } = req.body;
  try {
    // create the item and save the new id
    const newDecision = await Decisions.create({ type, title });
    // .catch(Sequelize.ValidationError, throwError(406, 'Validation Error'))
    // .catch(Sequelize.BaseError, throwError(500, 'A db error has occurred please try again.'));
    // send the new id back to the request
    res.json({ id: newDecision.id });
  } catch (e) {
    // Pass on to the next error handler: add next param and within catch...
    // Important! Make sure you used next as a param above, or passing
    // the error to the next error handler won't work!
    next(e); // Sending the exception to the next error handler
    // or ———> handle the error inside of the catch block...
    // This demonstrates using map to cycle through each error message
    // in order to send these back as a json object.
    // const errors = e.errors.map((err) => err.message);
    // res.status(400).json({ errors });
  }
};

// update an existing decisions
exports.updateDecision = async (req, res) => {
  const { id } = req.params;
  try {
    const [, [updatedDecisions]] = await Decisions.update(req.body, {
      // only update the row using the id in the url
      where: { id },
      // return the updated row
      returning: true,
    });
    res.jon(updatedDecisions);
  } catch (e) {
    // map the errors messages to send them back
    const errors = e.errors.map((err) => err.message);
    res.status(400).json({ errors });
  }
};

// Controller for this route...  /decisions/:id
// will handle DELETE requests made and remove an existing item.
exports.removeDecision = async (req, res) => {
  // get the id from the route
  const { id } = req.params;
  // remove the decision
  await Decisions.destroy({ where: { id } });
  // send a good status code
  res.sendStatus(200);
};
