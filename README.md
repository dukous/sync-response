```javascript
const cfg = require('config');
let request_channel = Date.now().toString() + '_req';
let response_channel = Date.now().toString() + '_resp';
let client = new SyncResponseClient(request_channel,
    response_channel,
    cfg.get('sync_response_client.redis'),
    async (channel, message) => {
        let reqMsg = RequestMessage.fromMessageString(message);
        await client.publish(response_channel, new ResponseMessage(reqMsg.requestId, JSON.stringify({code: 0, message: Date.now().toString(16)})).toMessageString());
    });
client.resp(
    new RequestMessage('861111111000001' + Date.now().toString(),
        JSON.stringify({
            a: 1,
            b: Buffer.from('hello').toString('hex')})), 1000)
    .then((respMsg) => {
        console.log(respMsg);
    });
```
