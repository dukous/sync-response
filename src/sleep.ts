/**
 * 请求处理器
 * @callback break_cb
 * @return {boolean}
 */

interface break_cb {
    ():boolean
}

/**
 * 睡眠
 * @param {number} ms - 时长(毫秒)
 * @param {number} [count] - 执行次数
 * @param {break_cb} [break_cb] - 跳出回调
 * @return {Promise<void>}
 */
async function sleep(ms: number, count: number = 1, break_cb = () => true) {
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

export {
    sleep
};