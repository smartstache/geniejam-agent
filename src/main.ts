import { App } from './app/app';
import { Logger } from './app/common/logger';
import {printConfig} from "./config";

Logger.logTask('SYSTEM', 'STARTING');

printConfig();

App.run();

Logger.logTask('SYSTEM', 'FINISHED');
