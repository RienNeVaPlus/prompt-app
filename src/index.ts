import prompts from 'prompts'
import ora from 'ora'
import {
  callturn,
  capitalize,
  console,
  cronjobs,
  dateDetails,
  decrypt,
  encrypt,
  env,
  envKey,
  generateChallenge,
  getAllPropertyNames,
  isCapitalized,
  isClass,
  unlock
} from './utils'
import * as defaultServices from './services'

const {col} = console

export const config: promptApp.Config = {
  title: 'Menu',
  exposeMethod: name => isCapitalized(name) || name.charAt(0) === '$',
  mapMethodName: name => name.replace(/^\$/,'').split(/(?=[A-Z])/)
    .map(s => capitalize(s))
    .join(' '),
  useDefaultServices: true,
  envPrefix: 'APP_',
  envCredentialsPostfix: '_CREDENTIALS',
  maxPrototypeChainLength: 2,
  disableActiveJobs: false,
  env: {...process.env},
  writeLogs: false,
  onQuitBefore: async (_cronjobs: any[]) => true,
  onQuitAfter: async () => {},
  services: {}
};

export const Utilities = defaultServices.Utilities;

export {
	encrypt, decrypt, console as console2
}

const methodTypes = ['object', 'function']
const exposable = (service: typeof promptApp.Service, prop: string) => {
	try { return methodTypes.includes(typeof (<any>service)[prop]) && config.exposeMethod(prop, service) } catch(e){ return false }
}

async function main(password?: string, answer: any = {}): Promise<void> {
	let retry: boolean, cancel: boolean
	const {services, title, mapMethodName, maxPrototypeChainLength} = config

  do {
		cancel = retry = false

    answer = {...answer, ...await prompts([
        // Password
        {
          type: password || !env('CHALLENGE') ? null : 'password',
          name: 'secret',
          message: 'Password',
          validate: val => (password = unlock(val) && val) && true,
          onState: ({aborted}) => { cancel = aborted }
        },
        // Service
        {
          type: answer.service ? null : 'select',
          name: 'service',
          message: title,
          choices:
            Object.keys(services)
              .filter(key =>
                getAllPropertyNames(services[key], maxPrototypeChainLength)
                  .find(prop => exposable(services[key], prop))
              )
              .map(key => {
                const service = services[key]
                let title = callturn(service.title)
                return {
                  title: service.color ? col(String(title), service.color) : title,
                  description: callturn(service.description),
                  value: key
                }
              })
              .concat({title: col('✖', 'white'), description: 'Quit', value: 'quit'}),
          format: v => v === 'quit' ? (cancel = true) && v : v,
          onState: ({aborted}) => { retry = !aborted; cancel = aborted }
        },
        // Method
        {
          type: () => cancel || answer.action ? null : 'select',
          name: 'action',
          message: 'Method',
          onState: ({aborted}) => cancel = aborted,
          choices: ((prev: string) => {
            prev = prev || answer.service
            return getAllPropertyNames(services[prev], maxPrototypeChainLength)
              .filter(prop => exposable(services[prev], prop))
              .map((key:string) => {
                const service = services[prev], target = (service as any)[key]
                let title = callturn(target.title) || mapMethodName(key, service)
                title = service.color ? col(title, service.color) : title
                return {
                  value: key,
                  title,
                  description: callturn(target.description)
                }
              })
              .concat({
                value: 'back',
                title: col('◄', 'white'),
                description: 'Back'
              })
          }) as any
        }
    ])}

    if(cancel) retry = false
	} while(retry)

	if(cancel){
		if(answer.service && answer.service !== 'quit') return main(password)
		return await quit()
	}

  let service = services[answer.service] as any

  // force recursive sub classes into this project, sorry for the mess.
  while(isClass(service[answer.action])) {
    service = service[answer.action]
    answer = {...answer, ...await prompts({
      type: () => 'select',
      name: 'action',
      message: 'Method',
      // onState: ({aborted}) => cancel = aborted,
      choices: (() => {
        return Object.getOwnPropertyNames(service)
          .filter(prop => exposable(service as any, prop))
          .map((key:string) => {
            const target = (service as any)[key]
            let title = callturn(target.title) || mapMethodName(key, service)
            title = service.color ? col(title, service.color) : title
            return {
              value: key,
              title,
              description: callturn(target.description)
            }
          })
          .concat({
            value: 'back',
            title: col('◄', 'white'),
            description: 'Back'
          })
      }) as any
    })}
  }

  if(answer.action === 'back'){
    return await main(password)
	}

  await execute('user', service, service[answer.action], answer.action)

	return await main(password, {service: answer.service})
}

/**
 * Execute
 */
export async function execute(
  origin: 'user' | 'job',
  service: promptApp.Service,
  method: any,
  name?: string
){
  // let method = service[action] as any
  method = typeof method === 'function' ? method : method.$ || method.method

  const box = console.box().line(
		'['+(origin === 'user' ? col('User', 'yellow') : col(capitalize(origin), 'magenta')) +']'+
		' ' + col(service.title || service.name, service.color || 'white') +
		': ' + config.mapMethodName(name || method.name, service), 'pre:'
	)

  try {
		const spinner = ora({text:'Executing...', spinner:'dots'})

		if(origin === 'user')
			spinner.start()

		const date = dateDetails()
    // const res = await method(arg({
    //   box,
    //   service,
    //   date,
    //   spinner,
    //   origin
    // }))
		const res = await method({
			console: box,
			...box,
			service,
			prompts: (
				questions: prompts.PromptObject | Array<prompts.PromptObject>,
				options?: prompts.Options) => { spinner.stop(); return prompts(questions, options) },
			date,
			spinner,
			origin
		})
		const runtime = new Date().getTime() - date.date.getTime()
		spinner.stop()

		if(res === null) return
		if(res !== undefined) box.line(
			...(res === true	? [col('Success', 'green'), runtime+'ms']
				: ['Result:', res, runtime > 0 ? '('+runtime+'ms)' : ''])
		)
		//console.opt.console.log(await box.build());
		box.out()
	}
	catch(e){ box.error(e.stack).out() }
}

async function quit(): Promise<void> {
  if(await config.onQuitBefore(cronjobs) === false) return
	await cronjobs.terminate()
	console.info('Bye')
  await config.onQuitAfter()
}

export async function app(configuration: promptApp.Configuration): Promise<void> {
  Object.assign(config, configuration, {
    writeLogs: configuration.writeLogs === true ? __dirname : configuration.writeLogs,
    env: {...process.env, ...(configuration.env||{})}
  })
	// config = {
	//   ...config,
	// 	...configuration,
  //   writeLogs: configuration.writeLogs === true ? __dirname : configuration.writeLogs,
	// 	env: {...process.env, ...(configuration.env||{})}
	// } as promptApp.Config

  let password = env('password'), challenge = env('challenge')

	// delete sensitive information - remember: never provide APP_PASSWORD in production
	if(password){
		delete config.env[envKey('password')]
		delete process.env[envKey('password')]
	}

	// optionally generate challenge
	if(!challenge){
		challenge = await generateChallenge(password)
		if(challenge)
			return await quit()
	}

	// add internal services
	if(config.useDefaultServices){
		config.services = {...defaultServices, ...config.services}
	}

	// add service id if not provided
	Object.keys(config.services).forEach(s =>
		Object.assign(config.services[s], {
			id: config.services[s].id || s.toLowerCase(),
			title: config.services[s].title || capitalize(s),
			description: config.services[s].description || ''
		})
	)

	// auto unlock using key
	if(challenge && password && !unlock(password)) {
		console.error('Invalid password in env.'+envKey('password'))
		password = ''
	}

	// security is disabled
	if(!challenge){
		Object.keys(config.services).forEach(s => cronjobs.add(config.services[s]))
	}

	return main(password)
}

export default app

export type Job = promptApp.Job