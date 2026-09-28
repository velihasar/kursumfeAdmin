import { NextRequest, NextResponse } from "next/server";

const rawMinioUrl =
  process.env.MINIO_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_MINIO_URL ||
  "http://217.195.207.219:9000";
const MINIO_URL = rawMinioUrl.replace(/\/+$/, "");

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const pathSegments = resolvedParams?.path || [];
    const filePath = pathSegments.join("/");

    if (!filePath) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const targetUrl = `${MINIO_URL}/${filePath}`;

    // Fetch from MinIO without forwarding browser session cookies or extra headers
    const minioResponse = await fetch(targetUrl, {
      method: "GET",
      cache: "no-store",
    });

    if (!minioResponse.ok) {
      return new NextResponse(minioResponse.statusText, {
        status: minioResponse.status,
      });
    }

    const contentType =
      minioResponse.headers.get("content-type") || "application/octet-stream";
    const body = await minioResponse.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (error: any) {
    console.error("MinIO proxy error for /minio-storage:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
