import express from "express";
import { getGitHubProfile, getRepoDetails, postIssue } from "../controllers/github.controller";

const router = express.Router();

router.get("/github", getGitHubProfile);
router.get("/github/:repoName", getRepoDetails);
router.post("/github/:repoName/issues", postIssue);

module.exports = router;