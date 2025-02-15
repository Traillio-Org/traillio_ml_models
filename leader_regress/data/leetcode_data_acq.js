const fs = require('fs');

const userDataArray = [];

async function fetchUserProfile(username) {
    try {
        const response = await fetch(`http://localhost:8081/userProfile/${username}`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        userDataArray.push(data);
        console.log("User data added:", data);
    } catch (error) {
        console.error("Error fetching user profile:", error);
    }
}

function saveDataToFile(filename) {
    fs.writeFileSync(filename, JSON.stringify(userDataArray, null, 2), 'utf8');
    console.log("User data saved to", filename);
}

function readUsernamesFromFile(filename) {
    try {
        const data = fs.readFileSync(filename, 'utf8');
        const usernames = data.split('\n').map(name => name.trim()).filter(name => name);
        
        Promise.all(usernames.map(username => fetchUserProfile(username))).then(() => {
            console.log("Final user data array:", userDataArray);
            saveDataToFile("./data/leetcode_data.json");
        });
    } catch (error) {
        console.error("Error reading usernames from file:", error);
    }
}

// Example usage
readUsernamesFromFile("./data/leetcode_users.txt");
