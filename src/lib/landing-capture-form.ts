import { z } from "zod";
import { landingCaptureSchema } from "@/types/domain";

export type CaptureForm = z.infer<typeof landingCaptureSchema>;
