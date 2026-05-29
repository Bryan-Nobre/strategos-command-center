import { useState } from "react";
import {
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DEMAND_CATEGORY_LABELS,
  DEMAND_PRIORITY_LABELS,
  DEMAND_STATUS_LABELS,
} from "@/types/domain";
import type { Enums } from "@/types/supabase";

export type DemandFormValues = {
  title: string;
  category: Enums<"demand_category">;
  status: Enums<"demand_status">;
  priority: Enums<"demand_priority">;
  neighborhood: string;
  description: string;
  assigned_to: string;
};

export function DemandFormDialog({
  title,
  team,
  loading,
  initial,
  onSubmit,
}: {
  title: string;
  team: { user_id: string; profiles: { full_name: string | null } }[];
  loading?: boolean;
  initial?: Partial<DemandFormValues>;
  onSubmit: (values: DemandFormValues) => void;
}) {
  const [formTitle, setFormTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState<Enums<"demand_category">>(
    initial?.category ?? "infraestrutura",
  );
  const [status, setStatus] = useState<Enums<"demand_status">>(initial?.status ?? "aberto");
  const [priority, setPriority] = useState<Enums<"demand_priority">>(initial?.priority ?? "media");
  const [neighborhood, setNeighborhood] = useState(initial?.neighborhood ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [assignedTo, setAssignedTo] = useState(initial?.assigned_to ?? "");

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label>Título</Label>
          <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label>Descrição</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label>Categoria</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as Enums<"demand_category">)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DEMAND_CATEGORY_LABELS).map(([k, l]) => (
                  <SelectItem key={k} value={k}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Prioridade</Label>
            <Select
              value={priority}
              onValueChange={(v) => setPriority(v as Enums<"demand_priority">)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DEMAND_PRIORITY_LABELS).map(([k, l]) => (
                  <SelectItem key={k} value={k}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label>Bairro</Label>
            <Input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as Enums<"demand_status">)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DEMAND_STATUS_LABELS).map(([k, l]) => (
                  <SelectItem key={k} value={k}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-2">
          <Label>Responsável</Label>
          <Select
            value={assignedTo || "none"}
            onValueChange={(v) => setAssignedTo(v === "none" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Nenhum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum</SelectItem>
              {team.map((m) => (
                <SelectItem key={m.user_id} value={m.user_id}>
                  {m.profiles.full_name ?? "Membro"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button
          disabled={formTitle.trim().length < 3 || loading}
          onClick={() =>
            onSubmit({
              title: formTitle.trim(),
              category,
              status,
              priority,
              neighborhood,
              description,
              assigned_to: assignedTo,
            })
          }
        >
          {loading ? "Salvando..." : "Salvar"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
