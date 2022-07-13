import console2 from 'console2'
import {promises as fs} from 'fs'
import {config} from '../index'

/**
 * PromptApp uses a very old library called console2 which should be replaced completely.
 * So... thanks for understanding the mess below.
 */

export enum LogLevel {
	Error = 1,
	Warn,
	Info,
	Debug
}

function extendBox(box: any){
	box.debug = (...args: any[]) => logLevel > 3 && box.line(...args) || console
	box.info = (...args: any[]) => logLevel > 2 && box.line(...args) || console
	box.warn = (...args: any[]) => logLevel > 1 && box.line(...(args.concat('yellow'))) || console
	box.error = (...args: any[]) => logLevel && box.line(...(args.concat('red'))) || console
	box.box = (sup => (...args: any[]) => extendBox(sup.bind(box)(...args)))(box.box)
	return box
}

export let logLevel: LogLevel = LogLevel.Debug
const c: any = console2({disableWelcome:true, override:true}) // isWorker

// set log level
c.logLevel = (set?: keyof typeof LogLevel) => {
	if(set) logLevel = LogLevel[set]
	return logLevel
}

const {stdout} = (process as any)

stdout._orig_write = stdout.write
stdout.write = (data: any) => {
  const n = new Date
  if(config.writeLogs){
    fs.appendFile(
      `${config.writeLogs}/${n.toISOString().split('T')[0]}.log`,
      c.strip(data.toString())
    )
  }
  return stdout._orig_write(data)
}

// implement logLevel
c.error = (f => (...args: any[]) => logLevel && f.bind(c)(...args))(c.error)
c.warn = (f => (...args: any[]) => logLevel > 1 && f.bind(c)(...args))(c.warn)
c.info = (f => (...args: any[]) => logLevel > 2 && f.bind(c)(...args))(c.info)
c.debug = (f => (...args: any[]) => logLevel > 3 && f.bind(c)(...args))(c.log)

// @ts-ignore
c.box = (f => (...args: any[]) => extendBox(f.bind(c)(...args)))(c.box)

export {c as console2}