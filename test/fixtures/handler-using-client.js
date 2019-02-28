module.exports = function()
{
	function HandlerUsingClient()
	{
		this.type = 'handlerWithClient';
	}

	HandlerUsingClient.prototype.work = function(payload, callback)
	{

		this.client.

		callback('success');
	};

	var handler = new HandlerUsingClient();
	return handler;
};
