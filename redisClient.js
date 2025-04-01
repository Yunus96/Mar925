import Redis from 'redis';
import dotenv from 'dotenv'


dotenv.config(
    {path: './.env'}
)

const redisClient = Redis.createClient({
    url: process.env.REDIS_URL
});

redisClient.on('connect', () => console.log('🔄 Connected to Redis Cloud'));
redisClient.on('error', (err) => console.error('❌ Redis Error:', err));

redisClient.connect()
    .catch(err => console.error('Redis Connection Failed:', err));

export default redisClient;