import prompts from 'prompts'
import {$, callturn, console, copy, cronjobs, envKey, generateChallenge, isCapitalized, unlock, uuid, capitalize} from './utils'
import * as defaultServices from './services'

export let config: promptApp.Config;

async function main(password?: string): Promise<void> {
	let answer: any = {}, retry: boolean, cancel: boolean;
	const {services} = config;

	const serviceChoices = Object.keys(services)
		.filter(key => Object.getOwnPropertyNames(services[key]).find(sKey => isCapitalized(sKey)))
		.map(key => {
			const service = services[key];
			let title = callturn(service.title);
			return {
				title: service.color ? console.col(String(title || capitalize(service.id)), service.color) : title,
				description: service.description || '',
				value: key
			}
		})
		.concat({title: console.col('✖', 'white'), description: 'Quit', value: 'quit'});

	do {
		cancel = retry = false;

		const ans = await prompts([{
			type: password || !$('CHALLENGE') ? null : 'password',
			name: 'secret',
			message: 'Password',
			validate: val => (password = unlock(val) && val) && true,
			onState: ({aborted}) => { cancel = aborted; }
		}, {
			type: answer.service ? null : 'select',
			name: 'service',
			message: 'Menu',
			choices: serviceChoices,
			format: v => v === 'quit' ? (cancel = true) && v : v,
			onState: ({aborted}) => { retry = !aborted; cancel = aborted; }
		}, {
			type: () => cancel || answer.action ? null : 'select',
			name: 'action',
			message: 'Action',
			onState: ({aborted}) => cancel = aborted,
			choices: ((prev: string) => (Object.getOwnPropertyNames(services[prev])
					.filter(key => isCapitalized(key))
					.map(key => {
						const service = services[prev], target = service[key];
						let title = callturn(target.title) || key.replace(/_/g, ' ');
						title = service.color ? console.col(title, service.color) : title;
						return {
							value: key,
							title,
							description: callturn(target.description)
						}
					})
					.concat({
						value: 'back',
						title: console.col('◄', 'white'),
						description: 'Back'
					})
				)
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
	const box = console.box(`${console.col(service.title || capitalize(service.id), service.color || 'white')}: ${action.replace(/_/g, ' ')}`);
	try {
		const now = new Date().getTime();
		const target = service[action];
		const func = (typeof target === 'function' ? target : target.$ || target.method);
		const res = await func({...box, service, prompts} as promptApp.ActionArg);
		const time = new Date().getTime() - now;
		if(res === null) return;
		box.out(...(res === true ? [console.col('Success', 'green'), time+'ms']
			: ['Result:', res, time > 0 ? '('+time+'ms)' : ''])
		);
	}
	catch(e){ box.error(e.stack).out(); }
}

async function quit(): Promise<void> {
	await cronjobs.terminate();
	console.info('Bye');
}

export async function promptApp(configuration: promptApp.Config): Promise<void> {
	configuration = {
		useDefaultServices: true,
		envPrefix: 'APP_',
		envCredentialsPostfix: '_CREDENTIALS',
		...configuration,
		env: {...process.env, ...(configuration.env||{})}
	};
	config = configuration;

	let password = $('PASSWORD'), challenge = $('CHALLENGE');

	// we need a challenge when encryption is enabled
	if(password && !challenge){
		console.error('Error: "env.PASSWORD" provided without "env.CHALLENGE"');
		const {generate} = await prompts({
			type: 'confirm',
			name: 'generate',
			message: 'Do you want to generate a challenge using the provided password?'
		});
		if(generate){
			challenge = generateChallenge(password);
			const box = console.box('Generating challenge (use in env.CHALLENGE)...');
			box.line(console.col(challenge, 'rainbow'));
			copy(challenge, box);
			return await quit();
		}
		password = '';
	}

	// add service id if not provided
	Object.keys(config.services).forEach(s => {
		config.services[s].id = config.services[s].id || (config.services[s].title||'')+'_'+uuid()
	});

	// auto unlock using key
	if(password && !unlock(password)) {
		console.error('Invalid password in env.'+envKey('password'));
		password = '';
	}

	// add internal services
	if(config.useDefaultServices){
		config.services = {...defaultServices, ...config.services};
	}

	// security is disabled
	if(!challenge){
		Object.keys(config.services).forEach(s => cronjobs.add(config.services[s]));
	}

	return main(password);
}

export default promptApp;

export type Job = promptApp.Job;