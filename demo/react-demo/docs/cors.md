# CORS
This document is added here just for reference. Keep in mind that when setting up a front and backend, cors will need to be added to the backend api for the cross-talk to work. 

**Note:** A previous worked on api is already setup at   
`../api/`  

 It has cors setup just like the React demo. So it's already done. 

Just refer to `../api/app/index.js`   
to see the core parts of the setup, which include...

`const cors = require('cors');`  
and  
`app.use(cors());`

The above is all you need for basic setup of cors for cross origin resource sharing. You could customize this more though. Refer to cors docs for additional reference. 

<br>

## Additional Notes...

Terminal   
`npm install cors`

FIXING CORS  
Because we are not making requests to from our browser to a URL that is not the same (localhost:3000 -> localhost:4000) and it is no longer servers talking to each other, we need to update our cors policy (you are encouraged to learn more about CORS in your research) to allow other URLs to talk to the server.

There is a package named cors that will do this easily for us. By default just adding it will allow anyone to make requests to the server. This is fine for now but in the future, you will want to set it so that only specific URLs can make requests to your API.