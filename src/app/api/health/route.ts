import { db } from "@/src/lib/db";

export async function GET() {
  const startTime = Date.now();

  try {
    await db.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - startTime;

    const [feedCount, postCount] = await Promise.all([
      db.feed.count(),
      db.post.count(),
    ]);

    return Response.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: {
          status: "up",
          latency: `${dbLatency}ms`,
          stats: {
            feeds: feedCount,
            posts: postCount,
          },
        },
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return Response.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        checks: {
          database: {
            status: "down",
            error: errorMessage,
          },
        },
      },
      { status: 503 }
    );
  }
}
