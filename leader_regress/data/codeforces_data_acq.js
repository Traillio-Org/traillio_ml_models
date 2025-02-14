const fs = require('fs');
const axios = require('axios');

async function getUserSubmissions(handle) {
    try {
        const response = await axios.get(`https://codeforces.com/api/user.status?handle=${handle}`);
        if (response.data.status !== 'OK') throw new Error('Failed to fetch user submissions');

        const oneWeekAgo = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60);

        // Filter only solved problems (verdict === "OK")
        const solvedSubmissions = response.data.result.filter(submission => submission.verdict === "OK");

        // Count problems solved in the last week
        const solvedLastWeek = solvedSubmissions.filter(submission => submission.creationTimeSeconds >= oneWeekAgo).length;

        return { solvedSubmissions, solvedLastWeek };
    } catch (error) {
        console.error(`Error fetching submissions for ${handle}:`, error.message);
        return { solvedSubmissions: [], solvedLastWeek: 0 };
    }
}

async function getUserRating(handle) {
    try {
        const response = await axios.get(`https://codeforces.com/api/user.info?handles=${handle}`);
        if (response.data.status !== 'OK') throw new Error('Failed to fetch user rating');

        return response.data.result[0]?.rating || "Unrated";
    } catch (error) {
        console.error(`Error fetching rating for ${handle}:`, error.message);
        return "Unrated";
    }
}

async function getProblemRatings() {
    try {
        const response = await axios.get('https://codeforces.com/api/problemset.problems');
        if (response.data.status !== 'OK') throw new Error('Failed to fetch problem statistics');

        // Map problem ratings using `contestId+index` as key
        const problemRatings = {};
        response.data.result.problems.forEach(problem => {
            if (problem.contestId && problem.index && problem.rating) {
                const problemKey = `${problem.contestId}${problem.index}`;
                problemRatings[problemKey] = problem.rating;
            }
        });

        return problemRatings;
    } catch (error) {
        console.error('Error fetching problem ratings:', error.message);
        return {};
    }
}

async function processUsers() {
    try {
        // Read usernames from users.txt
        const usernames = fs.readFileSync('./data/codeforces_users.txt', 'utf-8').split(/\r?\n/).filter(Boolean);
        const problemRatings = await getProblemRatings();
        const results = [];

        for (const username of usernames) {
            console.log(`Fetching data for: ${username}`);
            const [{ solvedSubmissions, solvedLastWeek }, userRating] = await Promise.all([
                getUserSubmissions(username),
                getUserRating(username)
            ]);

            // Initialize user object with username, rating, and solvedLastWeek
            const userResult = { username, rating: userRating, solvedLastWeek };

            solvedSubmissions.forEach(submission => {
                const problemKey = `${submission.problem.contestId}${submission.problem.index}`;
                const rating = problemRatings[problemKey];

                if (rating) {
                    userResult[rating] = (userResult[rating] || 0) + 1;
                }
            });

            if (Object.keys(userResult).length > 3) { // Ensure user has solved problems
                results.push(userResult);
            }
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
