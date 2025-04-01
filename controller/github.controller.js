import axios from 'axios';
import redisClient from '../redisClient.js';

const GITHUB_API = `https://api.github.com/users/${process.env.GITHUB_USERNAME}`;
const CACHE_TTL = 600; // 10 minutes

const getGitHubProfile =  async (req, res) => {
    try {
        const cacheKey = `github:${process.env.GITHUB_USERNAME}`;

        // Check Redis Cache
        const cachedData = await redisClient.get(cacheKey);
        console.log(cachedData == null)

        if (cachedData == null) {
            // Fetch Data from GitHub API
            const [followersRes, followingRes, reposRes] = await Promise.all([
                axios.get(`${GITHUB_API}/followers`),
                axios.get(`${GITHUB_API}/following`),
                axios.get(`${GITHUB_API}/repos?per_page=100`)
            ]);

            const githubData = {
                username: process.env.GITHUB_USERNAME,
                followers: followersRes.data.length,
                following: followingRes.data.length,
                repositories: reposRes.data.map(repo => ({
                    name: repo.name,
                    url: repo.html_url,
                    stars: repo.stargazers_count
                }))
            };

            // Store Data in Redis (Expire in 10 Minutes)
            await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(githubData));

            res.set("X-Cache", "Miss").json(githubData);
        } else {
            return res.json(JSON.parse(cachedData)); // Return Cached Data
        }
    } catch (error) {
        console.error("GitHub API Error:", error.message);
        res.status(500).json({ message: "Error fetching GitHub data" });
    }
};

export {getGitHubProfile }