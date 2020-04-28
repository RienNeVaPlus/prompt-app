export class Server {
	static id = 'server';
	static description = 'Node.js Web Server';

	static jobs: promptApp.Job[] = [{
		method: Server.Flush,
		id: 'flush',
		name: 'Flush Caches',
		description: 'Weekdays from 8 to 22',
		active: false,
		interval: 30,
		executable: ({between}) => between(8, 22, true)
	}];

	static onCredentials(_credentials: any){
		// new Server(credentials);
	}

	static Flush({debug}: any){
		debug('Flushing Caches (not rly)...');
		return true;
	}
}