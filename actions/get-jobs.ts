import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { Job, Company, Category, Attachment } from "@prisma/client";

export type JobWithRelations = Job & {
  company: Company | null;
  category: Category | null;
  attachments: Attachment[];
};

type GetJobs = {
  title?: string;
  categoryId?: string;
  createdAtFilter?: string;
  shiftTiming?: string;
  workMode?: string;
  yearsOfExperience?: string;
  savedJobs?: boolean;
};

const getJobs = async ({
  title,
  categoryId,
  createdAtFilter,
  shiftTiming,
  workMode,
  yearsOfExperience,
  savedJobs,
}: GetJobs): Promise<JobWithRelations[]> => {
  const { userId } = await auth();

  try {
    const whereClause: any = {
      isPusblished: true, // Note: Fix typo in 'isPusblished' to 'isPublished' if applicable
    };

    // Title & Category
    if (title || categoryId) {
      whereClause.AND = [
        title && {
          title: {
            contains: title,
            mode: "insensitive",
          },
        },
        categoryId && {
          categoryId: categoryId,
        },
      ].filter(Boolean);
    }

    // Created At Filter
    if (createdAtFilter) {
      const currentDate = new Date();
      let startDate: Date;

      switch (createdAtFilter) {
        case "today":
          startDate = new Date(currentDate);
          break;
        case "yesterday":
          startDate = new Date(currentDate);
          startDate.setDate(startDate.getDate() - 1);
          break;
        case "thisWeek":
          startDate = new Date(currentDate);
          startDate.setDate(startDate.getDate() - currentDate.getDay());
          break;
        case "lastWeek":
          startDate = new Date(currentDate);
          startDate.setDate(startDate.getDate() - currentDate.getDay() - 7);
          break;
        case "thisMonth":
          startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          break;
        default:
          startDate = new Date(0);
      }

      whereClause.createdAt = {
        gte: startDate,
      };
    }

    // Shift Timing
    if (typeof shiftTiming === "string" && shiftTiming) {
      const timings = shiftTiming.split(",").map((t) => t.trim()).filter(Boolean);
      if (timings.length > 0) {
        whereClause.shiftTiming = { in: timings };
      }
    }

    // Work Mode
    if (typeof workMode === "string" && workMode) {
      const modes = workMode.split(",").map((m) => m.trim()).filter(Boolean);
      if (modes.length > 0) {
        whereClause.workMode = { in: modes };
      }
    }

    // Years of Experience
    if (typeof yearsOfExperience === "string" && yearsOfExperience) {
      const years = yearsOfExperience.split(",").map((y) => y.trim()).filter(Boolean);
      if (years.length > 0) {
        whereClause.yearsOfExperience = { in: years };
      }
    }

    // Saved Jobs filter
    if (savedJobs && userId) {
      whereClause.savedUsers = {
        has: userId,
      };
    }

    // Fetch jobs with relations
    const jobs = await db.job.findMany({
      where: whereClause,
      include: {
        company: true,
        category: true,
        attachments: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return jobs;
  } catch (error) {
    console.error("[GET_JOBS_ERROR]:", error);
    return [];
  }
};

export default getJobs;