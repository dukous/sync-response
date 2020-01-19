const IORedis = require('ioredis');
const EventEmitter = require('events');

let cache = new Map();
let emitter = new EventEmitter();

class SyncResponseClient {

    /**
     * 请求处理器
     * @callback request_handler
     * @param {string} channel
     * @param {string} message
     */

    /**
     *
     * @param {string} request_channel - 请求通道
     * @param {string} response_channel - 响应通道
     * @param {IORedis.RedisOptions} redisOptions - Redis选项
     * @param {request_handler} request_handler - 请求处理器
     */
    constructor(request_channel, response_channel, redisOptions, request_handler) {
        this.ready = false;
        this.request_channel = request_channel;
        this.response_channel = response_channel;

        /**
         * 发布客户端
         * @type {IORedis.Redis}
         */
        this.publish_client = new IORedis(redisOptions);

        /**
         * 请求订阅客户端
         * @type {IORedis.Redis}
         */
        this.request_sub_client = new IORedis(redisOptions);
        this.request_sub_client
            .subscribe(this.request_channel)
            .then(() => {
                this.request_sub_client.on('message', (channel, message) => {
                    if (channel === this.request_channel) {
                        request_handler(channel, message);
                    }
                });
            });

        this.response_sub_client = new IORedis(redisOptions);
        this.response_sub_client
            .subscribe(this.response_channel)
            .then(() => {
                this.ready = true;
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
     *
     * @param {RequestMessage} reqMsg - 上下文
     * @param {number} [timeout=60000] - 超时时间（毫秒）
     * @return {Promise<ResponseMessage>}
     */
    async resp(reqMsg, timeout= 60000) {
        return new Promise( async resolve => {
            let start = Date.now();
            if (!this.ready) {
                await sleep(10, 100, ()=> {
                    return this.ready;
                });
            }
            cache.set(reqMsg.requestId, true);
            emitter.once(reqMsg.requestId, function (responseText) {
                if (cache.get(reqMsg.requestId)) {
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
     *
     * @param {string} channel
     * @param {string} message
     */
    publish(channel, message) {
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
            this.request_sub_client
                .unsubscribe(this.request_channel)
                .then(() => {
                    this.request_sub_client.disconnect();
                    this.request_sub_client = null;
                });
        }
        if (this.response_sub_client) {
            this.response_sub_client
                .unsubscribe(this.response_channel)
                .then(() => {
                    this.response_sub_client.disconnect();
                    this.response_sub_client = null;
                });
        }
    }
}

module.exports = SyncResponseClient;

const sleep = require('./sleep');
const RequestMessage = require('./RequestMessage');
const ResponseMessage = require('./ResponseMessage');