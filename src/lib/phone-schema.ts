import { z } from "zod";
import {
  isValidBrPhone,
  isValidBrPhoneOptional,
  PHONE_INVALID_MSG,
} from "@/lib/normalize-phone";

/** Campo opcional: vazio OK; se preenchido, valida DDD + número BR. */
export const zPhoneBrOptional = z
  .string()
  .optional()
  .refine(isValidBrPhoneOptional, { message: PHONE_INVALID_MSG });

/** Campo obrigatório com DDD + número BR. */
export const zPhoneBrRequired = z
  .string()
  .min(1, "Telefone obrigatório")
  .refine(isValidBrPhone, { message: PHONE_INVALID_MSG });
