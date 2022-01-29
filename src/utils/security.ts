import Cryptr from 'cryptr'
import prompts from 'prompts'
import {cronjobs, parseJson, console2, copy} from './index'
import {config} from '../index'

const decryptedChallenge = 'prompt-app'
let cryptr: Cryptr

export async function generateChallenge(password?: string, box: any = console2){
	console2.warn('Warning: Security features disabled.')
	if(!(await prompts({
		type: 'confirm',
		name: 'generate',
		message: `Do you want to generate ${console2.col(`env.${envKey('challenge')}`, 'code')} now?`
	})).generate) return null

	if(password){
		console2.log(`Found password in env.${envKey('password')+'='+password+'!'}`)
	}
	else
		password = (await prompts({
			type: 'password',
			name: 'pw',
			message: `Password`
		})).pw

	const challenge = new Cryptr(password!).encrypt(decryptedChallenge)
	const box1 = console2.box().line(`Successfully generated ${envKey('challenge')}:`, 'green')
	box1.line(console2.col(envKey('challenge'), 'white')+'='+console2.col(challenge, 'rainbow'))
	copy(challenge, box)
	box1.out(`Paste into ${console2.col('.env', 'code')} or provide in ${console2.col('config.env', 'code')}`)
	return challenge
}

export function encrypt(s: string){ return cryptr.encrypt(s) }
export function decrypt(s: string){ return cryptr.decrypt(s) }

export function disclose(password: string){
	if(cryptr) return
	cryptr = new Cryptr(password)
}
export function unlock(password: string){
	if(!password) return false
	disclose(password)
	try { if(cryptr.decrypt(env('CHALLENGE')) !== decryptedChallenge) return false }
	catch(e){ return false }

	// initialize services (onCredentials)
	Object.values(config.services).forEach((s: any) => {
    cronjobs.add(s)
    s.onCredentials && s.onCredentials(env(s.id, true))
  })

	return true
}

export function envKey(key: string, isCredential?: boolean){
	return config.envPrefix + key.toUpperCase() + (isCredential ? config.envCredentialsPostfix : '')
}

export function env(key: string, isCredential?: boolean){
	const k = envKey(key, isCredential)
	let v = config.env[k]
	if(v && isCredential){
		try { v = cryptr.decrypt(v) } catch(e){
			console2.error('Unable to authenticate data in "'+k+'"')
			v = e.message
		}

	}
	return parseJson(v) || v
}