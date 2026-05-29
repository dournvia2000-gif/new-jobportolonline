"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Company, Job } from "@prisma/client";
import axios from "axios";
import { Loader2, Plus } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import toast from "react-hot-toast";
import TabContentSection from "./tab-content-section";

interface CompanyDetailContentPageProps {
  userId: string | null;
  jobId?: string;
  company: Company & { followers?: string[] }; // Include followers explicitly
  
  jobs: (Job & {
    company: Company;
    savedUsers?: string[];
    tags: string[];
    short_description?: string;
  })[];
}

const CompanyDetailContentPage = ({ userId, company, jobs }: CompanyDetailContentPageProps) => {
  const isFollower = userId && company.followers?.includes(userId) || false;
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const onClickAddRemoveFollower = async () => {
    try {
      setIsLoading(true);
      if (isFollower) {
        await axios.patch(`/api/companies/${company.id}/removeFollower`);
        toast.success("Unfollowed");
      } else {
        await axios.patch(`/api/companies/${company.id}/addFollower`);
        toast.success("Following");
      }
      router.refresh();
    } catch (error: unknown) {
      let errorMessage = "An error occurred. Please try again.";
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || error.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }
      console.error("Error following/unfollowing company:", error);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full rounded-2xl bg-white p-4 h-52 z-50 -mt-8">
      <div className="flex-col w-full px-4">
        {/* Company Details */}
        <div className="w-full flex items-center justify-between -mt-12">
          <div className="flex items-end justify-end space-x-4">
            {company.logo && (
              <div className="aspect-square w-auto bg-white h-32 rounded-2xl border flex items-center justify-center relative">
                <Image
                  width={120}
                  height={120}
                  alt={company.name || "Company logo"}
                  src={company.logo}
                  className="object-contain"
                />
              </div>
            )}
            {/* Name, content, etc. */}
            <div className="flex-col space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-sans font-bold text-neutral-700 capitalize">
                  {company.name || "Unknown Company"}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {`(${company.followers?.length || 0}) following`}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                {company.description || "Leveraging Technology to Provide Better Services"}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="border px-2 py-1 text-sm text-muted-foreground whitespace-nowrap rounded-lg">
                  Management Consulting
                </p>
                <p className="border px-2 py-1 text-sm text-muted-foreground whitespace-nowrap rounded-lg">
                  IT Services & Consulting
                </p>
                <p className="border px-2 py-1 text-sm text-muted-foreground whitespace-nowrap rounded-lg">
                  Private
                </p>
                <p className="border px-2 py-1 text-sm text-muted-foreground whitespace-nowrap rounded-lg">
                  Corporate
                </p>
                <p className="border px-2 py-1 text-sm text-muted-foreground whitespace-nowrap rounded-lg">
                  B2B
                </p>
              </div>
            </div>
          </div>
          <Button
            onClick={onClickAddRemoveFollower}
            className={cn(
              "w-24 rounded-full hover:shadow-md flex items-center justify-center border border-purple-500",
              !isFollower && "bg-purple-600 hover:bg-purple-700"
            )}
            variant={isFollower ? "outline" : "default"}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : isFollower ? (
              "Unfollow"
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Follow
              </>
            )}
          </Button>
        </div>
        {/* Tab Content */}
        <TabContentSection userId={userId} jobs={jobs} company={company} />
      </div>
    </div>
  );
};

export default CompanyDetailContentPage;