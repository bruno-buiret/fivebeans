var
	_               = require('lodash'),
	assert          = require('assert'),
	fs              = require('fs'),
	yaml            = require('js-yaml'),
	FiveBeansWorker = require('./worker')
	;

/**
 * Resolves environment placeholders.
 *
 * @param {*} settings The settings.
 * @return {*} The processed settings.
 */
function environmentPlaceholdersResolver(settings)
{
	if('object' === typeof settings)
	{
		for(var key in settings)
		{
			if(settings.hasOwnProperty(key))
			{
				settings[key] = environmentPlaceholdersResolver(settings[key]);
			}
		}
	}
	else if('string' === typeof settings)
	{
		settings = settings.replace(
			/(%env\([\S]+\)%)/g,
			function(_, placeholder)
			{
				placeholder = placeholder.substring(5, placeholder.length - 2);

				return 'undefined' !== typeof process.env[placeholder] ? process.env[placeholder] : '';
			}
		);
	}

	return settings;
}

var FiveBeansRunner = function(id, configpath)
{
	assert(id);
	assert(configpath);

	this.id = id;
	if (configpath[0] !== '/')
		configpath = process.cwd() + '/' + configpath;
	this.configpath = configpath;

	if (!fs.existsSync(configpath))
		throw(new Error(configpath + ' does not exist'));

	this.worker = null;
	return this;
};

FiveBeansRunner.prototype.go = function()
{
	var self = this;

	this.worker = this.createWorker();

	process.on('SIGINT', this.handleStop.bind(this));
	process.on('SIGQUIT', this.handleStop.bind(this));
	process.on('SIGHUP', this.handleStop.bind(this));

	process.on('SIGUSR2', function()
	{
		self.worker.on('stopped', function()
		{
			self.worker = self.createWorker();
		});
		self.worker.logInfo('received SIGUSR2; stopping & reloading configuration');
		self.worker.stop();
	});

	return self;
};

FiveBeansRunner.prototype.readConfiguration = function()
{
	var fname = this.configpath;
	var config = environmentPlaceholdersResolver(yaml.load(fs.readFileSync(fname, 'utf8')));
	var dirprefix = process.cwd() + '/';
	var h;

	var handlers = {};
	for (var i = 0, len = config.handlers.length; i < len; i++)
	{
		h = require(dirprefix + config.handlers[i])(config);
		handlers[h.type] = h;
	}
	config.handlers = handlers;

	return config;
};

FiveBeansRunner.prototype.createWorker = function()
{
	var config = _.extend({}, this.readConfiguration());
	var worker = new FiveBeansWorker(config);

	var logLevel = config.logLevel;
	if (logLevel === 'info')
	{
		worker.on('info', console.log);
		logLevel = 'warning';
	}

	if (logLevel === 'warning')
	{
		worker.on('warning', console.warn);
		logLevel = 'error';
	}

	if (logLevel === 'error')
		worker.on('error', console.error);

	worker.start(config.watch);
	return worker;
};

FiveBeansRunner.prototype.handleStop = function()
{
	this.worker.on('stopped', function()
	{
		process.exit(0);
	});
	this.worker.stop();
};

module.exports = FiveBeansRunner;
