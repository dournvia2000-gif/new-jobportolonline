"use client";

import Editor from '@/components/editor';
import Preview from '@/components/preview';
import { Button } from '@/components/ui/button';
import {
    FormControl,
    FormField,
    FormItem,
    FormMessage
} from '@/components/ui/form';

import { cn } from '@/lib/utils';
import getGenerateivAIResponse from '@/scripts/aistudio';

import { zodResolver } from '@hookform/resolvers/zod';
import { Job } from '@prisma/client';
import axios from 'axios';
import { Copy, Lightbulb, Loader2, Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import toast from 'react-hot-toast';
import { z } from 'zod';

interface JobDescriptionProps {
    initialData: Job;
    jobId: string;
}

const formSchema = z.object({
    description: z.string().min(1, "Description is required.")
});

const JobDescriptionForm = ({ initialData, jobId }: JobDescriptionProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [rollname, setRollname] = useState("");
    const [skills, setSkills] = useState("");
    const [aiValue, setAiValue] = useState("");
    const [isPrompting, setIsPrompting] = useState(false);

    const router = useRouter();

    const formMethods = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            description: initialData?.description || initialData?.short_description || "",
        },
    });

    const { isSubmitting, isValid } = formMethods.formState;

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            await axios.patch(`/api/jobs/${jobId}`, values);
            toast.success("Job description updated successfully!");
            setIsEditing(false);
            router.refresh();
        } catch {
            toast.error("Something went wrong! Please try again.");
        }
    };

    const toggleEditing = () => {
        if (!isEditing) {
            formMethods.reset({
                description: initialData?.description || initialData?.short_description || "",
            });
            setAiValue(""); // Clear AI box when opening edit
        }
        setIsEditing((current) => !current);
    };

    const handlePromptGeneration = async () => {
        if (!rollname.trim() || !skills.trim()) {
            toast.error("Please enter position and required skills");
            return;
        }

        try {
            setIsPrompting(true);
            const customPrompt = `Could you please draft a job requirements document for the position of ${rollname}? The job description should include roles & responsibilities, key features, and details about the role. The required skills should include proficiency in ${skills}. Additionally, you can list any optional skills related to the job.`;

            const data = await getGenerateivAIResponse(customPrompt);
            const cleanedText = data.replace(/^'|'$/g, "").replace(/[\*\#]/g, "").trim();

            setAiValue(cleanedText);
            toast.success("Generated successfully! Copy and paste into editor if needed.");
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong while generating.");
        } finally {
            setIsPrompting(false);
        }
    };

    const onCopy = () => {
        if (aiValue) {
            navigator.clipboard.writeText(aiValue);
            toast.success("Copied to clipboard");
        }
    };

    return (
        <div className="mt-6 border bg-neutral-100 rounded-md p-4">
            <div className="font-medium flex items-center justify-between">
                Job Description
                <Button onClick={toggleEditing} variant="ghost">
                    {isEditing ? <>Cancel</> : <><Pencil className="w-4 h-4 mr-2" />Edit</>}
                </Button>
            </div>

            {/* View Mode */}
            {!isEditing && (
                <div className={cn("text-sm mt-2", !initialData.description && "text-neutral-500 italic")}>
                    {!(initialData.description || initialData.short_description) ? (
                        "No Description"
                    ) : (
                        <Preview model={initialData.description || initialData.short_description || ""} />
                    )}
                </div>
            )}

            {/* Edit Mode */}
            {isEditing && (
                <>
                    {/* AI Generator Input */}
                    <div className="flex items-center gap-2 my-4">
                        <input
                            type="text"
                            placeholder="e.g. 'Full-Stack Developer'"
                            value={rollname}
                            onChange={(e) => setRollname(e.target.value)}
                            className="flex-1 p-3 rounded-md border"
                        />
                        <input
                            type="text"
                            placeholder="Required Skills (comma separated)"
                            value={skills}
                            onChange={(e) => setSkills(e.target.value)}
                            className="flex-1 p-3 rounded-md border"
                        />
                        {isPrompting ? (
                            <Button disabled>
                                <Loader2 className="w-4 h-4 animate-spin" />
                            </Button>
                        ) : (
                            <Button onClick={handlePromptGeneration}>
                                <Lightbulb className="w-4 h-4" />
                            </Button>
                        )}
                    </div>

                    <p className="text-xs text-muted-foreground text-right mb-4">
                        Note: Enter position name & skills (comma separated)
                    </p>

                    {/* AI Generated Text - Only for Copy */}
                    {aiValue && (
                        <div className="relative mt-4 bg-white rounded-md p-4 border max-h-96 overflow-y-auto">
                            <div className="whitespace-pre-wrap text-sm">
                                {aiValue}
                            </div>
                            <Button
                                className="absolute top-3 right-3 z-10"
                                variant="outline"
                                size="icon"
                                onClick={onCopy}
                            >
                                <Copy className="w-4 h-4" />
                            </Button>
                        </div>
                    )}

                    {/* Froala Editor - Clean (No auto fill) */}
                    <FormProvider {...formMethods}>
                        <form onSubmit={formMethods.handleSubmit(onSubmit)} className="space-y-4 mt-6">
                            <FormField
                                control={formMethods.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Editor 
                                                {...field}
                                                value={field.value || ""}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button disabled={!isValid || isSubmitting} type="submit">
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save
                            </Button>
                        </form>
                    </FormProvider>
                </>
            )}
        </div>
    );
};

export default JobDescriptionForm;