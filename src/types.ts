namespace promptApp {
	export interface Configuration {
		services: any
		title?: string
		exposeMethod?: (name: string, service: any) => boolean
		mapMethodName?: (name: string, service: any) => string
		useDefaultServices?: boolean
		env?: any
		envPrefix?: string
		envCredentialsPostfix?: string
	}

	export interface Config extends Configuration {
		title: string
		exposeMethod: (name: string, service: any) => boolean
		mapMethodName: (name: string, service: any) => string
		useDefaultServices: boolean
		env: any
		envPrefix: string
		envCredentialsPostfix: string
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

	export type JobMethod = (action: ActionArg) => any
	export type JobInterval = number
	export type JobExecutable = (date: CronjobExecutableArg) => boolean
	export type JobDescription = string

	export interface JobObject {
		$: JobMethod // function to run
		id?: string // optionally auto generated
		interval?: JobInterval // number of seconds between executions
		title?: string // title to display on logs and tools
		description?: JobDescription // text for tools.jobs
		active?: boolean // whether the job is enabled by default
		disabled?: boolean // disable selecting the job in tools.jobs
		executable?: JobExecutable // is run before job execution
	}

	export type JobArray = [JobMethod, JobInterval?, (JobExecutable | JobDescription)?, JobDescription?]

	export type Job = JobObject | JobArray

	export interface Cronjob extends JobObject {
		service: any // private
		id: string
		interval: number
		title: string // name to display on logs and tools
		executing: boolean // weather the job is running
		active: boolean
		disabled: boolean
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