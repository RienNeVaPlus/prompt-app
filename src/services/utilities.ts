import prompts from 'prompts'
import {console, copy, cronjobs, decrypt, encrypt} from '../utils'

function logLevelColor(lvl: number){
	switch(lvl){
		case 1: return console.col('Error', 'red');
		case 2: return console.col('Warn', 'yellow');
		case 3: return console.col('Info', 'green');
		case 4: return console.col('Debug', 'cyan');
	}
}

export class Utilities {
	static id = 'prompt-app-utilities';
	static title = 'Utilities';
	static description = 'Jobs, LogLevel and more';
	static color = 'white';

	static Jobs = {
		description: 'Manage Cronjobs',
		$: async () => {
			await prompts([{
				type: 'autocompleteMultiselect',
				name: 'cronjobs',
				instructions: false,
				message: `Manage Jobs`,
				choices: cronjobs.list.map(
					j => ({
						...j,
						value: j.id,
						selected: j.active === true,
						disable: j.disabled,
						title: console.pad(' ', 14, j.service.title+' ')
							+ console.pad(' ', 30, j.title)
							+ (j.description || '')
					})
				),
				onState: ({value}: any) => cronjobs.list = cronjobs.list.map(
					job => ({...job, active: value.find((v: any) => v.value === job.id).selected})
				)
			} as any]);
			return null;
		}
	};

	static LogLevel = {
		description: () => 'is "'+logLevelColor(console.logLevel()).toLowerCase()+'"',
		$: async () => {
			const {newLevel} = (await prompts([{
				type: 'select',
				name: 'newLevel',
				message: `Set LogLevel`,
				initial: console.logLevel()-1,
				choices: [
					{title: logLevelColor(1), value: 'Error'},
					{title: logLevelColor(2), value: 'Warn'},
					{title: logLevelColor(3), value: 'Info'},
					{title: logLevelColor(4), value: 'Debug'},
				]
			}]));
			if(newLevel) console.logLevel(newLevel);
			return null;
		}
	};

	static Encrypt = async () => {
		const text = (await prompts({
			type: 'text',
			name: 'encrypt',
			message: 'Enter text to encrypt'
		})).encrypt;

		const encrypted = encrypt(text);
		const box = console.box('Encrypting "'+text+'"...');
		box.line(console.col(encrypted, 'rainbow'));
		copy(encrypted, box);
		console.spacer();
		return null;
	};

	static Decrypt = async () => {
		const encrypted = (await prompts({
			type: 'text',
			name: 'decrypt',
			message: 'Enter text to decrypt'
		})).decrypt;

		console.log('Decrypting...', 'yellow');
		try {
			const decrypted = decrypt(encrypted);
			console.log('Decrypted: '+decrypted);
			console.spacer();
		} catch(e){ console.error('Invalid key') }
		return null;
	};
}