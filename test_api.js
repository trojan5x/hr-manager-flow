
const email = 'rahul@learntube.ai';
const validUrl = 'https://xgfy-czuw-092q.m2.xano.io/api:_s7o0tIE/user/certified_check';

async function test() {
    const url = `${validUrl}?email=${encodeURIComponent(email)}`;
    console.log(`Testing: ${url}`);
    
    try {
        const res = await fetch(url);
        console.log(`Status: ${res.status}`);
        if(res.ok) {
            const json = await res.json();
            console.log('SUCCESS BODY:', JSON.stringify(json, null, 2));
        } else {
             console.log('Fail text:', await res.text());
        }
    } catch (e) {
        console.log('Error:', e.message);
    }
}

test();
