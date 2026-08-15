import { errorResponse, requireSessionUserId } from "@/src/server/session";
import { getUsageSummaryForUser } from "@/src/server/usage";

// tzOffset 为浏览器的 Date.getTimezoneOffset()（分钟，UTC 以西为正），用于本地时区月度分桶
export async function GET(request: Request) {
  try {
    const userId = await requireSessionUserId(request.headers);

    const rawOffset = Number(new URL(request.url).searchParams.get("tzOffset") ?? "0");
    const tzOffset = Number.isFinite(rawOffset) ? Math.trunc(Math.min(840, Math.max(-840, rawOffset))) : 0;

    return Response.json(await getUsageSummaryForUser(userId, tzOffset));
  }
  catch (error) {
    return errorResponse(error);
  }
}
