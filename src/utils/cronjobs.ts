import {console2, findDuplicates, sleep, uuid} from '.'
import {config, execute} from '../index'

const {col} = console2

class Cronjobs {
	list: promptApp.Cronjob[] = []

	interval = setInterval(async () => {
    for(const job of this.ready){
      if(this.interval._destroyed) continue
			job.executing = true
      job.executedAt = new Date
      await execute('job', job.service, job.$, job.title)
      job.executing = false
		}
  }, 1000) as any

	add(service: typeof promptApp.Service): promptApp.Cronjob[] {
		const jobs = (service.jobs||[]).map(j => (Array.isArray(j) ? {
				$: j[0],
				interval: j[1],
				executable: typeof j[2] === 'function' ? j[2] : undefined,
				description: typeof j.slice(-1)[0] === 'string' ? String(j.slice(-1)[0]) : ''
			} : j) as promptApp.Job
		)

		this.list = [
      ...this.list,
      ...jobs.map((j: any) => ({
				id: service.id + '.' + (j.$.name||uuid()),
				title: config.mapMethodName(j.$.name || uuid(), service),
				disabled: false,
				...j,
        interval: j.interval ? (j.interval + (j.interval * config.randomizeJobInterval)) : 1,
				active: config.disableActiveJobs ? false : !j.disabled,
				service,
			})
		)]

		const duplicates = findDuplicates(this.list.map(e => e.id))
		duplicates.forEach(d => console2.log(col('Warning: Duplicate job ID "'+d+'"', 'red')))

		return this.list
	}

	get date(){
		const d = new Date()
		const day = d.getDay(), hours = d.getHours(), workday = (day && day < 6) || false
		return {
			date: d,
			time: Math.floor(d.getTime() / 1000),
			workday,
			weekend: !workday,
			between: (fromHours: number, toHours: number, onWorkdaysOnly?: boolean) =>
				hours >= fromHours && hours <= toHours && (!onWorkdaysOnly || workday),
			day,
			hours,
			minutes: d.getMinutes()
		}
	}

	get active(): promptApp.Cronjob[] {
		return this.list.filter(job => job.active)
	}

	get ready(): promptApp.Cronjob[] {
		const date = this.date
		return this.active
			.filter(job =>
				job.interval
        && !job.executing
				&& !(date.time % job.interval)
				&& (typeof job.executable !== 'function' || job.executable(date))
			)
	}

	get executing(): promptApp.Cronjob[] {
		return this.list.filter(job => job.executing)
	}

	async terminate(): Promise<void> {
    const { interval } = this
    if(!interval._destroyed) clearInterval(interval)
    const now = new Date().getTime()
    const { col } = console2

    const executing = this.executing
		if(executing.length){
      const box = console2.box(`Waiting for ${col(executing.length + ' job' + (executing.length!==1?'s':''), 'underline')} to finish.`)
      executing.map(job => box.line(
        box.pad(' ', 60,
          col(job.service.name, 'yellow')+'.'+col(job.id.split('.', 2)[1], 'magenta')
        ),
        box.col('running: ', 'red'),

        box.pad('·' , 21, col(Math.ceil((now - job.executedAt.getTime()) / 1000)+' seconds', 'white'),true),

      ))
      box.out()
			await sleep(4)
			await this.terminate()
			return
		}

		const active = this.active
		if(!active.length) return

		console2.warn(`Terminated ${active.length} job/s`)
	}
}

export const cronjobs = new Cronjobs()