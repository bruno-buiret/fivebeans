/*global describe:true, it:true, before:true, after:true */

var
	demand    = require('must'),
	fivebeans = require('../index')
	;

describe('FiveBeansHandler', function()
{
	it('has the client', function(done)
	{
		var r = new fivebeans.runner('test', 'test/fixtures/handlers-using-client.yml');
		r.go();
		r.worker.on('started', function()
		{
			r.worker.must.exist();
			r.worker.client.must.exist();
			r.worker.handlers.must.exist();
			r.worker.handlers.handlerWithClient.must.exist();
			r.worker.handlers.handlerWithClient.client.must.exist();
		});
		r.worker.on('stopped', done);
		r.worker.stop();
	});

	it('can produce jobs', function(done)
	{
		var r = new fivebeans.runner('test', 'test/fixtures/handlers-using-client.yml');
		r.go();
		r.worker.on('started', function()
		{
			var data = { type: 'handlerWithClient', payload: 'this handler has the Beanstalk client' };

			r.worker.must.exist();
			r.worker.client.must.exist();
			r.worker.handlers.must.exist();
			r.worker.handlers.handlerWithClient.must.exist();
			r.worker.handlers.handlerWithClient.client.must.exist();
			r.worker.handlers.handlerWithClient.client.put(0, 0, 60, JSON.stringify(data), function(err, jobid)
			{
				demand(err).not.exist();
				jobid.must.exist();
				done();
			});
		});
		r.worker.stop();
	});
});
