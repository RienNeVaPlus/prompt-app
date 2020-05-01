import prompts from 'prompts'
import {
	callturn,
	capitalize,
	console,
	cronjobs,
	dateDetails,
	env,
	envKey,
	generateChallenge,
	getAllPropertyNames,
	isCapitalized,
	unlock
} from './utils'
import * as defaultServices from './services'

const {col} = console;

export let config: promptApp.Config;
export const Utilities = defaultServices.Utilities;

const methodTypes = ['object', 'function'];
const exposable = (service: typeof promptApp.Service, prop: string) => {
	try { return methodTypes.includes(typeof (<any>service)[prop]) && config.exposeMethod(prop, service); } catch(e){ return false }
};

async function main(password?: string): Promise<void> {
	let answer: any = {}, retry: boolean, cancel: boolean;
	const {services, title, mapMethodName, maxPrototypeChainLength} = config;
	const serviceKeys = Object.keys(services)
		.filter(key => getAllPropertyNames(services[key], maxPrototypeChainLength)
			.find(prop => exposable(services[key], prop))
		);

	do {
		cancel = retry = false;

		const ans = await prompts([{
			type: password || !env('CHALLENGE') ? null : 'password',
			name: 'secret',
			message: 'Password',
			validate: val => (password = unlock(val) && val) && true,
			onState: ({aborted}) => { cancel = aborted; }
		}, {
			type: answer.service ? null : 'select',
			name: 'service',
			message: title,
			choices: serviceKeys
				.map(key => {
					const service = services[key];
					let title = callturn(service.title);
					return {
						title: service.color ? col(String(title), service.color) : title,
						description: callturn(service.description),
						value: key
					}
				})
				.concat({title: col('✖', 'white'), description: 'Quit', value: 'quit'}),
			format: v => v === 'quit' ? (cancel = true) && v : v,
			onState: ({aborted}) => { retry = !aborted; cancel = aborted; }
		}, {
			type: () => cancel || answer.action ? null : 'select',
			name: 'action',
			message: 'Method',
			onState: ({aborted}) => cancel = aborted,
			choices: ((prev: string) => {
					return (getAllPropertyNames(services[prev], maxPrototypeChainLength)
							.filter(prop => exposable(services[prev], prop))
							.map((key:string) => {
								const service = services[prev], target = (service as any)[key];
								let title = callturn(target.title) || mapMethodName(key, service);
								title = service.color ? col(title, service.color) : title;
								return {
									value: key,
									title,
									description: callturn(target.description)
								}
							})
							.concat({
								value: 'back',
								title: col('◄', 'white'),
								description: 'Back'
							})
					)
				}
			) as any
		}]);

		answer = Object.assign(answer, ans);
		if(cancel) retry = false;
	} while(retry);

	if(cancel){
		if(answer.service && answer.service !== 'quit') return main(password);
		return await quit();
	}

	if(answer.action !== 'back')
		await run(services[answer.service], answer.action);

	return await main(password);
}

async function run(service: any, action: string): Promise<void> {
	const box = console.box(
		col(service.title, service.color || 'white') +
		': '+config.mapMethodName(action, service)
	);
	try {
		const date = dateDetails();
		const target = service[action];
		const func = (typeof target === 'function' ? target : target.$ || target.method);
		const res = await func({...box, service, prompts, date, origin: 'user'});
		const time = new Date().getTime() - date.date.getTime();
		if(res === null) return;
		box.out(...(res === true ? [col('Success', 'green'), time+'ms']
			: res === undefined ? [] : ['Result:', res, time > 0 ? '('+time+'ms)' : ''])
		);
	}
	catch(e){ box.error(e.stack).out(); }
}

async function quit(): Promise<void> {
	await cronjobs.terminate();
	console.info('Bye');
}

export async function app(configuration: promptApp.Configuration): Promise<void> {
	config = {
		title: 'Menu',
		exposeMethod: name => isCapitalized(name) || name.charAt(0) === '$',
		mapMethodName: name => name.replace(/^\$/,'').split(/(?=[A-Z])/).map(s => capitalize(s)).join(' '),
		useDefaultServices: true,
		envPrefix: 'APP_',
		envCredentialsPostfix: '_CREDENTIALS',
		maxPrototypeChainLength: 2,
		...configuration,
		env: {...process.env, ...(configuration.env||{})}
	} as promptApp.Config;

	let password = env('password'), challenge = env('challenge');

	// delete sensitive information - but remember: never provide APP_PASSWORD in production
	if(password){
		delete config.env[envKey('password')];
		delete process.env[envKey('password')];
	}

	// optionally generate challenge
	if(!challenge){
		challenge = await generateChallenge(password);
		if(challenge)
			return await quit();
	}

	// add internal services
	if(config.useDefaultServices){
		config.services = {...defaultServices, ...config.services};
	}

	// add service id if not provided
	Object.keys(config.services).forEach(s =>
		Object.assign(config.services[s], {
			id: config.services[s].id || s.toLowerCase(),
			title: config.services[s].title || capitalize(s),
			description: config.services[s].description || ''
		})
	);

	// auto unlock using key
	if(challenge && password && !unlock(password)) {
		console.error('Invalid password in env.'+envKey('password'));
		password = '';
	}

	// security is disabled
	if(!challenge){
		Object.keys(config.services).forEach(s => cronjobs.add(config.services[s]));
	}

	return main(password);
}

export default app;

export type Job = promptApp.Job;