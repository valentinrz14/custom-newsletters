import { db } from "@/src/lib/db";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const post = await db.post.update({
      where: { id: postId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return Response.json({ ok: true, post });
  } catch (error) {
    return Response.json(
      { ok: false, error: "Failed to mark post as read" },
      { status: 500 }
    );
  }
}
