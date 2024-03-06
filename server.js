const { makeApp } = require('./app.js')
const db_fn = require('./database.js');
require('dotenv').config()
const GracefulShutdownManager = require('@moebius/http-graceful-shutdown').GracefulShutdownManager;

// Dependencies
const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');

//start server
const httpPort = 80;
const httpsPort = 443
const app = makeApp(db_fn)
//app.listen(port, ()=> console.log(`Server running on port ${port}`))

// Certificate
const privateKey = fs.readFileSync(process.env.CERTBOT_DIR + 'privkey.pem', 'utf8');
//const certificate = fs.readFileSync(process.env.CERTBOT_DIR + 'cert.pem', 'utf8');
const certificate = fs.readFileSync(process.env.CERTBOT_DIR + 'fullchain.pem', 'utf8');
//const ca = fs.readFileSync(process.env.CERTBOT_DIR + 'chain.pem', 'utf8');

const credentials = {
	key: privateKey,
	cert: certificate,
	//ca: ca
};


// HTTP to HTTPS redirect
const httpApp = express();
httpApp.use((req, res, next) => {
	if (req.secure) {
		next();
	} else {
		const redirectUrl = 'https://' + req.headers.host + req.url;
		res.redirect(301, redirectUrl);
	}
});


// Starting both http & https servers
const httpServer = http.createServer(httpApp);
// const httpServer = http.createServer(app); // for load testing only
const httpsServer = https.createServer(credentials, app);

// Graceful shutdown
const httpShutdownManager = new GracefulShutdownManager(httpServer);
const httpsShutdownManager = new GracefulShutdownManager(httpsServer);

process.on('SIGTERM', () => {
	httpsShutdownManager.terminate(() => {
		httpShutdownManager.terminate(() => {
			console.log('Server is gracefully terminated');
		});
	});
});


httpServer.listen(httpPort, () => {
	console.log('HTTP Server running on port ' + httpPort);
});


httpsServer.listen(httpsPort, () => {
	console.log('HTTPS Server running on port ' + httpsPort);
});
