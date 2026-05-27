type ListCountFooterProps = {
  shown: number;
  total: number;
  label?: string;
};

export function ListCountFooter({ shown, total, label = "registros" }: ListCountFooterProps) {
  return (
    <div className="border-t border-border p-4 text-sm text-muted-foreground">
      Mostrando {shown} de {total} {label}
      {shown < total && " (filtros aplicados)"}
    </div>
  );
}
