import axios, { AxiosError, AxiosInstance, CancelTokenSource } from 'axios';
import qs from 'qs';
import { ListParams, NotesParams, NotesResponse, ProfileParams, WidgetApi } from '../models';

interface ApiClientOptions {
    baseUrl: string;
    /**
     * An optional factory, that should supply bearer token which will
     * be attached to authorization header when making requests.
     */
    authTokenFactory?: () => Promise<string | undefined>;
    /**
     * Write more logs into console.
     */
    debug?: boolean;
}

interface ApiRequest<TRequest = any, TParams = any> {
  readonly url: string;
  readonly method?: 'GET' | 'DELETE' | 'POST' | 'PUT';
  readonly requestData?: TRequest;
  readonly params?: any;
}

export class ApiClient implements WidgetApi {
  private readonly client: AxiosInstance;
  private source: CancelTokenSource;

  constructor(options: ApiClientOptions) {
    if (!options?.baseUrl) {
      throw new Error('baseUrl is required');
    }
    this.source = axios.CancelToken.source();
    this.client = axios.create({
      baseURL: options.baseUrl,
    });

    this.client.interceptors.response.use(undefined, (error: AxiosError) => {
      console.log(
        `Failed to call API`,
        error.response?.status,
        error.response?.data
      );
      return Promise.reject(error);
    });
    if (options.debug) {
      this.useDebugLogs();
    }

    if (options.authTokenFactory) {
      this.useAuth(options.authTokenFactory, options.debug);
    }
  }

  public getProfileByInstance = async (
    addressOrEns: string,
    params?: ProfileParams
  ) =>
    await this.callApi<any>({
      url: `/profiles/${addressOrEns}`,
      method: 'GET',
      params,
    });

  public getNotesByInstance = async (
    addressOrEns: string,
    params?: NotesParams
  ) =>
    await this.callApi<NotesResponse>({
      url: `/notes/${addressOrEns}`,
      method: 'GET',
      params,
    });

  public getProfileByList = async (params: ListParams) =>
    await this.callApi<any>({
      url: `/profiles`,
      method: 'POST',
      requestData: params,
    });

  public getNotesByList = async (params: ListParams & NotesParams) =>
    await this.callApi<NotesResponse>({
      url: `/notes`,
      method: 'POST',
      requestData: params,
    });
  /**
   * Helper with saint defaults to perform an HTTP call.
   * @param request A request to perform.
   */
  private callApi<TResponse = any, TRequest = any>(
    request: ApiRequest<TRequest>
  ): Promise<TResponse> {
    return new Promise((resolve, reject) => {
      this.client
        .request<TResponse>({
          cancelToken: this.source.token,
          url: request.url,
          method: request.method,
          params: request.params,
          data: request.requestData,
          paramsSerializer: (params) => {
            return qs.stringify(params, { arrayFormat: 'repeat' });
          },
        })
        .then((response) =>
          response?.status && response.status >= 200 && response.status < 400
            ? resolve(response?.data)
            : reject(response?.data)
        )
        .catch((error: AxiosError) => reject(error.response ?? error.message));
    });
  }

  private useDebugLogs() {
    this.client.interceptors.request.use((config) => {
      console.info('Calling API', config.url, config.params);
      return config;
    });

    this.client.interceptors.response.use(
      (response) => {
        console.info(
          'Got response from API',
          response.config.url,
          response.data
        );
        return response;
      },
      (error: AxiosError) => {
        console.info(
          'There was an error calling API',
          error.request?.url,
          error.response?.status,
          error.message
        );
        return Promise.reject(error);
      }
    );
  }

  private useAuth(
    tokenFactory: () => Promise<string | undefined>,
    debug?: boolean
  ) {
    this.client.interceptors.request.use(async (config) => {
      const token = await tokenFactory();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else if (debug) {
        console.log(
          'No token returned by factory, skipping Authorization header'
        );
      }

      return config;
    });
  }
}
