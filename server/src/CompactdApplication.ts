import 'storyboard-preset-console';

import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as morgan from 'morgan';
import * as path from 'path';
import * as PouchDB from 'pouchdb';
import * as shortid from 'shortid';
import {player} from './endpoints/boombox';
import Authenticator from './features/authenticator';
import endpoints from './endpoints';
import * as Stream from 'stream';
import config from './config';
import {mainStory} from 'storyboard';
import * as request from 'request';
import httpEventEmitter from './http-event';
import * as http from 'http';

export class CompactdApplication {
  private auth: Authenticator;
  protected app: express.Application;
  private port: number;
  private host: string;

  constructor(host: string = 'localhost', port: number = 9000) {
    this.app = express();
    this.port = port;
    this.auth = new Authenticator('instance', config.get('secret'));
    this.host = host;
  }

  protected setupCouchDB () {
    // this.app.use('/database', expressProxy(
    //   config.get('couchHost') + ':' + config.get('couchPort'), {
    //   proxyReqOptDecorator: this.auth.proxyRequestDecorator()
    // }));
    this.app.all('/database/*', bodyParser.urlencoded({extended: true}), bodyParser.json(), async (req, res) => {
      // req.pause();
      
      const headers = await this.auth.proxyRequestDecorator()({headers: {...req.headers}}, req);
      const remoteUrl = req.url.slice(10);
      
      const opts = Object.assign({
        method: req.method,
        url: `http://${config.get('couchHost')}:${config.get('couchPort')}/${remoteUrl}`,
        ...headers,
      }, req.method !== 'GET' ? {body: JSON.stringify(req.body)} : {});

      mainStory.info('http', `${req.method} ${req.url} -> http://${config.get('couchHost')}:${config.get('couchPort')}/${remoteUrl}`, {
        attach: opts,
        attachLevel: 'trace'
      });

      const remoteReq = request(opts).pipe(res);
    });
  }
  public start () {
    return new Promise<void>((resolve, reject) => {
      this.setupCouchDB();
      this.configure();
      this.route();
      const server = http.createServer(this.app);
      httpEventEmitter.attach(server as any, this.auth);
      server.listen(this.port, this.host, () => {
        mainStory.info('http', `Express listening on ${this.host}:${this.port} `);
        resolve();
      });
    });
  }
  protected unprotectedEndpoints () {
    player(this.app);
  }
  /**
   * Configure express app by adding middlewares
   */
  configure () {

    class MorganStream extends Stream.Writable {
      _write(chunk: string, enc: string, next: Function) {
        const str = chunk.toString();
        if (str && str.length) {
          mainStory.info('http', str.replace('\n', ''));
        } 
        next();
      }
    }
    this.app.use(morgan(
      ':method :url :status - :response-time ms', {
        stream: new MorganStream()
      }
    ));
    this.app.use(bodyParser.urlencoded({extended: true}));
    this.app.use(bodyParser.json());
    this.app.post('/api/sessions', this.auth.signinUser());
    this.app.post('/api/users', this.auth.signupUser());

    this.unprotectedEndpoints();

    this.app.use('/api*', this.auth.requireAuthentication());
  }
  /**
   * Creates the *protected* routes (under api only)
   */
  route () {
    endpoints(this.app);
  }
}
