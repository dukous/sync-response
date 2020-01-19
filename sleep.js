
/**
 * 请求处理器
 * @callback break_cb
 * @return {boolean}
 */

/**
 *
 * @param {number} ms
 * @param {number} [count]
 * @param {break_cb} [break_cb]
 * @return {Promise<void>}
 */
async function sleep(ms, count=1, break_cb = () => { return true }) {
    return new Promise(resolve => {
        setTimeout(async () => {
            if (break_cb()) {
                resolve();
            } else {
                if (count > 1) {
                    resolve(await sleep(ms, count - 1, break_cb));
                } else {
                    resolve();
                }
            }
        }, ms);
    })
}

module.exports = sleep;