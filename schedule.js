/**
 * Entry point for the Scheduler to call a REST URL
 * Check the config file for more information.
 *
 * Created by: Julian Jewel
 *
 */
var config = require('config')
// Export config, so that it can be used anywhere
module.exports.config = config;
// For making HTTP Requests
var request = require('request');
// CRON Scheduler
var cronJob = require('cron').CronJob;
// Logging Framework
var Log = require('vcommons').log;
// Scheduler as the Category type
var logger = Log.getLogger('SCHEDULER', config.log);
// For retry capability with the HTTP Request
var retry = require('retry');

try {
	logger.trace("Initializing Job: " + config.schedule + " Start: " + config.start + " TimeZone: " + config.timeZone );
	var job = new cronJob(config.schedule, function(){
		logger.trace("Starting Job - Executing: " + config.request);
		// Retry on failure
		var operation = retry.operation(config.retry);
		operation.attempt(function(currentAttempt) {
			// HTTP Request
			request(config.request, function (error, response, body) {
				var bError = true;
				if(response) {
					bError = (response.statusCode != 200);
				}
				if (operation.retry(error || bError)) {
					logger.error('Retry failed with error:', error, 'Attempt:', currentAttempt);
					return;
				}
				if (!error && response.statusCode == 200) {
					logger.info('Successfully Completed Job', response, 'Attempt:', currentAttempt);
					return;
				} else {
					logger.error('Retry failed with error:', error, 'Attempt:', currentAttempt);
					return;
				}
			});
		});
	  }, function () {
			// Completed
			logger.trace('Finished Execution of ' + config.request);
	  }, 
	  config.start /* Start the job right now */,
	  config.timeZone /* Time zone of this job. */
	);
	logger.info("Starting Scheduler Job with Schedule: " + config.schedule + " Start: " + config.start + " TimeZone: " + config.timeZone );
	job.start();
} catch(ex) {
	logger.error("Cron pattern + " + config.schedule + " not valid. Error: " + ex);
}
	

// Default exception handler
process.on('uncaughtException', function (err) {
	logger.error("Caught Exception " + err);
	process.exit();
});

process.on('SIGINT', function () {
	logger.info("\nShutting down from  SIGINT (Crtl-C) ");
	process.exit()
})
// Default exception handler
process.on('exit', function (err) {
	// Clean up
	logger.info("Exiting with Error:" + err);
});
