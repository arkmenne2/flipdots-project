require('dotenv').config();

module.exports = {
    slack: {
        // Never commit real tokens. Read from environment only.
        botToken: process.env.SLACK_BOT_TOKEN || '',
        signingSecret: process.env.SLACK_SIGNING_SECRET || '',
        port: process.env.PORT || 3000
    },
    github: {
        token: process.env.GITHUB_TOKEN || ''
    }
};
