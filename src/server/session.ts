import { auth } from "@/lib/auth";

export class UnauthenticatedError extends Error {
  constructor() {
    super("User not authenticated");
  }
}

// 服务端从请求头（cookie）解析会话，等价于旧版客户端的 requireSessionUserId
export async function requireSessionUserId(headers: Headers): Promise<string> {
  const session = await auth.api.getSession({ headers });
  if (!session?.user?.id) {
    throw new UnauthenticatedError();
  }
  return session.user.id;
}

// Route Handler 统一错误响应：未登录 401，其余 500
export function errorResponse(error: unknown): Response {
  if (error instanceof UnauthenticatedError) {
    return Response.json({ error: error.message }, { status: 401 });
  }
  const message = error instanceof Error ? error.message : "Internal server error";
  return Response.json({ error: message }, { status: 500 });
}
