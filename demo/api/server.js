// This will create a new logger in the namespace of your choosing...
// Deciding to go with API and the specific name of "logging"...
const log = require('debug')('API:logging'); // Switching name space enables/disables logging
// get the express application
const app = require('./app');
// set the port to environment variable or 4000
// Changing from port 3000, because that's the default for React!
const port = process.env.PORT || 4000;
// spin up server and log what port it is running on
app.listen(port, () => log(`API listening on port ${port}!`));
