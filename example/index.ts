import {config} from 'dotenv'
import App from '../src'
import * as services from './services'

config({path:'./example/.env'});

App({
	services,
	env: process.env,
});
