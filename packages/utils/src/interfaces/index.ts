export interface ServerConfig {
  port: number;
  host: string;
}

export interface ClassType<T = any> extends Function {
  new (...args: any[]): T;
}
// export type Constructor<T> = new (...args: any[]) => T;
