
const IORedis = require('ioredis');
const EventEmitter = require('events');

let cache = new Map();
let emitter = new EventEmitter();

import { Redis, RedisOptions } from 'ioredis';

interface request_handler {
    (channel: string, message: string):void
}

/**
 * 同步响应客户端
 */
export class SyncResponseClient {

    /**
     * 请求处理器
     * @callback request_handler
     * @param {string} channel
     * @param {string} message
     */

    private readonly request_channel: string;
    private readonly response_channel: string;
    private publish_client: Redis;
    private request_sub_client_ready: boolean;
    private request_sub_client: Redis;
    private response_sub_client_ready: boolean;
    private response_sub_client: Redis;

    /**
     *
     * @param {string} request_channel - 请求通道
     * @param {string} response_channel - 响应通道
     * @param {RedisOptions} redisOptions - Redis选项
     * @param {request_handler} request_handler - 请求处理器
     */
    constructor(request_channel: string, response_channel: string, redisOptions: RedisOptions, request_handler) {
        this.request_channel = request_channel;
        this.response_channel = response_channel;

        /**
         * 发布客户端
         * @type {Redis}
         */
        this.publish_client = new IORedis(redisOptions);

        /**
         * 发布客户端是否已准备好
         * @private
         * @type {boolean}
         */
        this.request_sub_client_ready = false;
        /**
         * 请求订阅客户端
         * @private
         * @type {Redis}
         */
        this.request_sub_client = new IORedis(redisOptions);
        this.request_sub_client
            .subscribe(this.request_channel)
            .then(() => {
                this.request_sub_client_ready = true;
                this.request_sub_client.on('message', (channel, message) => {
                    if (channel === this.request_channel) {
                        request_handler(channel, message);
                    }
                });
            });

        /**
         * 请求订阅客户端是否已准备好
         * @private
         * @type {boolean}
         */
        this.response_sub_client_ready = false;
        /**
         * 响应订阅客户端
         * @private
         * @type {Redis}
         */
        this.response_sub_client = new IORedis(redisOptions);
        this.response_sub_client
            .subscribe(this.response_channel)
            .then(() => {
                this.response_sub_client_ready = true;
                this.response_sub_client.on('message', async (channel, message) => {
                    if (channel === this.response_channel) {
                        let respMsg = ResponseMessage.fromMessageString(message);
                        if (cache.get(respMsg.requestId)) {
                            emitter.emit(respMsg.requestId, respMsg.responseText);
                        }
                    }
                });
            });
    }

    /**
     * 是否已准备好
     * @return {boolean}
     */
    get ready() {
        return this.request_sub_client_ready && this.response_sub_client_ready;
    }

    /**
     * 获取响应
     * @param {RequestMessage} reqMsg - 请求消息
     * @param {number} [timeout=60000] - 超时时长（毫秒）
     * @return {Promise<ResponseMessage>}
     */
    async resp(reqMsg: RequestMessage, timeout: number = 60000) {
        return new Promise( async resolve => {
            let start = Date.now();
            if (!this.ready) {
                await sleep(10, 100, () => {
                    return this.ready;
                });
            }
            cache.set(reqMsg.requestId, true);
            emitter.once(reqMsg.requestId, function (responseText) {
                if (cache.get(reqMsg.requestId)) {
                    cache.delete(reqMsg.requestId);
                    resolve(new ResponseMessage(reqMsg.requestId, responseText, (Date.now() - start)));
                }
            });
            this.publish(this.request_channel, reqMsg.toMessageString());
            await sleep(timeout);
            cache.delete(reqMsg.requestId);
            resolve(new ResponseMessage(reqMsg.requestId, 'TIMEOUT', timeout));
        });
    }

    /**
     * 发布消息
     * @param {string} channel - 通道
     * @param {string} message - 消息
     */
    publish(channel: string, message: string) {
        this.publish_client.publish(channel, message);
    }

    /**
     * 释放资源
     */
    dispose() {
        if (this.publish_client) {
            this.publish_client.disconnect();
            this.publish_client = null;
        }
        if (this.request_sub_client) {
            this.request_sub_client_ready = false;
            this.request_sub_client
                .unsubscribe(this.request_channel)
                .then(() => {
                    this.request_sub_client.disconnect();
                    this.request_sub_client = null;
                });
        }
        if (this.response_sub_client) {
            this.response_sub_client_ready = false;
            this.response_sub_client
                .unsubscribe(this.response_channel)
                .then(() => {
                    this.response_sub_client.disconnect();
                    this.response_sub_client = null;
                });
        }
    }
}

import {sleep} from './sleep';
import {RequestMessage} from './RequestMessage';
import {ResponseMessage} from './ResponseMessage';
