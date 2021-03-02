import clipboardy from 'clipboardy'

export * from './console2'
export * from './cronjobs'
export * from './security'

export function sleep(sec: number = 1) {
	return new Promise(resolve => setTimeout(resolve, sec * 1000))
}

export function callturn(funct?: Function | string | number, ...args: any[]){
	return typeof funct === 'function' ? funct(...args) : funct
}

export function parseJson(string: string) {
	try { return JSON.parse(string) } catch (e) { return false }
}

export function uuid(){
	return require('crypto').randomBytes(5).toString("hex")
}

export function findDuplicates(array: any[]){
	return array.filter((item: any, index: number) => array.indexOf(item) != index)
}

export function isCapitalized(string: string){
	return string.charAt(0).toUpperCase() === string.charAt(0)
}

export function capitalize(string: string){
	return string.charAt(0).toUpperCase() + string.slice(1)
}

export function copy(string: string, box?: any){
	try {
		clipboardy.writeSync(string)
		if(box) box.line('✔️ Copied to clipboard')
	} catch(e) {}
	return string
}

// https://gist.github.com/RienNeVaPlus/fee2ee6b3eadf61b79245896357d7624#file-getallpropertynames-ts
export function getAllPropertyNames(
	obj: { new(): any } | any,
	maxChainLength: number = 2
): string[] {
	let set: Set<string> = new Set(), i: number = 0
	do { i++
		Object.getOwnPropertyNames(obj).forEach(n => set.add(n))
		obj = Object.getPrototypeOf(obj)
	} while(obj.constructor !== Object && i < maxChainLength)
	return [...set]
}

export function dateDetails(date: Date = new Date()){
	const day = date.getDay(), hours = date.getHours(), workday = (day && day < 6) || false
	return {
		date,
		time: Math.floor(date.getTime() / 1000),
		workday,
		weekend: !workday,
		between: (fromHours: number, toHours: number, onWorkdaysOnly?: boolean) =>
			hours >= fromHours && hours <= toHours && (!onWorkdaysOnly || workday),
		day,
		hours,
		minute: date.getMinutes()
	}
}