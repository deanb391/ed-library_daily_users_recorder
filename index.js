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

    const now = new Date(
  new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos" })
);


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

    // Weekly Active Users (End of Week: Saturday)
    let weeklyCount = null;
    if (day === "Saturday") {
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - 6);
      const weeklyUsers = await databases.listDocuments(DATABASE_ID, USER_COLLECTION, [
        Query.greaterThanEqual("lastTime", weekStart.toISOString()),
        Query.limit(1000)
      ]);
      weeklyCount = weeklyUsers.total;
      await databases.createDocument(DATABASE_ID, "weekly_users", isoDate, {
        date: isoDate,
        count: weeklyCount
      });
    }

    // Monthly Active Users (End of Month)
    let monthlyCount = null;
    const tomorrow = new Date(todayStart);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (tomorrow.getDate() === 1) {
      const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
      const monthlyUsers = await databases.listDocuments(DATABASE_ID, USER_COLLECTION, [
        Query.greaterThanEqual("lastTime", monthStart.toISOString()),
        Query.limit(1000)
      ]);
      monthlyCount = monthlyUsers.total;
      const monthName = todayStart.toLocaleString('default', { month: 'long' }) + " " + todayStart.getFullYear();
      await databases.createDocument(DATABASE_ID, "monthly_users", "unique()", {
        month: monthName,
        date: isoDate,
        count: monthlyCount
      });
    }

    return res.json({
      success: true,
      date: isoDate,
      day,
      count,
      weeklyCount,
      monthlyCount
    });

  } catch (err) {
    error(err);
    return res.json({ success: false });
  }
};
