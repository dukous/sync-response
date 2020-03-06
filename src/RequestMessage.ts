/**
 * 请求消息
 */
export class RequestMessage {

    requestId: string;
    requestText: string;
    /**
     *
     * @param {string} requestId - 请求ID
     * @param {string} requestText - 请求文本
     */
    constructor(requestId: string, requestText: string) {
        this.requestId = requestId;
        this.requestText = requestText;
    }

    /**
     * 消息字符串[requestId, requestText]
     * @return {string}
     */
    toMessageString() : string {
        return JSON.stringify([this.requestId, this.requestText]);
    }

    /**
     * 把消息字符串转换为请求消息
     * @param {string} message
     * @return {RequestMessage}
     */
    static fromMessageString(message: string) : RequestMessage {
        let array = JSON.parse(message);
        return new RequestMessage(array[0], array[1]);
    }
}