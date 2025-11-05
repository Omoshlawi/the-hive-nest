import { FilesController } from './files.service';

export {
  DeleteRequest,
  Empty,
  GetRequest,
  QueryBuilder,
  RequestContext,
} from './common.message';
export {
  CreateFileUsageRuleRequest,
  CreateFileUsageScopeRequest,
  GetFileUsageRuleResponse,
  GetFileUsageScopeResponse,
  QueryFileUsageRuleRequest,
  QueryFileUsageRuleResponse,
  QueryFileUsageScopeRequest,
  QueryFileUsageScopeResponse,
  UpdateFileUsageRuleRequest,
  UpdateFileUsageScopeRequest,
} from './file-usage.message';
export * from './files.service';

export {
  CreateFileRequest,
  GetByHashRequest,
  GetFileResponse,
  QueryFileRequest,
  QueryFileResponse,
  GetBlobResponse,
  FileBlobData,
  GenerateUploadSignedUrlRequest,
  GenerateUploadSignedUrlResponse,
  SignedUrlData,
} from './files.message';
export {
  FileUsageRule,
  FileUsageScope,
  Organization,
  User,
  FileBlob,
  FileMetadata,
} from './files.model';
export type IFileUsageScopeController = Pick<
  FilesController,
  | 'queryFileUsageScope'
  | 'getFileUsageScope'
  | 'createFileUsageScope'
  | 'updateFileUsageScope'
  | 'deleteFileUsageScope'
>;
export type IFileUsageRuleController = Pick<
  FilesController,
  | 'queryFileUsageRule'
  | 'getFileUsageRule'
  | 'createFileUsageRule'
  | 'updateFileUsageRule'
  | 'deleteFileUsageRule'
>;
export type IFilesController = Pick<
  FilesController,
  | 'queryFile'
  | 'getFile'
  | 'getBlobByHash'
  | 'createFile'
  | 'deleteFile'
  | 'generateUploadSignedUrl'
>;
