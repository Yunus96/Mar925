import express from "express";
import { getGitHubProfile, getRepoDetails, postIssue } from '../controller/github.controller.js';
const router = express.Router();

router.get("/user-details", getGitHubProfile);

router.get("/repositories/:repoName", getRepoDetails);

router.post("/repositories/:repoName/issues", postIssue);

export default router;