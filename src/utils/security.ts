import Cryptr from 'cryptr';
import {cronjobs, parseJson, console} from './index'
import {config} from '../index'

const decryptedChallenge = 'prompt-app';
let cryptr: Cryptr;

export function generateChallenge(password: string){
	return new Cryptr(password).encrypt(decryptedChallenge)
}
export function encrypt(s: string){ return cryptr.encrypt(s); }
export function decrypt(s: string){ return cryptr.decrypt(s); }

export function unlock(password: string){
	if(!password) return false;
	cryptr = new Cryptr(password);
	try {
		if(cryptr.decrypt($('CHALLENGE')) !== decryptedChallenge) return false;
		Object.values(config.services)
			.forEach((s: any) => cronjobs.add(s) && s.onCredentials && s.onCredentials($(s.id, true)));
		return true;
	} catch(e){ return false }
}

export function envKey(key: string, isCredential?: boolean){
	return config.envPrefix + key.toUpperCase() + (isCredential ? config.envCredentialsPostfix : '');
}

export function $(key: string, isCredential?: boolean){
	const k = envKey(key, isCredential);
	let v = config.env[k];
	if(v && isCredential){
		try { v = cryptr.decrypt(v); } catch(e){
			console.error('Unable to authenticate data in "'+k+'"');
			v = e.message;
		}

	}
	return parseJson(v) || v;
}