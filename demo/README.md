# Getting Started ...🚀

This demo is an example of a legacy project. It is not actively maintained. Some of this demo material was bootstrapped using information linked-to below. All demo material is considered an example work in progress, and may be used for reference and class discussion only. The process demonstrated in this work will likely change over time. This material is occasionally revised. 

Use this demo directory as additional reference while conducting your own research, development, project and portfolio activity.  

<br>

## Before Running Scripts 

### Step 1 - Install Dependencies

Before running any of the scripts outlined below, install all dependencies needed in the demo folder. CD into the following folders to install those dependencies:  

Use `npm i --force` to install demo dependencies...

```
CD into and install dependencies in ALL of the 5 directories listed below: 

demo
demo/api  
demo/react-demo  
demo/reactjs  
demo/web  
```

**Note:** The project's npm dependencies remain at a specific version for compatibility reasons. With that in mind, you will run the install with the additional `--force` option. This ensures your version matches the release of this project. You will likely receive warnings from npm. Ignore those warnings unless the instructor specifically asks you to update or fix some item in the dependency chain.

<br>

### Step 2 - Run the Database Server
The demo API utilizes Postgres. Before running any of the example scripts below be sure you have installed the [PostgreSQL relational database server](https://www.postgresql.org/) and [Postico](https://eggerapps.at/postico/). You should also create a database that matches your config setup (see step 3 below). After installing and running both PostgreSQL and Postico on your local computer, move on to step 3. 

**Note:** If you're on a PC you may need to decide on an alternative to Postico, which is a Mac based app that allows us to work with our database tables visually. If you're familiar with working with MySQL and [Sequel Pro](https://sequelpro.com/) or [MySQL Workbench](https://dev.mysql.com/doc/workbench/en/wb-intro.html), it is similar in nature. [This list](https://www.postgresql.org/download/products/1-administrationdevelopment-tools/) provides a long list of alternative apps, like [pgAdmin](https://www.pgadmin.org/). 


<br>

### Step 3 - Customize the Config!
To have the demo API work locally, you will need to customize the database [config.json](./api/db/config.json) file. [Update the settings](https://sequelize.org/docs/v6/other-topics/migrations/#configuration) to work with your local Database. If you are new to using Postgres, you may also need to create a new user '[role](https://www.postgresql.org/docs/current/sql-createrole.html)' with the correct permissions in order to both create and login to your local database. After customizing the config file and confirming you have a role set with the proper permissions, the last step is to make sure you actually have a database created. 


**Creating a Database**  
After updating the config file, you can use Sequelize to easily create the database. If the database doesn't exist yet, just call the Sequelize `db:create` command. With proper access (see 'Update the settings' link above), it will create that database for you. With Postgres installed, you could also just use [this command](https://www.postgresql.org/docs/current/tutorial-createdb.html) in Terminal to quickly create a database.   

<br>

**Note:** 

* **Run Migrations:** After completing the above steps, also run the example `demo/api/db` migrations. 
* **Managing Roles:** There are many articles online that describe how to create a role with Postgres. If you haven't done this often you may want to add this to your research activity while in the Project & Portfolio course. For example, this [resource](https://www.postgresqltutorial.com/postgresql-administration/postgresql-roles/) demonstrates Postgres commands you can run in Terminal to create and manage roles. Managing a role could include changing role permissions if needed, using the Postgres [ALTER](https://www.postgresql.org/docs/current/sql-alterrole.html) command.   


<br>


## Available Scripts

After completing the steps above you can run the following scripts from the demo directory.

### `dev-react-demo`
The react demo shows how to set up a front-end server, and have that server communicate with a backend API. The legacy code was revised slightly to use React Router v6. Consider this a work in progress. 

Feel free to experiment with the work in progress codebase by updating the react-demo or api directory with your own code. Be sure to do your work in a feature branch, and make a pull request when your updates are ready to merge back into dev. 

### `react-demo`
This just runs the react-demo frontend, without the backend API.

### `dev-reactjs`
This runs the example ShipIt app, with the work in progress backend API. Feel free to experiment with the backend API by building out models, controllers, routes, etc. 

### `react`
This runs the example ShipIt app, without a backend API. 

### `dev-web`
The "web" folder shows the fundamentals of setting up a server. Use the folder as a general reference. 

### `web`
This runs the web server, without a backend API.

### `dev-web`
This runs the web server with a backend API. 

### `api`
This runs the API server, without a frontend.


### `test`
An example test is available in the api directory. It uses the `api/__tests__` folder, which refers to a mock test that resides in the `api/__labs` folder. This was added for your reference and experimentation. Feel free to create your own tests and use Jest documentation to learn more as you go. Use the `api/__labs` directory to write your own functons and use the `api/__tests__` directory to write tests that confirm those functions work as expected.  

To see Jest in action, CD into the api directory and run the test script:   

**npm run test** 

The example api test is from the Jest [getting started](https://jestjs.io/docs/getting-started) docs.   

Notice, the root project directory isn't running any tests so the `/package.json` script reflects this...     
`"test": echo \"Error: no test specified\" && exit 1`  

On the other hand, within the `api/` directory we have an example test, so the `api/package.json` test script will invoke Jest, our test runner...    
`"test": "jest"`

<br> 

### `start`
This script is useful when using services like Heroku for deployment. Services like Heroku will look for a start script. 

The "Deployment" stage of development will be examined in this course. 

Keep in mind Heroku looks at the root directory for a start script. We will examine steps for this to test deploying the ShipIt app. This reference demonstrates an update to the root package.json to work with Heroku [gist](https://gist.github.com/eMediaLab/48091c02292659a3b09b7f9c0d39a3ab). 

<br>

> Regarding the deployment process:    
>
>**`api/db/config.json`**   
This config.json file `api/db/config.json`, is used to deploy the demo to Heroku. The update shown in this codebase includes [SSL settings](https://devcenter.heroku.com/articles/connecting-heroku-postgres#connecting-in-node-js) to work with Heroku using postgres and SSL. 
>
>When using a config.json file, keep in mind you are establishing environment settings. The "development" setting of the config.json file is usually the default, and typically used for the local environment. For external environments like Heroku, requirements may change over time. For example, a secure connection using SSL is now [required by Heroku](https://devcenter.heroku.com/changelog-items/2035). 
>
>Keep in mind, external services like Heroku also require [configuration](https://devcenter.heroku.com/articles/config-vars) to properly setup environment variables. When working on an app, never commit environment variables or files that include environment variables while using version control. For security purposes, always remember to exclude this information using a .gitignore file.

