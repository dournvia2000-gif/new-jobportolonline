"use client";

import { Job, Company } from "@prisma/client";
import PageContent from "../../../search/_components/page-content";

interface JobTabContentProps {
  jobs: (Job & {
    company: Company;
    savedUsers?: string[];
    tags: string[];
    short_description?: string;
  })[];
  userId: string | null;
}

const JobTabContent = ({ jobs, userId }: JobTabContentProps) => {
  return <PageContent jobs={jobs} userId={userId} />;
};

export default JobTabContent;