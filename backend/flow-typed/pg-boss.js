declare module 'pg-boss' {
  declare export type ConnectionOptions = {
    database: string;
    user: string;
    password: string;
    host?: string;
    port?: number;
    schema?: string;
    uuid?: string;
    poolSize?: number;
  };

  declare export type PublishOptions = {
    startIn?: number | string;
    singletonKey?: string;
    singletonSeconds?: number;
    singletonMinutes?: number;
    singletonHours?: number;
    singletonDays?: number;
    retryLimit?: number;
    expireIn?: string;
  };

  declare export type SubscribeOptions = {
    teamSize?: number;
    batchSize?: number;
    newJobCheckInterval?: number;
    newJobCheckIntervalSeconds?: number;
  };

  declare export type Request = {
    name: string;
    data?: Object;
    options?: PublishOptions;
  };

  declare export type Job = {
    id: number;
    name: string;
    data: Object;
    done(err?: Error, data?: Object): void;
  };

  declare export class PgBoss {
    constructor(connectionString: string): PgBoss;
    constructor(options: ConnectionOptions): PgBoss;
    on(event: string, handler: Function): void;
    start(): Promise<PgBoss>;
    stop(): Promise<void>;
    connect(): Promise<PgBoss>;
    disconnect(): Promise<void>;
    publish(request: Request): Promise<string | null>;
    publish(name: string, data: Object): Promise<string | null>;
    publish(name: string, data: Object, options: PublishOptions): Promise<string | null>;
    subscribe(name: string, handler: Function): Promise<void>;
    subscribe(name: string, options: SubscribeOptions, handler: Function): Promise<void>;
    onComplete(name: string, handler: Function): Promise<void>;
    onComplete(name: string, options: SubscribeOptions, handler: Function): Promise<void>;
    onFail(name: string, handler: Function): Promise<void>;
    onFail(name: string, options: SubscribeOptions, handler: Function): Promise<void>;
    unsubscribe(name: string): Promise<boolean>;
    offComplete(name: string): Promise<boolean>;
    offExpire(name: string): Promise<boolean>;
    offFail(name: string): Promise<boolean>;
    fetch(name: string): Promise<Job | null>;
    fetch(name: string, batchSize: number): Promise<Job | null>;
    fetchCompleted(name: string): Promise<Job | null>;
    fetchCompleted(name: string, batchSize: number): Promise<Job | null>;
    fetchExpired(name: string): Promise<Job | null>;
    fetchExpired(name: string, batchSize: number): Promise<Job | null>;
    fetchFailed(name: string): Promise<Job | null>;
    fetchFailed(name: string, batchSize: number): Promise<Job | null>;
    cancel(id: string): Promise<void>;
    cancel(ids: string[]): Promise<void>;
    complete(id: string): Promise<void>;
    complete(id: string, data: Object): Promise<void>;
    complete(ids: string[]): Promise<void>;
    fail(id: string): Promise<void>;
    fail(id: string, data: Object): Promise<void>;
    fail(ids: string[]): Promise<void>;
  }

  declare export default Class<PgBoss>;
}
