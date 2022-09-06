namespace promptApp {
	export interface Configuration {
		services: {[key: string]: typeof Service} // your service classes
		title?: string // an optional title to your service
		exposeMethod?: (name: string, service: any) => boolean // which method to expose (default=charAt(0) == Uppercase or $dollar)
		mapMethodName?: (name: string, service: any) => string // transforms the method name to human readable (default=$myMethod = My Method)
		useDefaultServices?: boolean // whether to use the built-in "Utilities" service for cronjobs, loglevels etc
    writeLogs?: string | boolean // true (=__dirname) or path to logs
		env?: any // environment variables (this will be merged with process.env and thus is optional)
		disableActiveJobs?: boolean // to disable jobs in development mode
		envPrefix?: string	// prefix for app-specific env-vars (default=APP_)
		envCredentialsPostfix?: string // postfix for credentials (default=_CREDENTIALS)
		maxPrototypeChainLength?: number // how many levels of parent prototypes are inspected (default=2)
	}

	export interface Config extends Configuration {
		title: string
    interactive: boolean,
		exposeMethod: (name: string, service: any) => boolean
		mapMethodName: (name: string, service: any) => string
		useDefaultServices: boolean
    writeLogs: string | false
		env: any
		envPrefix: string
		envCredentialsPostfix: string
    randomizeJobInterval: number
		maxPrototypeChainLength: number
    onQuitBefore: (cronjobs: any) => Promise<boolean | void>
    onQuitAfter: () => Promise<void>
	}

	export abstract class Service {
		[key: string]: any
		// https://github.com/microsoft/TypeScript/pull/37797
		// static [key: string]: any

		static instance?: any
		static id?: string
		static title?: (() => string) | string
		static description?: (() => string) | string
		static color?: 'cyan' | 'green' | 'yellow' | 'red' | 'magenta' | 'blue' | 'white' | 'grey'
			| 'black' | 'rainbow' | 'zebra' | 'code' | string
		static jobs?: Job[]

    static onCredentials?: (credentials: string) => any
	}

	export type JobMethod = (action: ActionArg<'job'>) => any
	export type JobInterval = number
	export type JobExecutable = (date: ExecutionDate) => boolean
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
    executedAt: Date
		active: boolean
		disabled: boolean
	}

	export interface ExecutionDate {
		date: Date
		between: (hourFrom: number, hourTo: number, onWorkdaysOnly?: boolean) => boolean
		workday: boolean
		weekend: boolean
		time: number
		day: number
		hours: number
		minutes: number
	}

	export interface ActionArg<T = 'job' | 'user'>{
		service: typeof Service
		date: ExecutionDate
		origin: T
		prompts: any
		spinner: any
		console: any
		error: any
		warn: any
		debug: any
		info: any
		log: any
		line: any
		box: any
	}
}