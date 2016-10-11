# IdeaJam

A barebones Node.js app using [Express 4](http://expressjs.com/).

## Running Locally

Make sure you have [Node.js](http://nodejs.org/), [Heroku Toolbelt](https://toolbelt.heroku.com/), and MongoDB installed. Also, in order to build images in the patent application, you'll need to follow the instructions for [Canvas](https://github.com/Automattic/node-canvas).  You'll also need to set local variables in a file name ".env" in the project root.  This is what Heroku loads when you call "heroku local web".  The equivalent development and production variables are accessible in the Heroku Dashboard Settings section.  

You'll need to download and start MongoDB locally before launching the app.  In the project root level file "index.js", it shows the local MongoDB URI that your app should connect to.  It should just be using the default port.  

```sh
$ git clone https://github.com/IdeaJam/blooming-mountain-87473.git IdeaJam # or clone your own fork
$ cd IdeaJam
$ npm install
$ heroku local web
```

Your app should now be running on [localhost:5000](http://localhost:5000/).

## Deploying to GitHub

You just deploy to GitHub in the normal way (e.g. "git push origin develop").  Currently, there are two branches, develop and master, that Heroku listens to and automatically deploys to:


[The Development/Staging Site](https://staging-blooming-mountain.herokuapp.com/)


[The Production Site](https://ideajam.io/)

## Other notes

Despite the code being in one repo on GitHub, there are two Heroku projects corresponding to the environments.  Each environment has their own plugins, etc.  One big difference is that the MongoDB host for the development/staging project is mLab, and the production site uses Mongo Atlas.  mLab is an official partner of Heroku and Mongo Atlas is not, so you can access the mLab dashboard through Heroku, whereas Mongo Atlas must be accessed indpendently.  

The domain and SSL cert were acquired through name.com, images are stored in Amazon's S3, email is done through SendGrid, and everything else is done through Heroku partners that you can access through the dashboard.  