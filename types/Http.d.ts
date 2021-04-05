import { AxiosInstance, Method } from 'axios';
import { JsonApiResponse } from './interfaces/JsonApi';
import { ResultResponse } from './interfaces/ResultResponse';
import { IToken } from './interfaces/Token';
export default class Http {
    host: string;
    axios: AxiosInstance;
    constructor(host?: string);
    protected spreeResponse<ResponseType = JsonApiResponse>(method: Method, url: string, tokens?: IToken, params?: any): Promise<ResultResponse<ResponseType>>;
    /**
     * The HTTP error code returned by Spree is not indicative of its response shape.
     * This function determines the information provided by Spree and uses everything available.
     */
    private classifySpreeError;
    private processError;
    private processSpreeError;
    private spreeOrderHeaders;
}
