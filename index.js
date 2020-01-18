
const IORedis = require('ioredis');
const EventEmitter = require('events');

let cache = new Map();
let emitter = new EventEmitter();

class SyncContext {
    /**
     *
     * @param {string} owner
     * @param {string} requestId
     * @param {string} requestText
     * @param {string} [responseText]
     * @param {number} [responseTime]
     */
    constructor(owner, requestId, requestText, responseText, responseTime) {
        this.owner = owner;
        this.requestId = requestId;
        this.requestText = requestText;
        this.responseText = responseText;
        this.responseTime = responseTime;
    }

    /**
     *
     * @return {string}
     */
    toRequestMessage() {
        return JSON.stringify([this.owner, this.requestId, this.requestText]);
    }

    /**
     *
     * @return {string}
     */
    toResponseMessage() {
        return JSON.stringify([this.owner, this.requestId, this.responseText]);
    }

    /**
     *
     * @param {string} message
     * @return {SyncContext}
     */
    static fromRequestMessage(message) {
        let array = JSON.parse(message);
        return new SyncContext(array[0], array[1], array[2]);
    }

    /**
     *
     * @param {string} message
     * @return {SyncContext}
     */
    static fromResponseMessage(message) {
        let array = JSON.parse(message);
        return new SyncContext(array[0], array[1], '', array[2]);
    }
}

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
     * @param {IORedis.RedisOptions} redisOptions
     * @param {request_handler} request_handler - 请求处理器
     */
    constructor(request_channel, response_channel, redisOptions, request_handler) {
        this.request_channel = request_channel;
        this.response_channel = response_channel;

        this.sub_count = 0;

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
            .then(()=>{
                this.sub_count++;
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
                this.sub_count++;
                this.response_sub_client.on('message', async (channel, message) => {
                    if (channel === this.response_channel) {
                        let dto = SyncContext.fromResponseMessage(message);
                        let key = `${dto.owner}_${dto.requestId}`;
                        let ctx = cache.get(key);
                        if (ctx) {
                            ctx.responseText = dto.responseText;
                            ctx.responseTime = Date.now() - ctx.responseTime;
                            cache.set(message, ctx);
                            emitter.emit(key);
                        }
                    }
                });
            });
    }

    /**
     *
     * @param {SyncContext} ctx - 上下文
     * @param {number} [timeout=60000] - 超时时间（毫秒）
     * @return {Promise<SyncContext>}
     */
    async resp(ctx, timeout= 60000) {
        return new Promise( async resolve => {
            if (this.sub_count < 2) {
                await require('util').promisify(setTimeout)(50);
                if (this.sub_count < 2) {
                    ctx.responseText = 'WAITING';
                    ctx.responseTime = 0;
                    resolve(ctx);
                }
            }
            let key = `${ctx.owner}_${ctx.requestId}`;
            ctx.responseTime = Date.now();
            cache.set(key, ctx);
            emitter.once(key, function () {
                let ctx = cache.get(key);
                if (ctx) {
                    resolve(ctx);
                    cache.delete(key);
                }
            });
            this.publish(this.request_channel, ctx.toRequestMessage());
            setTimeout(() => {
                ctx.responseText = 'TIMEOUT';
                ctx.responseTime = timeout;
                resolve(ctx);
                cache.delete(key);
            }, timeout);
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
            this.request_sub_client.disconnect();
            this.request_sub_client = null;
        }
        if (this.response_sub_client) {
            this.response_sub_client.disconnect();
            this.response_sub_client = null;
        }
    }
}

module.exports = {
    SyncContext,
    SyncResponseClient
};