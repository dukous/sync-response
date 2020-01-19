
class RequestMessage {
    constructor(requestId, requestText) {
        this.requestId = requestId;
        this.requestText = requestText;
    }

    toMessageString() {
        return JSON.stringify([this.requestId, this.requestText]);
    }

    static fromMessageString(message) {
        let array = JSON.parse(message);
        return new RequestMessage(array[0], array[1]);
    }
}

module.exports = RequestMessage;