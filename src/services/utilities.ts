import {console2, copy, cronjobs, decrypt, encrypt, env, generateChallenge} from '../utils'

const {col} = console2

function logLevelColor(lvl: number){
	switch(lvl){
		case 1: return console2.col('Error', 'red')
		case 2: return console2.col('Warn', 'yellow')
		case 3: return console2.col('Info', 'green')
		case 4: return console2.col('Debug', 'cyan')
	}
}

export class Utilities {
	static description = 'Jobs, LogLevel and more'
	static color: 'white' = 'white'

	static jobs: promptApp.Job[] = []

	static Jobs = {
		description: 'Manage Cronjobs',
		$: async ({prompts}: promptApp.ActionArg) => {
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
						title: console2.pad(' ', 14, j.service.title+' ')
							+ console2.pad(' ', 30, j.title)
							+ (j.description || '')
					})
				),
				onState: ({value}: any) => cronjobs.list = cronjobs.list.map(
					job => ({...job, active: value.find((v: any) => v.value === job.id).selected})
				)
			} as any])
			return null
		}
	}

	static LogLevel = {
		description: () => 'is "'+logLevelColor(console2.logLevel()).toLowerCase()+'"',
		$: async ({prompts}: promptApp.ActionArg) => {
			const {newLevel} = (await prompts([{
				type: 'select',
				name: 'newLevel',
				message: `Set LogLevel`,
				initial: console2.logLevel()-1,
				choices: [
					{title: logLevelColor(1), value: 'Error'},
					{title: logLevelColor(2), value: 'Warn'},
					{title: logLevelColor(3), value: 'Info'},
					{title: logLevelColor(4), value: 'Debug'},
				]
			}]))
			if(newLevel) console2.logLevel(newLevel)
			return null
		}
	}

	static Encrypt = {
		description: '> encrypts a string',
		$: async ({box, prompts}: promptApp.ActionArg) => {
			const b = box()
			if(!env('challenge')){
				await generateChallenge(undefined, b)
				return null
			}

			const text = (await prompts({
				type: 'text',
				name: 'encrypt',
				message: 'Enter text to encrypt'
			})).encrypt

			const encrypted = encrypt(text)
			b.line('Input: '+text+'')
			b.line('Result:')
			b.line(col(encrypted, 'rainbow'))
			copy(encrypted, b)
			b.out()
			return null
		}
	}

	static Decrypt = {
		description: '< decrypts a string',
		$: async ({box, prompts}: promptApp.ActionArg) => {
			const b = box()
			if(!env('challenge')){
				await generateChallenge(undefined, b)
				return null
			}

			const encrypted = (await prompts({
				type: 'text',
				name: 'decrypt',
				message: 'Enter text to decrypt'
			})).decrypt

			const decrypted = decrypt(encrypted)
			b.line('Input: '+encrypted.substr(0, 40)+'...')
			b.line(col('Result', 'green')+':')
			try { b.line(col(decrypted, 'bgGreen')) }
			catch(e){ b.error('Error: Unable to authenticate data') }
			copy(decrypted, b)
			b.out()
			return null
		}
	}
}