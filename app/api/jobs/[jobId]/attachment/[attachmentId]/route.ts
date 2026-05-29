import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { utapi } from "@/server/delete";

export async function DELETE(
  req: Request,
  {
    params,
  }: {
    // 1. Update the type definition: params is now a Promise
    params: Promise<{
      jobId: string;
      attachmentId: string;
    }>;
  }
) {
  try {
    // Get authenticated user
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", {
        status: 401,
      });
    }

    // 2. Await the params Promise before accessing its properties
    const { jobId, attachmentId } = await params;

    if (!jobId || !attachmentId) {
      return new NextResponse("Missing parameters", {
        status: 400,
      });
    }

    // Find attachment
    const attachment = await db.attachment.findUnique({
      where: {
        id: attachmentId,
      },
    });

    if (!attachment) {
      return new NextResponse("Attachment not found", {
        status: 404,
      });
    }

    // Optional security check
    if (attachment.jobId !== jobId) {
      return new NextResponse("Invalid attachment", {
        status: 403,
      });
    }

    // Delete file from UploadThing
    try {
      const fileKey = attachment.url.split("/").pop();

      if (fileKey) {
        await utapi.deleteFiles(fileKey);
        console.log("UploadThing file deleted successfully");
      }
    } catch (error) {
      console.error("UploadThing delete error:", error);
      return new NextResponse("Failed to delete UploadThing file", {
        status: 500,
      });
    }

    // Delete database record
    await db.attachment.delete({
      where: {
        id: attachmentId,
      },
    });

    return new NextResponse("Attachment deleted successfully", {
      status: 200,
    });
  } catch (error) {
    console.error("[ATTACHMENT_DELETE_ERROR]", error);
    return new NextResponse("Internal Server Error", {
      status: 500,
    });
  }
}