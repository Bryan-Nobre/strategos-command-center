import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SupporterSourceBadge } from "@/components/supporters/SupporterSourceBadge";
import {
  SupporterFormFields,
  supporterFormToPayload,
  supporterToFormValues,
} from "@/components/supporters/SupporterFormFields";
import type { SupporterFormValues } from "@/types/domain";
import type { SupporterListItem } from "@/lib/eleitores-filter";

export function EleitoresEditSheet({
  supporter,
  open,
  onOpenChange,
  leaderships,
  loading,
  onSubmit,
}: {
  supporter: SupporterListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaderships: { id: string; name: string }[];
  loading?: boolean;
  onSubmit: (values: SupporterFormValues) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{supporter?.name ?? "Apoiador"}</SheetTitle>
          <SheetDescription asChild>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {supporter && <SupporterSourceBadge source={supporter.source} />}
              {supporter?.created_at && (
                <span className="text-xs text-muted-foreground">
                  Cadastro:{" "}
                  {format(new Date(supporter.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </span>
              )}
            </div>
          </SheetDescription>
        </SheetHeader>
        {supporter && (
          <SupporterFormFields
            key={supporter.id}
            defaultValues={supporterToFormValues(supporter)}
            leaderships={leaderships}
            loading={loading}
            submitLabel="Salvar alterações"
            onSubmit={onSubmit}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
