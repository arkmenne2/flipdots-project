require('dotenv').config();

module.exports = {
    slack: {
        botToken: process.env.SLACK_BOT_TOKEN || 'xapp-1-A09H2EVHB4J-9593883263681-8391448d646940b17c0002fc472e933fa5d787874255a9db3b708b4b676bbc72',
        signingSecret: process.env.SLACK_SIGNING_SECRET || 'PASTE_YOUR_SIGNING_SECRET_HERE',
        port: process.env.PORT || 3000
    },
    github: {
        token: process.env.GITHUB_TOKEN || null
    }
};
