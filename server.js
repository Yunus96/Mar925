require('dotenv').config();
const express = require('express');
const axios = require('axios');
const redisClient = require('./redisClient');

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 5000;

const GITHUB_API = `https://api.github.com/users/${process.env.GITHUB_USERNAME}`;
const CACHE_TTL = 600; // 10 minutes

app.get('/github', async (req, res) => {
    try {
        const cacheKey = `github:${process.env.GITHUB_USERNAME}`;

        // Check Redis Cache
        const cachedData = await redisClient.get(cacheKey);
        console.log(cachedData)
        if (cachedData != null) {
            return res.json(JSON.parse(cachedData)); // Return Cached Data
        } else {
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
        }
    } catch (error) {
        console.error("GitHub API Error:", error.message);
        res.status(500).json({ message: "Error fetching GitHub data" });
    }
});

// Endpoint to get details of a specific repository
app.get('/github/:repoName', async (req, res) => {
    try {
        const { repoName } = req.params;
        
        const cacheKey = `github-repo:${process.env.GITHUB_USERNAME}:${repoName}`;
    
        // Check Redis Cache
        const cachedData = await redisClient.get(cacheKey);
        
        if (cachedData == null) {
            // Fetch repo details from GitHub API
            const repoRes = await axios.get(`https://api.github.com/repos/${process.env.GITHUB_USERNAME}/${repoName}`);
            //console.log(repoRes)

            const repoData = {
                name: repoRes.data.name,
                description: repoRes.data.description,
                url: repoRes.data.html_url,
                stars: repoRes.data.stargazers_count,
                forks: repoRes.data.forks_count,
                language: repoRes.data.language,
                created_at: repoRes.data.created_at,
                updated_at: repoRes.data.updated_at,
                cached: "false"
            };

            // Store Data in Redis (Expire in 10 Minutes)
            await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(repoData));

            res.json(repoData);
        } else {
             return res.json(JSON.parse(cachedData)); // Return Cached Data
        }
    } catch (error) {
        console.error("GitHub API Error:", error.message);
        res.status(500).json({ message: "Error fetching repository details" });
    }
});

// Endpoint to create an issue in a GitHub repository
app.post('/github/:repoName/issues', async (req, res) => {
    try {
        const { repoName } = req.params;
        const { title, body } = req.body;
        console.log(req.body)
        if (!title || !body) {
            return res.status(400).json({ message: "Title and body are required" });
        }

        const response = await axios.post(
            `https://api.github.com/repos/${process.env.GITHUB_USERNAME}/${repoName}/issues`,
            { title, body },
            {
                headers: {
                    Authorization: `token ${process.env.GITHUB_TOKEN}`,
                    Accept: "application/json"
                }
            }
        );

        res.json({
            message: "Issue created successfully",
            issue_url: response.data.html_url
        });
    } catch (error) {
        console.error("GitHub API Error:", error.response?.data || error.message);
        res.status(500).json({ message: "Error creating GitHub issue", error: error.response?.data });
    }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
