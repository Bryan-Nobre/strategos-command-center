import { Link2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type ListUrlActionsProps = {
  onClear: () => void;
  showClear?: boolean;
};

export function ListUrlActions({ onClear, showClear = true }: ListUrlActionsProps) {
  function copyLink() {
    void navigator.clipboard.writeText(window.location.href);
    toast.success("Link copiado");
  }

  if (!showClear) {
    return (
      <Button type="button" variant="ghost" size="sm" onClick={copyLink}>
        <Link2 className="mr-2 h-4 w-4" />
        Copiar link
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 pt-2">
      <Button type="button" variant="outline" size="sm" onClick={onClear}>
        <X className="mr-2 h-4 w-4" />
        Limpar filtros
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={copyLink}>
        <Link2 className="mr-2 h-4 w-4" />
        Copiar link
      </Button>
    </div>
  );
}
