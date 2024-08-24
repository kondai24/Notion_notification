const { Client } = require('@notionhq/client');
const axios = require('axios');

// 環境変数からNotionとSlackのAPIキーを取得
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;

// NotionデータベースID
const databaseId = process.env.NOTION_DATABASE_ID;

(async () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Notionのデータベースからタスクを取得
    const response = await notion.databases.query({
        database_id: databaseId,
        filter: {
            and: [
                {
                    property: '期限',
                    date: {
                        on_or_before: tomorrow.toISOString(),
                    },
                },
                {
                    property: 'Done',
                    checkbox: {
                        equals: false,
                    },
                },
            ],
        },
    });

    // タスクをSlackに送信
    const tasks = response.results.map(page => {
        const titleName = "タスク名"
        const title = page.properties[titleName].title[0].plain_text;
        const deadlineName = "期限"
        const deadline = new Date(page.properties[deadlineName].date.start).toLocaleDateString();
        return `• ${title} : (期限: ${deadline})`;
    });

    if (tasks.length > 0) {
        const message = `明日までの未完了タスク:\n${tasks.join('\n')}`;
        await axios.post(slackWebhookUrl, { text: message });
    }
})();
