export interface ServerConfig {
  port: number;
  host: string;
}

export interface ClassType<T = any> extends Function {
  new (...args: any[]): T;
}
export type Constructor<T> = new (...args: any[]) => T;

export interface HiveService {
  id: string;
  name: string;
  version: string;
  timestamp: string;
  tags: string[];
  endpoints: Endpoint[];
}

export interface Endpoint {
  host: string;
  port: number;
  protocol: string;
}