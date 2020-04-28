namespace promptApp {
	export interface Config {
		services: any
		useDefaultServices?: boolean
		env?: any
		envPrefix?: string
		envCredentialsPostfix?: string
	}

	export abstract class Service {
		[key: string]: any
		static instance: any;
		static id: string;
		static title?: (() => string) | string;
		static description: (() => string) | string;
		static color: 'cyan' | 'green' | 'yellow' | 'red' | 'magenta' | 'blue' | 'white' | 'grey'
			| 'black' | 'rainbow' | 'zebra' | 'code';
		static jobs?: Job[];
	}

	export interface Job {
		id: string // optionally auto generated
		$?: (action: ActionArg) => any // function to run
		method?: (action: ActionArg) => any // function to run
		interval?: number // number of seconds between executions
		name?: string // name to display on logs and tools
		description?: string // text for tools.jobs
		active?: boolean // whether the job is enabled by default
		disabled?: boolean // disable selecting the job in tools.jobs
		executable?: (date: CronjobExecutableArg) => boolean // is run before job execution
	}

	export interface Cronjob extends Job {
		service: any // private
		name: string // name to display on logs and tools
		executing: boolean // weather the job is running
	}

	export interface CronjobExecutableArg {
		date: Date
		between: (hourFrom: number, hourTo: number, onWorkdaysOnly?: boolean) => boolean
		workday: boolean
		time: number
		day: number
		hours: number
		minute: number
	}

	export interface ActionArg {
		service: typeof Service
		prompts: Function
		error: Function
		warn: Function
		debug: Function
		info: Function
		box: Function
	}
}