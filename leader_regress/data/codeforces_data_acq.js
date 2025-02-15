const fs = require('fs');
const axios = require('axios');

async function getUserSubmissions(handle) {
    try {
        const response = await axios.get(`https://codeforces.com/api/user.status?handle=${handle}`);
        if (response.data.status !== 'OK') throw new Error('Failed to fetch user submissions');

        // Filter only solved problems (verdict === "OK")
        return response.data.result.filter(submission => submission.verdict === "OK");
    } catch (error) {
        console.error(`Error fetching submissions for ${handle}:`, error.message);
        return [];
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
        const oneWeekAgo = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60; // Timestamp for 7 days ago

        for (const username of usernames) {
            console.log(`Fetching data for: ${username}`);
            const [submissions, userRating] = await Promise.all([
                getUserSubmissions(username),
                getUserRating(username)
            ]);

            let solvedLastWeek = 0;
            const difficultyCounts = {
                easy: 0,
                medium: 0,
                hard: 0
            };

            submissions.forEach(submission => {
                const problemKey = `${submission.problem.contestId}${submission.problem.index}`;
                const rating = problemRatings[problemKey];

                if (rating) {
                    if (rating >= 800 && rating <= 1000) {
                        difficultyCounts.easy++;
                    } else if (rating > 1000 && rating <= 1400) {
                        difficultyCounts.medium++;
                    } else if (rating > 1400) {
                        difficultyCounts.hard++;
                    }
                }

                if (submission.creationTimeSeconds >= oneWeekAgo) {
                    solvedLastWeek++;
                }
            });

            if (difficultyCounts.easy > 0 || difficultyCounts.medium > 0 || difficultyCounts.hard > 0 || solvedLastWeek > 0) {
                // Construct ordered object
                const orderedResult = { username, rating: userRating };

                // Add difficulty counts
                if (difficultyCounts.easy > 0) orderedResult.easy = difficultyCounts.easy;
                if (difficultyCounts.medium > 0) orderedResult.medium = difficultyCounts.medium;
                if (difficultyCounts.hard > 0) orderedResult.hard = difficultyCounts.hard;

                // Add solved problems count in the last week
                orderedResult.solvedLastWeek = solvedLastWeek;

                results.push(orderedResult);
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
