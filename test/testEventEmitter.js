const {EventEmitter} = require('events');
let e = new EventEmitter();
async function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(()=>{
            resolve()
        }, ms)
    })
}
let i = 0;
(async ()=> {
    while (true) {
        e.once(Date.now().toString(), ()=>{

        });
        i++;
        await sleep(2);
        console.log(i);
    }
})();
