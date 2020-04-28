import clipboardy from 'clipboardy';

export * from './console2'
export * from './cronjobs'
export * from './security'

export function sleep(sec: number = 1) {
	return new Promise(resolve => setTimeout(resolve, sec * 1000));
}

export function callturn(funct: Function | string | number, ...args: any[]){
	return typeof funct === 'function' ? funct(...args) : funct;
}

export function parseJson(string: string) {
	try { return JSON.parse(string); } catch (e) { return false; }
}

export function uuid(){
	return require('crypto').randomBytes(5).toString("hex")
}

export function findDuplicates(array: any[]){
	return array.filter((item: any, index: number) => array.indexOf(item) != index)
}

export function isCapitalized(string: string){
	return string.charAt(0).toUpperCase() === string.charAt(0);
}

export function capitalize(string: string){
	return string.charAt(0).toUpperCase() + string.slice(1);
}

export function copy(string: string, box?: any){
	clipboardy.writeSync(string);
	if(box) box.out('✔️ Copied to clipboard');
	return string;
}