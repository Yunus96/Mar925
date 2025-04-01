import express from "express";
import { getGitHubProfile, getRepoDetails, postIssue } from '../controller/github.controller.js';
//getRepoDetails, postIssue
const router = express.Router();

router.get("/github", getGitHubProfile);
router.get("/github/:repoName", getRepoDetails);
router.post("/github/:repoName/issues", postIssue);

export default router;