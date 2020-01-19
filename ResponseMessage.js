
class ResponseMessage {
    /**
     *
     * @param requestId
     * @param responseText
     * @param {number} [responseTime=0]
     */
    constructor(requestId, responseText, responseTime) {
        this.requestId = requestId;
        this.responseText = responseText;
        this.responseTime = responseTime ? responseTime : 0;
    }

    toMessageString() {
        return JSON.stringify([this.requestId, this.responseText]);
    }

    /**
     *
     * @param message
     * @return {ResponseMessage}
     */
    static fromMessageString(message) {
        let array = JSON.parse(message);
        return new ResponseMessage(array[0], array[1]);
    }
}

module.exports = ResponseMessage;