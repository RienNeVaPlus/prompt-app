import {config} from 'dotenv'
import PromptApp from '../src'
import * as services from './services'

config({path:'./example/.env'});

PromptApp({
	services,
	env: process.env,
});
// app.terminate();
