const fs = require('fs');
const axios = require('axios');

async function getUserSubmissions(handle) {
    try {
        const response = await axios.get(`https://codeforces.com/api/user.status?handle=${handle}`);
        if (response.data.status !== 'OK') throw new Error('Failed to fetch user submissions');
        return response.data.result;
    } catch (error) {
        console.error(`Error fetching submissions for ${handle}:`, error.message);
        return [];
    }
}

async function getProblemStatistics() {
    try {
        const response = await axios.get('https://codeforces.com/api/problemset.problems');
        if (response.data.status !== 'OK') throw new Error('Failed to fetch problem statistics');

        // Map problem statistics using `contestId+index` as key
        const problemStats = {};
        response.data.result.problems.forEach((problem, index) => {
            if (problem.contestId && problem.index) {
                const problemKey = `${problem.contestId}${problem.index}`;
                problemStats[problemKey] = response.data.result.problemStatistics[index];
            }
        });

        return problemStats;
    } catch (error) {
        console.error('Error fetching problem statistics:', error.message);
        return {};
    }
}

async function processUsers() {
    try {
        // Read usernames from users.txt
        const usernames = fs.readFileSync('./data/codeforces_users.txt', 'utf-8').split(/\r?\n/).filter(Boolean);
        const problemStats = await getProblemStatistics();
        const results = [];

        for (const username of usernames) {
            console.log(`Fetching submissions for: ${username}`);
            const submissions = await getUserSubmissions(username);

            // Map submissions to include problem statistics
            const processedSubmissions = submissions.map(submission => {
                const problemKey = `${submission.problem.contestId}${submission.problem.index}`;
                return {
                    user: username,
                    problem: submission.problem,
                    verdict: submission.verdict,
                    programmingLanguage: submission.programmingLanguage,
                    submissionTime: submission.creationTimeSeconds,
                    problemStatistics: problemStats[problemKey] || null,
                };
            });

            results.push(...processedSubmissions);
        }

        // Save results to a JSON file
        fs.writeFileSync('./data/codeforces_data.json', JSON.stringify(results, null, 2));
        console.log('Results saved to results.json');
    } catch (error) {
        console.error('Error processing users:', error.message);
    }
}

// Run the function
processUsers();
