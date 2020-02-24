/**
 * 请求消息
 */
class RequestMessage {
    /**
     *
     * @param {string} requestId - 请求ID
     * @param {string} requestText - 请求文本
     */
    constructor(requestId, requestText) {
        this.requestId = requestId;
        this.requestText = requestText;
    }

    /**
     * 消息字符串[requestId, requestText]
     * @return {string}
     */
    toMessageString() {
        return JSON.stringify([this.requestId, this.requestText]);
    }

    /**
     *
     * @param {string} message
     * @return {RequestMessage}
     */
    static fromMessageString(message) {
        let array = JSON.parse(message);
        return new RequestMessage(array[0], array[1]);
    }
}

module.exports = RequestMessage;
