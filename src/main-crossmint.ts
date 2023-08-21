import { CrossmintPlay } from './app/crossmintPlay';
import { Logger } from './app/common/logger';
import {printConfig} from "./config";

Logger.logTask('SYSTEM', 'STARTING');

printConfig();

CrossmintPlay.run();

Logger.logTask('SYSTEM', 'FINISHED');
