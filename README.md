# prompt-app

Provides an interface for node apps. Comes with built-in services for managing jobs ("cronjobs") and encrypting sensitive environment data.

It's basically [prompts](https://github.com/terkelg/prompts) on crack.

![prompt-app-example](./example.gif "prompt-app-example")

*Note: This is the result of a hackaton, works fine though.*

## Install

```
npm install prompt-app // or
yarn install prompt-app
```

## Structure

See [example](./example) for details.

#### index.ts

```ts
import App from 'prompt-app'
import * as services from './services'

App({services});
```

#### services/*

```ts
export class Server {
	static id = 'server';
	static description = 'Node.js Web Server';
	static color = 'red';

	static jobs: promptApp.Job[] = [{
		method: Server.Flush,
		id: 'flush',
		name: 'Flush Caches',
		description: 'Weekdays from 8 to 22',
		active: false,
		interval: 30,
		executable: ({between}) => between(8, 22, true)
	}];

	static onCredentials(_credentials: any){
		// new Server(credentials);
	}

	static Flush({debug}: any){
		debug('Flushing Caches (not rly)...');
		return true;
	}
}
```

#### .env

```ts
APP_CHALLENGE=4f766d25fd5f7cdf1a8e98bc7907865cf6c76274d8a215549e121c26c48013713ab1102640e11d810a4d87c98b00c8772fc92edc1f0e507ca152834a0e1a01d790af2970c5855fb7c4bca766bfc7e1aad57995ae297bbab072979d073e496998c28e047ea71e6ea843d9
APP_PASSWORD=secret // use ONLY in development, never in production
APP_SERVER_CREDENTIALS=a514e5f926c4ddb1a412429f3ebc2adc1627d0db71eeca68df9ea2af6343aab89ec6e77d4c71f05f3b11ba97b50c873f36cd5778601c16d6c64e5b77176ba628095d86cdeec3fc35db91484274a237949c1a4635fd450db386272e1fd0b00940945ec06f6d461cf294bbb15f356e3cffcd152cd21e46f5a2bb4b72a59d6a08fa2f7c652a0d355853deedd2efd564
```

Generate service credentials by using the built in "Encrypt"-Tool.

### Credits
- [prompts](https://github.com/terkelg/prompts)