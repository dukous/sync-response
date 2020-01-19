

const {
    RequestMessage,
    ResponseMessage,
    SyncContext,
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
                await client.publish(response_channel, new ResponseMessage(reqMsg.requestId, JSON.stringify({code: 0})).toMessageString());
            });

        let start = Date.now();
        let timeoutCount = 0;
        let count = 0;
        for (let i = 0; i < 100000; i++) {
             await require('util').promisify(setTimeout)(20);
             client.resp(
                new RequestMessage((861111111000001 + i).toString() + Date.now().toString(), JSON.stringify({
                    a: i,
                    b: Buffer.from('134567891234567890134567891234567890134567891234567890134567891234567890134567891234567890134567891234567890134567891234567890134567891234567890').toString('hex')})),
                10000).then((ctx) => {
                    count += 1;
                    if (ctx.responseText === 'TIMEOUT') {
                        timeoutCount += 1;
                    }
                    console.log(i + 1, count, timeoutCount, JSON.stringify(ctx));
                });
        }

        await require('util').promisify(setTimeout)(10000);
        client.dispose();

    }).timeout(6000000);

});