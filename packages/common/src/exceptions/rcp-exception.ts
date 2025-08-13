import { RpcException } from '@nestjs/microservices';

export class ServerRpcException extends RpcException {}

export class ClientRpcException extends RpcException {}
