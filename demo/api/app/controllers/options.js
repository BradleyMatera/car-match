// load in the option model
const { Options } = require('../models');

// get all the options that belong to one decision
exports.getDecisionOptions = async (req, res) => {
  // get the decision id from the query
  const { decisionId } = req.query;
  // run the find all function on the model
  const decisionOptions = await Options.findAll({ where: { decisionId } });
  // respond with json of  the decision's option array
  res.json(decisionOptions);
};

// find one option by id
exports.getOneById = async (req, res) => {
  // get the id from the route params
  const { id } = req.params;
  // search our option model for the option
  const option = await Options.findByPk({ id });
  // if no option is found
  if (!option) {
    // return a 404 (not found) code
    res.sendStatus(404);
    return;
  }
  // if the option is found send it back.
  res.json(option);
};

// add a new option
exports.createOption = async (req, res) => {
  // get the title and type values from the request body
  const { value, decisionId } = req.body;
  try {
    // create the item and save the new id
    const newOption = await Options.create({ value, decisionId });
    // send the new id back to the request
    res.json({ id: newOption.id });
  } catch (e) {
    // map the errors messages to send them back
    const errors = e.errors.map((err) => err.message);
    res.status(400).json({ errors });
  }
};

// update an existing Option
exports.updateOption = async (req, res) => {
  // get the id from the route params
  const { id } = req.params;
  try {
    // update the option with any data from the req.body
    const [, [updateOption]] = await Options.update(req.body, {
      where: { id },
      // return the updated row
      returning: true,
    });
    // respond with the updated option
    res.json(updateOption);
  } catch (e) {
    // map the errors messages to send them back
    const errors = e.errors.map((err) => err.message);
    res.status(400).json({ errors });
  }
};

// delete an Option
exports.removeOption = async (req, res) => {
  // get the id from the route
  const { id } = req.params;
  // remove the option
  await Options.destroy({ where: { id } });
  // send a good status code
  res.sendStatus(200);
};
