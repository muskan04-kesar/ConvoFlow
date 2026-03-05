const autocannon = require('autocannon');

async function runLoadTest() {
    const url = 'http://localhost:5000/health';

    console.log(`🚀 Starting load test on ${url}...`);

    const result = await autocannon({
        url,
        connections: 100, // Concurrent connections
        duration: 10,     // Test duration in seconds
        pipelining: 1,
    });

    console.log('\n--- Load Test Results ---');
    console.log(`Total Requests: ${result.requests.total}`);
    console.log(`Average Latency: ${result.latency.average} ms`);
    console.log(`Average Requests/sec: ${result.requests.average}`);
    console.log(`Total Errors: ${result.errors + result.timeouts}`);
    console.log('-------------------------\n');

    if (result.errors > 0 || result.timeouts > 0) {
        console.warn('⚠️ Warning: Errors or timeouts detected during test.');
    } else {
        console.log('✅ System handled the load perfectly.');
    }
}

runLoadTest();
