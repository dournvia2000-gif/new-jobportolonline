import React from 'react';
import Box from '@/components/box';
import { auth, currentUser } from '@clerk/nextjs/server';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import NameForm from './_components/name-form';
import EmailForm from './_components/email-form';
import ContactForm from './_components/contact-form';
import ResumeForm from './_components/resume-form';
import CustomBreadCrumb from '@/components/custom-bread-crumd';
import { db } from '@/lib/db';
import { DataTable } from '@/components/ui/data-table';
import { AppliedJobsColumns, columns } from './_components/column';
import { format } from 'date-fns';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { truncate } from 'lodash';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Eye } from 'lucide-react';

const ProfilePage = async () => {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) {
    redirect('/sign-in');
  }

  // Fetch user profile with resumes
  const profile = await db.userProfile.findUnique({
    where: { userId },
    include: {
      resumes: { orderBy: { createdAt: 'desc' } },
    },
  });

  // Fetch all jobs created by user
  const jobs = await db.job.findMany({
    where: { userId },
    include: {
      company: true,
      category: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // ✅ Applied jobs with try/catch safety
  let formattedJobs: AppliedJobsColumns[] = [];
  try {
    const filterAppliedJobs = profile?.appliedJobs?.length
      ? jobs
          .filter((job) =>
            profile.appliedJobs.some((aj) => aj.jobId === job.id)
          )
          .map((job) => ({
            ...job,
            appliedAt: profile.appliedJobs.find((aj) => aj.jobId === job.id)?.appliedAt,
          }))
      : [];

    formattedJobs = filterAppliedJobs.map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company?.name ?? '',
      category: job.category?.name ?? '',
      appliedAt: job.appliedAt ? format(new Date(job.appliedAt), 'MMM do, yyyy') : '',
    }));
  } catch (error) {
    console.error('[PROFILE_PAGE] Failed to fetch applied jobs:', error);
    formattedJobs = [];
  }

  // Fetch followed companies
  const followedCompanies = await db.company.findMany({
    where: {
      followers: {
        has: userId,
      },
    },
    orderBy: {
      createAt: 'desc',
    },
  });

  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-8">
      <Box>
        <CustomBreadCrumb breadCrumbPage="My Profile" />
      </Box>

      <Box className="w-full mt-8 flex flex-col space-y-6 rounded-md border p-4">
        {user?.hasImage && (
          <div className="relative h-24 w-24 aspect-square rounded-full shadow-md">
            <Image
              fill
              src={user.imageUrl}
              alt="User Profile Picture"
              className="object-cover rounded-full"
            />
          </div>
        )}

        <NameForm initialData={profile} userId={userId} />
        <EmailForm initialData={profile} userId={userId} />
        <ContactForm initialData={profile} userId={userId} />
        <ResumeForm initialData={profile} userId={userId} />
      </Box>

      {/* Applied Jobs Section */}
      <Box className="flex-col items-start justify-start mt-12 w-full">
        <h2 className="text-2xl text-muted-foreground font-semibold">
          Applied Jobs
        </h2>
        <div className="w-full mt-6">
          <DataTable columns={columns} searchKey="company" data={formattedJobs} />
        </div>
      </Box>

      {/* Followed Companies Section */}
      <Box className="flex-col items-start justify-start mt-12 w-full">
        <h2 className="text-2xl text-muted-foreground font-semibold">
          Followed Companies
        </h2>
        <div className="mt-6 w-full grid grid-cols-1 md:grid-cols-3 2xl:grid-cols-6 gap-4">
          {followedCompanies.length === 0 ? (
            <p>No Companies followed yet</p>
          ) : (
            followedCompanies.map((com) => (
              <Card key={com.id} className="p-3 space-y-2 relative">
                <div className="w-full flex items-center justify-end">
                  <Link href={`/companies/${com.id}`}>
                    <Button variant="ghost" size="icon">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
                {com.logo && (
                  <div className="w-full h-24 flex items-center justify-center relative overflow-hidden">
                    <Image
                      fill
                      alt="Company Logo"
                      src={com.logo}
                      className="object-contain w-full h-full"
                    />
                  </div>
                )}
                <CardTitle className="text-lg">{com.name}</CardTitle>
                {com.description && (
                  <CardDescription>
                    {truncate(com.description, { length: 80, omission: '...' })}
                  </CardDescription>
                )}
              </Card>
            ))
          )}
        </div>
      </Box>
    </div>
  );
};

export default ProfilePage;
