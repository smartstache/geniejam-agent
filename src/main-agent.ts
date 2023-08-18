import { Logger } from './app/common/logger';
import {printConfig} from "./config";
import {Agent} from "./app/agent";

Logger.logTask('SYSTEM', 'STARTING');

printConfig();

Agent.run();

Logger.logTask('SYSTEM', 'FINISHED');
