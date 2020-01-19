

const {
    sleep,
    RequestMessage,
    ResponseMessage,
    SyncResponseClient } = require('../index');

describe('index', function () {

    it('resp',  async function () {
        const cfg = require('config');

        let request_channel = Date.now().toString() + '_req';
        let response_channel = Date.now().toString() + '_resp';
        let client = new SyncResponseClient(request_channel,
            response_channel,
            cfg.get('sync_response_client.redis'),
            async (channel, message) => {
                // console.log(message);
                let reqMsg = RequestMessage.fromMessageString(message);
                await client.publish(response_channel, new ResponseMessage(reqMsg.requestId, JSON.stringify({code: 0, message: Date.now().toString(16)})).toMessageString());
            });

        let totalCount = 10000;
        let timeout = 0;
        let count = 0;
        let total = 0;
        let max = 0;
        let min = 99999;
        for (let i = 0; i < totalCount; i++) {
            setTimeout( () => {
                client.resp(
                    new RequestMessage((861111111000001 + i).toString() + Date.now().toString(), JSON.stringify({
                        a: i,
                        b: Buffer.from('hello').toString('hex')})),
                    10000).then((respMsg) => {
                    count += 1;
                    if (respMsg.responseText === 'TIMEOUT') {
                        timeout += 1;
                    } else {
                        total += respMsg.responseTime;
                        max = max > respMsg.responseTime ? max : respMsg.responseTime;
                        min = min < respMsg.responseTime ? min : respMsg.responseTime;
                    }
                    console.log(i + 1, count, JSON.stringify({ timeout, max, min, avg: (total / count).toFixed(2) }), respMsg.responseTime, respMsg.responseText);
                });
            }, i * 5);
        }
        await sleep(10, 1000000, () => { return count >= totalCount; });
        console.log('end');
        client.dispose();

    }).timeout(6000000);

});