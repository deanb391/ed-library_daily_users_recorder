const { Client, Databases, Query } = require("node-appwrite");

module.exports = async ({ req, res, log, error }) => {
  try {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);

    const DATABASE_ID = "69617e75000c6c010a75";
    const USER_COLLECTION = "user";
    const DAILY_COLLECTION = "daily_users";

    const now = new Date();

    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0, 0, 0, 0
    );

    const isoDate = todayStart.toISOString().split("T")[0];

    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday"
    ];

    const day = days[todayStart.getDay()];

    const activeUsers = await databases.listDocuments(
      DATABASE_ID,
      USER_COLLECTION,
      [
        Query.greaterThanEqual("lastTime", todayStart.toISOString()),
        Query.limit(1000)
      ]
    );

    const count = activeUsers.total;

    await databases.createDocument(
      DATABASE_ID,
      DAILY_COLLECTION,
      isoDate,
      {
        date: isoDate,
        day: day,
        count: count
      }
    );

    return res.json({
      success: true,
      date: isoDate,
      day,
      count
    });

  } catch (err) {
    error(err);
    return res.json({ success: false });
  }
};
