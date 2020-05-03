export class Server {
	static description = 'Node.js Web Server';

	/**
	 * Jobs are executed every job.interval and only if job.executable return true
	 * Rather than providing them as an object, they can be arrays as well:
	 * [Server.$flushCache, 30, (...) => ..., 'Description'] is equal to:
	 */
	static jobs: promptApp.Job[] = [{
		$: Server.$flushCache,
		interval: 30,
		executable: ({between}) => between(8, 22, true),
		description: 'Weekdays from 8 to 22'
	}];

	/**
	 * Receives the decrypted credentials (.env)
	 */
	static onCredentials(_credentials: any){
		// new Server(credentials);
	}

	/**
	 * Exposed Method
	 *
	 * By default, all methods starting with an upper-case character or with a dollar sign are exposed
	 * Use config.exposeMethod: (name) => boolean to change this
	 * The method name is mapped using config.mapMethodName ($flushCache => Flush Cache)
	 */
	static $flushCache({debug}: promptApp.ActionArg){
		debug('Flushing Caches (not rly)...');
		return true;
	}
}