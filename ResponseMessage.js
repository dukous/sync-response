/**
 * 响应消息
 */
class ResponseMessage {
    /**
     *
     * @param {string} requestId - 请求ID
     * @param {string} responseText - 响应文本
     * @param {number} [responseTime=0] - 响应时长(毫秒)
     */
    constructor(requestId, responseText, responseTime) {
        this.requestId = requestId;
        this.responseText = responseText;
        this.responseTime = responseTime ? responseTime : 0;
    }

    /**
     * 消息字符串[requestId,responseText]
     * @return {string}
     */
    toMessageString() {
        return JSON.stringify([this.requestId, this.responseText]);
    }

    /**
     *
     * @param {string} message
     * @return {ResponseMessage}
     */
    static fromMessageString(message) {
        let array = JSON.parse(message);
        return new ResponseMessage(array[0], array[1]);
    }
}

module.exports = ResponseMessage;
