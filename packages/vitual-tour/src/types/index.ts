import { VirtualToursController } from './virtual-tour.service';

export {
  DeleteRequest,
  Empty,
  GetRequest,
  QueryBuilder,
  RequestContext,
} from './common.message';

export * from './virtual-tour.service';
export {
  CreateSceneRequest,
  GetSceneResponse,
  QuerySceneRequest,
  QuerySceneResponse,
  UpdateSceneRequest,
} from './scene.message';
export {
  CreateTourRequest,
  GetTourResponse,
  QueryTourRequest,
  QueryTourResponse,
  UpdateTourRequest,
  CreateTourNestedScene,
} from './tour.message';
export { Scene, Tour } from './virtual-tour.model';
export type ITourController = Pick<
  VirtualToursController,
  'queryTour' | 'getTour' | 'createTour' | 'updateTour' | 'deleteTour'
>;
export type ISceneController = Pick<
  VirtualToursController,
  'queryScene' | 'getScene' | 'createScene' | 'updateScene' | 'deleteScene'
>;
