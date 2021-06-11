import { serialExecuteQueue, uuid } from './utils';
import { Instance } from './instance';
import { Schema, Node } from 'prosemirror-model';
import { CollabRequestHandler } from './collab-request-handler';
import { CollabResponse, CollabRequestType } from './types';
import {
  CollabError,
  ValidErrorCodes as ValidCollabErrorCodes,
} from './collab-error';
import { Disk } from './disk';

const LOG = false;

let log = LOG ? console.log.bind(console, 'collab-server') : () => {};

type HandleResponseOk = {
  status: 'ok';
  body: CollabResponse;
};
type HandleResponseError = {
  status: 'error';
  body: {
    message: string;
    errorCode: ValidCollabErrorCodes;
  };
};

export class Manager {
  instanceCount = 0;
  maxCount = 20;
  destroyed = false;
  instances: { [key: string]: Instance } = {};
  getDocumentQueue = serialExecuteQueue<Instance>();

  routes;
  disk;
  cleanUpInterval?: number = undefined;
  collectUsersTimeout;
  interceptRequests?: (path: string, payload: any) => void;
  managerId = uuid();
  constructor(
    private schema: Schema,
    {
      disk,
      // time to wait before aborting the users request
      userWaitTimeout = 7 * 1000,
      collectUsersTimeout = 5 * 1000,
      instanceCleanupTimeout = 10 * 1000,
      interceptRequests = undefined, // useful for testing or debugging
    }: {
      disk: Disk;
      userWaitTimeout: number;
      collectUsersTimeout: number;
      instanceCleanupTimeout: number;
      interceptRequests?: (path: string, payload: any) => void;
    },
  ) {
    this._getInstanceQueued = this._getInstanceQueued.bind(this);
    this.disk = disk;
    this.collectUsersTimeout = collectUsersTimeout;
    this.interceptRequests = interceptRequests;
    // to prevent parallel requests from creating deadlock
    // for example two requests parallely comming and creating two new instances of the same doc
    this.routes = new CollabRequestHandler(
      this._getInstanceQueued,
      userWaitTimeout,
      schema,
      this.managerId,
    );

    if (instanceCleanupTimeout > 0) {
      this.cleanUpInterval = setInterval(
        () => this._cleanup(),
        instanceCleanupTimeout,
      );
    }
  }

  public async handleRequest(
    path: CollabRequestType,
    payload: any,
  ): Promise<HandleResponseError | HandleResponseOk> {
    if (!payload.userId) {
      throw new Error('Must have user id');
    }

    log(`request to ${path} from `, payload.userId, payload);
    let data;

    try {
      if (this.interceptRequests) {
        await this.interceptRequests(path, payload);
      }
      switch (path) {
        case 'pull_events': {
          data = await this.routes.pullEvents(payload);
          break;
        }
        case 'push_events': {
          data = await this.routes.pushEvents(payload);
          break;
        }
        case 'get_document': {
          data = await this.routes.getDocument(payload);
          break;
        }
      }
      return {
        status: 'ok',
        body: data,
      };
    } catch (err) {
      if (err instanceof CollabError) {
        return {
          status: 'error',
          body: {
            errorCode: err.errorCode,
            message: err.message,
          },
        };
      }

      console.error(err);
      return {
        status: 'error',
        body: {
          errorCode: 500,
          message: err.message || 'Unknown error occurred',
        },
      };
    }
  }

  private _stopInstance(docName: string) {
    const instance = this.instances[docName];
    if (instance) {
      log('stopping instances', instance.docName);
      instance.stop();
      delete this.instances[docName];
      --this.instanceCount;
    }
  }

  private _cleanup() {
    log('Cleaning up');
    const instances = Object.values(this.instances);
    for (const i of instances) {
      if (i.userCount === 0) {
        this._stopInstance(i.docName);
      }
    }
  }

  public destroy() {
    log('destroy called');
    this.destroyed = true;
    // todo need to abort `pull_events` pending requests
    for (const i of Object.values(this.instances)) {
      this._stopInstance(i.docName);
    }

    clearInterval(this.cleanUpInterval);
    this.cleanUpInterval = undefined;
  }

  private async _newInstance(docName: string, doc?: Node, version?: number) {
    log('creating new instance', docName, version);
    const { instances } = this;
    let created;
    if (!doc) {
      doc = await this.disk.load(docName);
    }

    if (++this.instanceCount > this.maxCount) {
      let oldest = null;
      for (let inst of Object.values(instances)) {
        if (!oldest || inst.lastActive < oldest.lastActive) {
          oldest = inst;
        }
      }
      if (oldest) {
        this._stopInstance(oldest.docName);
      }
    }
    const scheduleSave = (final?: boolean): void => {
      const instance = instances[docName];
      if (!instance) {
        return;
      }
      final
        ? this.disk.flush(docName, instance.doc, instance.version)
        : this.disk.update(docName, () => ({
            doc: instance.doc,
            version: instance.version,
          }));
    };

    return (instances[docName] = new Instance(
      docName,
      this.schema,
      doc,
      scheduleSave,
      created,
      this.collectUsersTimeout,
      version,
    ));
  }

  private async _getInstanceQueued(docName: string, userId: string) {
    if (this.destroyed) {
      throw new CollabError(410, 'Server is no longer available');
    }

    if (!userId) {
      throw new Error('userId is required');
    }
    return this.getDocumentQueue.add(async () => {
      if (this.destroyed) {
        throw new CollabError(410, 'Server is no longer available');
      }

      let inst = this.instances[docName] || (await this._newInstance(docName));
      if (userId) {
        inst.registerUser(userId);
      }
      inst.lastActive = Date.now();
      return inst;
    });
  }
}
