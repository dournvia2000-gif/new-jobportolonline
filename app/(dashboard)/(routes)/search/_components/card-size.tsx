"use client";

import { Job, Company } from "@prisma/client";
import { AnimatePresence, motion } from "framer-motion";
import JobCardItem from "./job-card-item";
import { fadeInOut } from "@/animations";

interface JobListProps {
  jobs: (Job & {
    company: Company;
    savedUsers?: string[];
    tags: string[];
    short_description?: string;
  })[];
  userId: string | null;
}

const JobList = ({ jobs, userId }: JobListProps) => {
  return (
    <div className="pt-6">
      <AnimatePresence>
        <motion.div
          {...fadeInOut}
          layout
          className="grid grid-cols-1 md:grid-cols-3 2xl:grid-cols-6 gap-2"
        >
          {jobs.slice(0, 3).map((job) => (
            <JobCardItem key={job.id} job={job} userId={userId} />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default JobList;