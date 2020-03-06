/**
 * 响应消息
 */
export class ResponseMessage {

    requestId: string;
    responseText: string;
    responseTime: number;

    /**
     *
     * @param {string} requestId - 请求ID
     * @param {string} responseText - 响应文本
     * @param {number} [responseTime=0] - 响应时长(毫秒)
     */
    constructor(requestId: string, responseText: string, responseTime?: number) {
        this.requestId = requestId;
        this.responseText = responseText;
        this.responseTime = responseTime ? responseTime : 0;
    }

    /**
     * 消息字符串[requestId,responseText]
     * @return {string}
     */
    toMessageString() : string {
        return JSON.stringify([this.requestId, this.responseText]);
    }

    /**
     * 把消息字符串转换为响应消息
     * @param {string} message
     * @return {ResponseMessage}
     */
    static fromMessageString(message: string) : ResponseMessage {
        let array = JSON.parse(message);
        return new ResponseMessage(array[0], array[1]);
    }
}
