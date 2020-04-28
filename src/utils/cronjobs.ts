import {sleep, console, uuid, findDuplicates} from '.'
import prompts from '../index';

class Cronjobs {
	list: promptApp.Cronjob[] = [];

	interval = setInterval(async () => {
		for(const job of this.ready){
			const {service} = job;
			job.executing = true;
			const box = console.box().line(
				console.col('[Job]', 'magenta'),
				console.col(service.title||service.id, service.color || 'white')+':', job.name || job.id
			);
			try {
				const now = new Date().getTime();
				const res = await (job.$ || job.method!)({...box, service, prompts} as promptApp.ActionArg);
				const time = new Date().getTime() - now;
				if(res === null) return;
				if(console.logLevel() > 2) box.out(...(res === true
					? [console.col('Success', 'green'), time+'ms']
					: ['Result:', res, time > 0 ? '('+time+'ms)' : ''])
				);
			}
			catch(e){ box.error(e.stack).out(); }
			job.executing = false;
		}
	}, 1000);

	add(service: typeof promptApp.Service): promptApp.Cronjob[] {
		const jobs: promptApp.Job[] = service.jobs||[];
		const duplicates = findDuplicates(jobs.map(e => e.id));
		duplicates.forEach(d => console.log(console.col(
			'Error in '+service.id+': duplicate job id "'+d+'"', 'red'
		)));

		return this.list = [...this.list, ...jobs.map((j: any) => ({
			id: service.id + '_' + (j.id || j.name || uuid()),
			name: j.name,
			interval: 1,
			active: !j.disabled,
			disabled: false,
			...j,
			service
		}))];
	}

	get active(): promptApp.Cronjob[] {
		return this.list.filter(job => job.active);
	}

	get ready(): promptApp.Cronjob[] {
		const d = new Date();
		const day = d.getDay(), hours = d.getHours(), workday = (day && day < 6) || false;
		const date = {
			date: d,
			time: Math.floor(d.getTime() / 1000),
			workday,
			between: (fromHours: number, toHours: number, onWorkdaysOnly?: boolean) =>
				hours >= fromHours && hours <= toHours && (!onWorkdaysOnly || workday),
			day,
			hours,
			minute: d.getMinutes()
		};

		return this.active
			.filter(job =>
				job.interval
				&& !(date.time % job.interval)
				&& (typeof job.executable !== 'function' || job.executable(date))
			)
	}

	get executing(): promptApp.Cronjob[] {
		return this.list.filter(job => job.executing);
	}

	async terminate(): Promise<void> {
		clearInterval(this.interval);

		const executing = this.executing;
		if(executing.length){
			console.debug(`Waiting for ${executing.length} job/s to complete`);
			await sleep(5);
			await this.terminate();
			return;
		}

		const active = this.active;
		if(!active.length) return;

		console.warn(`Terminated ${active.length} job/s`);
	}
}

export const cronjobs = new Cronjobs();