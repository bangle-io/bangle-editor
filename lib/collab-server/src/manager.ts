import { Disk } from '@bangle.dev/disk';
import { Node, Schema } from '@bangle.dev/pm';
import { serialExecuteQueue } from '@bangle.dev/utils';

import {
  CollabError,
  ValidErrorCodes as ValidCollabErrorCodes,
} from './collab-error';
import { CollabRequestHandler } from './collab-request-handler';
import { Instance } from './instance';
import { CollabRequestType, CollabResponse } from './types';
import { uuid } from './utils';

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

const MAX_INSTANCES = 10;

export class Manager {
  public instanceCount = 0;
  public destroyed = false;
  public readonly managerId = uuid();

  private _cleanUpInterval?: ReturnType<typeof setInterval> = undefined;
  private _collectUsersTimeout;
  private _disk;
  private _getDocumentQueue = serialExecuteQueue();
  private _instances: Record<string, Instance> = {};
  private _interceptRequests?: (path: string, payload: any) => void;
  private _routes;

  constructor(
    schema: Schema,
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
    this._disk = disk;
    this._collectUsersTimeout = collectUsersTimeout;
    this._interceptRequests = interceptRequests;
    // to prevent parallel requests from creating deadlock
    // for example two requests parallely comming and creating two new instances of the same doc
    this._routes = new CollabRequestHandler(
      this._getInstanceQueued,
      userWaitTimeout,
      schema,
      this.managerId,
    );

    if (instanceCleanupTimeout > 0) {
      this._cleanUpInterval = setInterval(
        () => this._cleanup(),
        instanceCleanupTimeout,
      );
    }
  }

  public destroy() {
    log('destroy called');
    this.destroyed = true;
    // todo need to abort `pull_events` pending requests
    for (const i of Object.values(this._instances)) {
      this._stopInstance(i.docName);
    }

    clearInterval(this._cleanUpInterval);
    this._cleanUpInterval = undefined;
  }

  public getDocVersion(docName: string): number | undefined {
    const instance = this._instances[docName];
    return instance?.version;
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
      if (this._interceptRequests) {
        await this._interceptRequests(path, payload);
      }
      switch (path) {
        case 'pull_events': {
          data = await this._routes.pullEvents(payload);
          break;
        }
        case 'push_events': {
          data = await this._routes.pushEvents(payload);
          break;
        }
        case 'get_document': {
          data = await this._routes.getDocument(payload);
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
          message:
            err instanceof Error ? err.message : 'Unknown error occurred',
        },
      };
    }
  }

  private _cleanup() {
    log('Cleaning up');
    const instances = Object.values(this._instances);
    for (const i of instances) {
      if (i.userCount === 0) {
        this._stopInstance(i.docName);
      }
    }
  }

  private async _getInstanceQueued(docName: string, userId: string) {
    if (this.destroyed) {
      throw new CollabError(410, 'Server is no longer available');
    }

    if (!userId) {
      throw new Error('userId is required');
    }
    return this._getDocumentQueue.add(async () => {
      if (this.destroyed) {
        throw new CollabError(410, 'Server is no longer available');
      }

      let inst = this._instances[docName] || (await this._newInstance(docName));
      if (userId) {
        inst.registerUser(userId);
      }
      inst.lastActive = Date.now();
      return inst;
    });
  }

  private async _newInstance(docName: string, doc?: Node, version?: number) {
    log('creating new instance', docName, version);
    const { _instances: instances } = this;
    if (!doc) {
      doc = await this._disk.load(docName);
    }

    if (!doc) {
      console.warn('doc not found', docName);
      throw new CollabError(404, `Document ${docName} not found`);
    }

    if (++this.instanceCount > MAX_INSTANCES) {
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
        ? this._disk.flush(docName, instance.doc, instance.version)
        : this._disk.update(docName, () => ({
            doc: instance.doc,
            version: instance.version,
          }));
    };

    return (instances[docName] = new Instance(
      docName,
      doc,
      version,
      scheduleSave,
      this._collectUsersTimeout,
    ));
  }

  private _stopInstance(docName: string) {
    const instance = this._instances[docName];
    if (instance) {
      log('stopping instances', instance.docName);
      instance.stop();
      delete this._instances[docName];
      --this.instanceCount;
    }
  }
}
