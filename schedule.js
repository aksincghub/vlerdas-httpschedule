/**
 * Entry point for the Scheduler to call a REST URL
 *
 * Created by: Julian Jewel
 *
 */
var config = require('config')
// Export config, so that it can be used anywhere
module.exports.config = config;
var request = require('request');
var cronJob = require('cron').CronJob;

try {
	var job = new cronJob(config.schedule, function(){
		if(config.debug)
			console.log("Starting Job - Executing: " + config.uri);
		request(config.uri, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				return;
			} else {
				throw error;
			}
		});
	  }, function () {
		if(config.debug)
			console.log("Finished Execution!");
	  }, 
	  config.start /* Start the job right now */,
	  config.timeZone /* Time zone of this job. */
	);
	
	job.start();
} catch(ex) {
	console.log("Cron pattern + " + config.scheduel + "not valid");
}
	

// Default exception handler
process.on('uncaughtException', function (err) {
	console.log('Caught exception: ' + err);
});

process.on('SIGINT', function () {
	console.log("\nShutting down from  SIGINT (Crtl-C)")
	process.exit()
})
// Default exception handler
process.on('exit', function (err) {
	// Clean up
});
